# Audio Lifecycle Specification

> **Audio state machine, interruptions, background playback, Media Session, focus management.**
> Owner: audio-engine-agent | Authority: HIGH | Sharing: state-management-agent

---

## Table of Contents

1. [Audio Philosophy](#1-audio-philosophy)
2. [Audio State Machine](#2-audio-state-machine)
3. [AudioContext Lifecycle](#3-audiocontext-lifecycle)
4. [Playback Lifecycle](#4-playback-lifecycle)
5. [Audio Interruptions](#5-audio-interruptions)
6. [Media Session API](#6-media-session-api)
7. [Background Playback](#7-background-playback)
8. [Audio Focus Management](#8-audio-focus-management)
9. [Preload Strategy](#9-preload-strategy)
10. [Error Recovery](#10-error-recovery)
11. [iOS Safari Specifics](#11-ios-safari-specifics)
12. [Implementation API](#12-implementation-api)

---

## 1. Audio Philosophy

```yaml
Principles:
  - Audio is the PRIMARY experience — everything else supports it
  - Zero audible glitches: no pops, clicks, gaps, or stutters
  - Zero latency play: from tap to sound in < 50ms
  - Seamless transitions: crossfade between tracks
  - Resilience: recover from any error without user intervention
  - Battery-conscious: audio processing should not dominate power usage

Non-Goals:
  - Streaming audio (local files only)
  - Recording audio
  - Real-time audio effects (EQ filters OK, no reverb convolution)
  - Multi-room / AirPlay
  - Audio analysis (BPM detection, key detection)
```

---

## 2. Audio State Machine

```
                         ┌──────────┐
                         │  IDLE    │
                         │ no ctx   │
                         └────┬─────┘
                              │ first user gesture
                              ▼
                    ┌─────────────────┐
                    │  CONTEXT_READY  │
                    │ ctx created     │
                    │ state: running  │
                    └────────┬────────┘
                             │ loadTrack()
                             ▼
                    ┌─────────────────┐
              ┌─────│    LOADING      │
              │     │ decodeAudioData │
              │     └────────┬────────┘
              │              │ decoded
              │              ▼
              │     ┌─────────────────┐
              │     │    READY        │
              │     │ buffer cached   │
              │     │ not playing     │
              │     └────────┬────────┘
              │              │ play()
              │              ▼
              │     ┌─────────────────┐
              │     │   PLAYING       │
              │     │ source connected│
              │     │ graph active    │
              │     └────────┬────────┘
              │              │
              │     ┌───────┴────────┐
              │     │                │
              │     ▼                ▼
              │  pause()        interrupt()
              │     │                │
              │     ▼                ▼
              │  ┌────────┐   ┌──────────────┐
              │  │ PAUSED │   │ INTERRUPTED  │
              │  │ pos    │   │ incoming call │
              │  │ saved  │   │ alarm, etc    │
              │  └───┬────┘   └───────┬───────┘
              │      │                │
              │      ▼                ▼
              │  resume()        end interrupt
              │      │                │
              └──────┴────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
              ┌──────────┐  ┌──────────┐
              │  ENDED   │  │  ERROR   │
              │ track     │  │ decode/  │
              │ finished  │  │ context  │
              └────┬─────┘  └────┬─────┘
                   │             │
                   ▼             ▼
            nextTrack()    reload/retry
                   │             │
                   └──────┬──────┘
                          ▼
                     ┌──────────┐
                     │  IDLE    │
                     └──────────┘
```

### 2.1 State Transitions

```yaml
IDLE → CONTEXT_READY:
  Trigger: First user gesture (tap play)
  Action: new AudioContext(), resume()
  Error: Context creation failed → IDLE (retry on next gesture)

CONTEXT_READY → LOADING:
  Trigger: loadTrack(track)
  Action: fetch file → ArrayBuffer → decodeAudioData
  Error: Decode failed → CONTEXT_READY (emit error, skip track)

LOADING → READY:
  Trigger: decodeAudioData complete
  Action: cache AudioBuffer, store metadata
  Note: BufferReferenceNode created but not connected

READY → PLAYING:
  Trigger: play()
  Action: create BufferSource → connect graph → start(0)

PLAYING → PAUSED:
  Trigger: pause()
  Action: stop(), save currentTime, disconnect source

PAUSED → PLAYING:
  Trigger: resume()
  Action: create new BufferSource → connect → start(currentTime)

PLAYING → INTERRUPTED:
  Trigger: Phone call, alarm, other app audio
  Action: same as pause, but marked as interrupt

INTERRUPTED → PLAYING:
  Trigger: Interruption ended
  Action: same as resume, auto-restore

PLAYING/PAUSED → ENDED:
  Trigger: sourceNode 'ended' event
  Action: cleanup, emit 'trackEnded', auto-advance

ANY → ERROR:
  Trigger: AudioContext failure, decode failure, file not found
  Action: cleanup, emit error, attempt recovery
```

---

## 3. AudioContext Lifecycle

### 3.1 Creation

```tsx
// AudioContext manager — single instance with auto-recovery
class AudioContextManager {
  private ctx: AudioContext | null = null
  
  async getContext(): Promise<AudioContext> {
    // Auto-recreate if closed
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext()
    }
    
    // Auto-resume if suspended (autoplay policy)
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
    
    return this.ctx
  }
  
  async close(): Promise<void> {
    if (this.ctx && this.ctx.state !== 'closed') {
      await this.ctx.close()
      this.ctx = null
    }
  }
}
```

### 3.2 Creation Rules

```yaml
Rules:
  1. CREATE AudioContext ONLY on first user gesture (tap/click)
  2. RECREATE if state becomes 'closed' (can happen on iOS)
  3. RESUME if state is 'suspended' (autoplay policy)
  4. CLOSE only when app is terminating (rare)
  5. SINGLE instance — never create multiple AudioContexts
  6. MAX 1 AudioContext per app (browsers limit to ~6)
  
iOS Specific:
  - AudioContext must be created INSIDE a user gesture handler
  - Not just any event — must be click/tap (not touchmove, not scroll)
  - If created outside gesture, it starts in 'suspended' state
  - Some iOS versions: resume() requires ANOTHER user gesture
  - Workaround: create context on first tap, resume on second tap if needed
```

---

## 4. Playback Lifecycle

### 4.1 Audio Graph

```
┌──────────────────────────────────────────────────────────────┐
│                      AUDIO GRAPH                             │
│                                                              │
│  AudioBufferSourceNode                                        │
│    ├──→ GainNode (volume)                                     │
│    │     ├──→ AnalyserNode → getByteFrequencyData() → UI      │
│    │     └──→ AudioDestination (speakers)                     │
│    │                                                          │
│    └──→ CrossfadeGain (for track transitions)                  │
│          └──→ MainGain → AnalyserNode → Destination           │
│                                                              │
│  State: audio-engine-agent manages ALL nodes                  │
│  UI:    Only reads AnalyserNode data (frequency array)        │
│  Store: Only reads position, duration, isPlaying              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Play → Stop Cycle

```yaml
play(track):
  1. Ensure AudioContext is ready (getContext)
  2. If current track is playing → fadeOut (50ms) → stop
  3. Load track file:
     a. Check memory cache → if hit, use cached AudioBuffer
     b. Check IndexedDB → if hit, load as Blob → decode
     c. Fallback: fetch from file system → ArrayBuffer → decode
  4. Create BufferSourceNode:
     source = ctx.createBufferSource()
     source.buffer = decodedBuffer
  5. Connect to graph:
     source → gainNode → analyserNode → destination
  6. Configure:
     source.loop = false (unless single-track loop mode)
  7. Start:
     source.start(0, currentTime || 0)
  8. Update store:
     isPlaying = true, currentTrack = track
  9. Update Media Session metadata

pause():
  1. Save currentTime = ctx.currentTime - startOffset
  2. Fade out (50ms linear ramp)
  3. Stop source node
  4. Disconnect source
  5. Update store: isPlaying = false

resume():
  1. Same as play() but with saved currentTime
  2. Instant (no fade in — user expects immediate sound)
  3. Update store: isPlaying = true

stop():
  1. Fade out (100ms)
  2. Stop + disconnect all sources
  3. Reset currentTime
  4. Update store: isPlaying = false, currentTrack = null

seek(time):
  1. If playing: stop current source → create new at time
  2. If paused: update currentTime (source will start at time on resume)
  3. Use crossfade if within 3 seconds of current position (click-free)
```

---

## 5. Audio Interruptions

### 5.1 Interruption Sources

```yaml
Type              Source                    Behavior
──────────────────────────────────────────────────────────────
  Phone call       iOS/OS                   Pause playback
  Alarm            iOS/Android              Pause playback
  Siri/Assistant   iOS                      Pause playback  
  Other app audio  iOS/Android              Duck or pause
  System sounds    iOS/Android              Brief duck (200ms)
  Headphone unplug OS event                 Pause playback
  Bluetooth lost   OS event                 Pause playback

iOS Specific:
  - Audio from Safari (another tab) → Web Audio is suspended
  - Audio from Phone → Web Audio stops, must detect via 'interrupted'
  - No direct interruption event in Web Audio API
  - Workaround: Page Visibility API + AudioContext.state

Android Specific:
  - AudioManager.onAudioFocusChange (via WebAPIs)
  - Can detect "duck" vs "pause" interruptions
```

### 5.2 Interruption Handling

```tsx
// Page Visibility + AudioContext state detection
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // App minimized — handle based on platform
    if (isIOS) {
      // iOS PWA: audio WILL stop — save position
      savePlaybackPosition()
      // Don't pause store state (will auto-pause by OS)
    } else {
      // Android: audio MAY continue — keep playing
    }
  } else {
    // App restored
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    if (audioContext.state === 'closed') {
      // iOS killed the context — recreate
      recreateContext()
      restorePlayback()
    }
  }
})

// iOS-specific interruption via AudioContext state change
audioContext.addEventListener('statechange', () => {
  if (audioContext.state === 'suspended' && wasPlaying) {
    // Interruption detected
    dispatch({ type: 'INTERRUPTED' })
  }
  if (audioContext.state === 'running' && wasInterrupted) {
    // Interruption ended
    dispatch({ type: 'RESTORED' })
    autoResumePlayback()
  }
})
```

### 5.3 Interruption State Machine

```yaml
INTERRUPTED → HANDLING:
  1. Save current isPlaying state
  2. Save currentTime
  3. Pause playback (already happened or force)
  4. Mark as interrupted (not user-paused)
  5. Start a resume timeout (30 seconds — iOS may kill after)

HANDLING → RESTORED:
  1. Detect context.state === 'running'
  2. If wasPlaying before interrupt:
     a. Recreate audio graph
     b. Resume from saved position
     c. Restore volume
  3. Clear interrupt flags

HANDLING → TIMEOUT:
  1. 30 seconds elapsed without restore
  2. Assume interruption is permanent
  3. Stay paused
  4. User must manually resume

SPECIAL CASE — headphone unplug:
  1. Pause immediately (privacy)
  2. Do NOT auto-resume when headphones reconnected
  3. Show notification: "Playback paused — headphones disconnected"
```

---

## 6. Media Session API

### 6.1 Implementation

```tsx
function setupMediaSession() {
  if (!('mediaSession' in navigator)) return
  
  // Metadata
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.album,
    artwork: [
      { src: track.artwork96, sizes: '96x96', type: 'image/png' },
      { src: track.artwork128, sizes: '128x128', type: 'image/png' },
      { src: track.artwork256, sizes: '256x256', type: 'image/png' },
      { src: track.artwork512, sizes: '512x512', type: 'image/png' },
    ],
  })
  
  // Action handlers
  navigator.mediaSession.setActionHandler('play', () => audioEngine.resume())
  navigator.mediaSession.setActionHandler('pause', () => audioEngine.pause())
  navigator.mediaSession.setActionHandler('previoustrack', () => audioEngine.previous())
  navigator.mediaSession.setActionHandler('nexttrack', () => audioEngine.next())
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (details.seekTime) audioEngine.seek(details.seekTime)
  })
  navigator.mediaSession.setActionHandler('stop', () => audioEngine.stop())
  
  // Position state (update every second)
  setInterval(() => {
    if (audioEngine.isPlaying) {
      navigator.mediaSession.setPositionState({
        duration: audioEngine.duration,
        playbackRate: 1,
        position: audioEngine.currentTime,
      })
    }
  }, 1000)
}
```

### 6.2 Required Artwork Sizes

```yaml
Mandatory:
  96x96   — Small notifications
  128x128  — Standard controls
  256x256  — Lock screen (iPhone)
  512x512  — iPad / CarPlay

Rules:
  - ALL four sizes MUST be provided
  - Format: PNG (preferred) or JPEG
  - Max file size: 100KB per image
  - Cached in IndexedDB alongside track metadata
  - Generated on file import (resize from original)
```

### 6.3 iOS Media Session Notes

```yaml
iOS Support:
  - Available from iOS 16.4+
  - Works in PWA (standalone mode)
  - Lock screen controls: play/pause, prev/next
  - "Now Playing" appears on lock screen
  - Position state updates work
  
  Limitations:
    - No background time updates (position freezes when minimized)
    - setPositionState() updates only while app is foreground
    - Lock screen artwork: may not update until next track
```

---

## 7. Background Playback

### 7.1 Platform Capabilities

```yaml
Android (Chrome):
  - Web Audio API CONTINUES in background
  - AudioContext.state stays 'running'
  - Media Session controls work from lock screen
  - No special handling needed (just don't pause on visibility change)
  - Limitation: Chrome may throttle after 5 minutes
    → Mitigation: Use Audio element + Media Source Extensions if persistent bg needed

iOS PWA (Safari):
  - Web Audio API STOPS when PWA is backgrounded
  - AudioContext.state becomes 'suspended'
  - Media Session controls DON'T work (app is suspended)
  - KNOWN LIMITATION — no reliable workaround
  - Mitigations:
    a. Pause gracefully when minimized
    b. Save position for resume
    c. Show local notification (if supported) 
    d. Accept the limitation — design UX accordingly

iOS PWA Workaround (limited):
  - Use <audio> element for background playback
  - <audio> can play in background on iOS PWA (since iOS 16.4?)
  - BUT: <audio> has no Web Audio API features (visualizer, effects)
  - Strategy: <audio> for background, AudioContext for foreground
  - This is complex and fragile — evaluate if needed
```

### 7.2 Background UX Decision

```yaml
RECOMMENDED STRATEGY:
  Accept iOS background limitation.
  
  UX Flow:
    1. User minimizes app
    2. → Pause playback (gracefully, save position)
    3. → "Playback paused" state in UI
    4. User returns to app
    5. → Show "Continue playing" prompt or auto-resume
    6. Playback continues from saved position

  This provides:
    - Predictable behavior
    - No battery drain
    - No complex workarounds
    - Honest UX (user knows app is paused)

  If background playback is CRITICAL (future):
    - Implement <audio> element fallback
    - Must accept: no visualizer, no effects, no audio graph
    - Separate audio path for background vs foreground
```

---

## 8. Audio Focus Management

### 8.1 Multiple Audio Sources

```yaml
The app has TWO audio sources:
  1. Music Player (primary) — full audio graph
  2. Focus Timer — alarm/notification sounds
  
  AND potentially:
  3. Ambient Mix — nature sounds mixed with music

Focus Rules:
  Player + Ambient Mix:
    - Ambient sounds go through a SEPARATE GainNode
    - Player gain = 1.0, Ambient gain = 0.3 (background)
    - Both feed into main AnalyserNode → Destination
    - Ambient ducked when player is active
    
  Player + Timer Alarm:
    - Timer alarm is TRANSIENT (short, important)
    - On alarm: duck player to 0.3 gain
    - After alarm ends (3 seconds): restore player gain
    - Timer alarm uses separate AudioContext or player context?
      → Use player's AudioContext (single context rule)
      → Separate source node with its own gain
  
  Timer Only (Focus mode, no music):
    - Timer uses same AudioContext
    - Simpler graph: OscillatorNode → GainNode → Destination
    - Ambient sounds: separate GainNode, player = inactive
```

### 8.2 Audio Focus Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  AUDIO FOCUS MANAGER                        │
│                                                             │
│  Sources:                                                   │
│    playerSource: AudioBufferSourceNode                      │
│      → playerGain: GainNode { gain: 1.0 }                  │
│                                                             │
│    ambientSource: AudioBufferSourceNode (loop)              │
│      → ambientGain: GainNode { gain: 0.0–0.3 }            │
│                                                             │
│    timerSource: OscillatorNode | AudioBufferSourceNode      │
│      → timerGain: GainNode { gain: 0.0–1.0 }               │
│                                                             │
│  Mix:                                                       │
│    playerGain ─┐                                            │
│    ambientGain ─┼──→ masterGain → analyserNode → dest       │
│    timerGain  ─┘                                            │
│                                                             │
│  Master Gain: controls overall volume (user setting)        │
│  Player Gain: ducked when timer alarm fires                 │
│  Ambient Gain: always low when player active                │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Preload Strategy

### 9.1 Preload Levels

```yaml
Immediate (current track):
  - AudioBuffer cached in memory
  - Decoded and ready to play
  - Preloaded on app start (last session track)

Next track (queue-based):
  - When current track is 70% through → start loading next
  - AudioBuffer decoded in background
  - Cached in memory (temporary, may be GC'd)
  - NOT connected to graph until played

Recent tracks (history):
  - Last 5 played tracks kept decoded in memory
  - LRU eviction
  - Instant replay

Downloaded tracks (playlist):
  - Stored as Blob in IndexedDB
  - Decoded on first play, cached in memory after
  - Re-decoded from IndexedDB on app restart
```

### 9.2 Memory Management

```yaml
Memory Budget:
  - Decoded audio cache: max 50MB
  - Max concurrent decoded buffers: 5
  - Eviction: LRU when budget exceeded
  
  Track size estimation:
    - 3-min MP3 @ 128kbps ≈ 3MB decoded
    - 5-min FLAC ≈ 15MB decoded
    - Buffer 5 tracks @ ~3MB = 15MB (safe)
    - Buffer 5 tracks @ ~15MB = 75MB (EXCEEDS budget)
    
  Strategy:
    - On low-RAM devices (iPhone SE): max 3 buffers
    - On high-RAM devices: max 5 buffers
    - If decode fails from memory pressure → evict oldest
```

---

## 10. Error Recovery

### 10.1 Error Types & Recovery

```yaml
Error                    Cause                    Recovery
────────────────────────────────────────────────────────────────────
  AudioContext suspended  Autoplay policy          resume() on user gesture
  AudioContext closed     iOS timeout/bug          Recreate context
  AudioContext blocked    No user gesture          Show "Tap to play" prompt
  Decode failed           Corrupted/unsupported    Skip track, report error
  File not found          File deleted/moved       Remove from queue, notify
  SourceNode ended        Track finished           Auto-advance to next
  SourceNode error        Internal browser bug     Disconnect, recreate
  QuotaExceeded          Storage full             Clean cache, warn user

Recovery Flow:
  1. Detect error (try/catch + event listeners)
  2. Log error (console only in dev — no user-facing logs)
  3. Attempt automatic recovery (retry 1x)
  4. If recoverable → resume transparently
  5. If not recoverable → skip track, show notification
  6. If critical (AudioContext dead) → full reset
```

### 10.2 Critical Error Handling

```tsx
async function handleCriticalError(error: AudioError) {
  switch (error.type) {
    case 'CONTEXT_CLOSED':
    case 'CONTEXT_SUSPENDED':
      // Attempt full recovery
      await audioContextManager.close()
      await audioContextManager.getContext()
      // Restore audio graph
      await reconnectGraph()
      // Resume if was playing
      if (wasPlaying) resume()
      break
      
    case 'DECODE_FAILED':
      // Log, skip track
      dispatch({ type: 'TRACK_ERROR', trackId: error.trackId })
      playNext()
      break
      
    case 'FILE_NOT_FOUND':
      // Remove from queue + IndexedDB
      await removeFromStorage(error.trackId)
      playNext()
      break
      
    case 'UNKNOWN':
      // Hard reset
      await audioContextManager.close()
      dispatch({ type: 'STOP' })
      break
  }
}
```

---

## 11. iOS Safari Specifics

```yaml
Known Issues & Mitigations:
  
  1. AudioContext creation requires user gesture
     Mitigation: create on first tap, show "Tap to play" if blocked
  
  2. AudioContext dies in background
     Mitigation: Pause on minimize, resume on return
     
  3. AudioContext may close randomly (rare)
     Mitigation: Auto-recreate on next interaction
     
  4. decodeAudioData may fail for large files (> 30MB)
     Mitigation: Show loading progress, decode in chunks (if possible)
     
  5. Media Session only from iOS 16.4+
     Mitigation: Check availability, degrade gracefully
     
  6. No Web Audio in background (even with <audio> hack)
     Mitigation: Accept limitation, design UX accordingly
     
  7. Audio latency is higher on iOS (~50ms vs ~10ms Android)
     Mitigation: No real-time monitoring needed → acceptable
     
  8. No audio focus events (no 'audiofocuschange')
     Mitigation: Use page visibility + state change detection
```

---

## 12. Implementation API

### 12.1 Audio Engine Interface

```tsx
interface AudioEngine {
  // Lifecycle
  init(): Promise<void>
  destroy(): Promise<void>
  
  // Playback
  play(): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  stop(): Promise<void>
  seek(time: number): Promise<void>
  
  // Track management
  loadTrack(track: Track): Promise<void>
  playTrack(track: Track): Promise<void>
  next(): Promise<void>
  previous(): Promise<void>
  
  // Volume
  setVolume(vol: number): void  // 0.0 – 1.0
  getVolume(): number
  fadeOut(duration: number): Promise<void>
  fadeIn(duration: number): Promise<void>
  
  // State
  getState(): AudioState
  getCurrentTime(): number
  getDuration(): number
  getAnalyserData(): Uint8Array  // frequency data for UI
  
  // Events
  on(event: AudioEvent, handler: Function): void
  off(event: AudioEvent, handler: Function): void
  
  // Focus
  setAudioFocus(source: AudioSource): void
  releaseAudioFocus(source: AudioSource): void
  
  // Background
  handleVisibilityChange(visible: boolean): void
  handleInterruption(type: InterruptionType): void
}

type AudioState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'interrupted' | 'error'
type AudioEvent = 'stateChange' | 'trackEnded' | 'trackError' | 'timeUpdate' | 'interruption'
type AudioSource = 'player' | 'ambient' | 'timer'
```

### 12.2 Store Integration

```tsx
// What lives in Zustand (state-mgmt-agent):
interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  isInterrupted: boolean
  volume: number
  currentTime: number
  duration: number
  playbackMode: 'normal' | 'shuffle' | 'repeat-one' | 'repeat-all'
}

// What lives in AudioEngine (audio-engine-agent):
//   AudioContext instance
//   AudioNode graph
//   AudioBuffer cache
//   AnalyserNode data
//   Fade timers
//   Interruption state machine

// Communication:
//   audioEngine → store: stateChange events
//   store → audioEngine: action dispatches (play, pause, seek)
//   UI reads: store (isPlaying, currentTime) + audioEngine (analyserData)
```

> **Version:** 1.0.0
> **Last Updated:** 2026-05-27
> **Approved by:** audio-engine-agent, state-management-agent
