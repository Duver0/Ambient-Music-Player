# Skill: Audio Playback Patterns

> Web Audio API patterns for high-quality, low-latency audio playback.

---

## Purpose

Standardize audio engine implementation using Web Audio API. Ensure smooth playback, efficient visualization, and proper resource management.

## Triggers

Loaded when:
- audio-engine-agent implements playback features
- frontend-agent integrates with audio engine

## Rules

1. **Single AudioContext** — create once, resume on user interaction:
   ```ts
   let ctx: AudioContext | null = null
   function getContext(): AudioContext {
     if (!ctx) ctx = new AudioContext()
     if (ctx.state === 'suspended') ctx.resume()
     return ctx
   }
   ```
2. **Audio graph structure:**
   ```
   AudioBufferSourceNode → GainNode → AnalyserNode → Destination
                                    → ConvolverNode (reverb)
                                    → BiquadFilterNode (EQ)
   ```
3. **Decode on load** — decode audio data once, cache decoded buffer
4. **Visualization data** — use AnalyserNode with `getByteFrequencyData()`
5. **Fade in/out** — use GainNode with `linearRampToValueAtTime()`
6. **Error handling** — handle decode errors, context errors, autoplay blocks
7. **Resource cleanup** — disconnect source nodes after playback
8. **Offline playback** — store decoded AudioBuffers in IndexedDB

## Performance Rules

| Operation | Thread | Notes |
|-----------|--------|-------|
| AudioContext creation | Main thread | Once, on first user gesture |
| AudioBuffer decode | Worker thread | Use AudioContext.decodeAudioData |
| Frequency data read | Main thread | Lightweight, 60fps safe |
| Audio file fetch | Main thread | Use fetch + arrayBuffer |

## File Caching Flow

```
User selects file
  → Read as ArrayBuffer (FileReader)
  → decodeAudioData (AudioContext) → AudioBuffer
  → Store AudioBuffer in IndexedDB (for offline)
  → Create BufferSource → connect graph → play
```

## Anti-Patterns

- ❌ Creating multiple AudioContexts (max ~6 per browser)
- ❌ Not resuming AudioContext on user gesture
- ❌ Decoding on audio thread (use AudioContext.decodeAudioData)
- ❌ Leaking BufferSource nodes (always disconnect on ended)
- ❌ Polling AnalyserNode at > 60fps
- ❌ Storing raw audio files in memory (use IndexedDB)
- ❌ Playing without checking AudioContext.state

## Implementation Notes

- Use `OfflineAudioContext` for audio processing/effects
- For seamless looping, set `loop = true` on BufferSource
- Crossfade: overlap two source nodes with gain ramps
- Audio visualizations should use RAF, not setInterval
- Safari requires `AudioContext` on user gesture specifically
