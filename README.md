# Ambient Music Player 🎵

Reproductor de música ambiental progresiva con enfoque en productividad, diseñado como **Progressive Web App (PWA)** para una experiencia nativa en cualquier dispositivo.

> **Objetivo:** Crear un espacio sonoro inmersivo para concentración, estudio y trabajo profundo, combinando música ambiental, temporizadores Focus y una interfaz optimizada para móviles.

---

## ✨ Características

- **Reproducción de música ambiental** — Colas de reproducción, crossfade, control de volumen
- **Focus Timer** — Temporizador estilo Pomodoro integrado con la reproducción
- **PWA completo** — Instalable en iOS y Android, funciona offline
- **Mobile-first** — Interfaz optimizada para 375–414px con soporte para notch/isla dinámica
- **Tema oscuro** por defecto, diseñado para uso prolongado
- **Media Session API** — Controles en pantalla de bloqueo y desde el centro de control
- **Gestión de audio profesional** — Cache LRU, manejo de interrupciones, auto-resume en iOS
- **Rendimiento** — Carga inicial < 80 KB gzip con code-splitting agresivo

---

## 🚀 Tecnologías

| Herramienta | Versión | Propósito |
|-------------|---------|-----------|
| [Bun](https://bun.sh/) | ≥ 1.2 | Runtime, empaquetado y gestión de paquetes |
| [Vite](https://vite.dev/) | 8.x | Bundler y dev server |
| [React](https://react.dev/) | 19.x | UI declarativa |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Tipado estático |
| [Tailwind CSS v4](https://tailwindcss.com/) | 4.x | Estilos utilitarios con `@theme` |
| [TanStack Router](https://tanstack.com/router/) | — | Enrutamiento con hash para PWA |
| [Zustand](https://github.com/pmndrs/zustand) | — | Estado global liviano |
| [Dexie](https://dexie.org/) | — | IndexedDB para almacenamiento offline |
| [framer-motion](https://www.framer.com/motion/) | — | Transiciones de página y gestos |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | — | Service Worker y manifest |

---

## 📋 Prerrequisitos

- **Bun** ≥ 1.2.0 — [Instalar Bun](https://bun.sh/docs/installation)

```bash
curl -fsSL https://bun.sh/install | bash
```

Verifica la instalación:

```bash
bun --version
# → 1.2.x
```

---

## 🔧 Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd ambient-music-player

# 2. Instalar dependencias
bun install

# 3. Iniciar servidor de desarrollo
bun run dev
```

El servidor se abrirá en `http://localhost:5173` (o el puerto disponible).

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `bun run dev` | Inicia servidor de desarrollo con HMR |
| `bun run build` | Compila TypeScript + build de producción |
| `bun run preview` | Previsualiza el build de producción localmente |
| `bun install` | Instala/actualiza dependencias |
| `bunx --bun tsc --noEmit` | Verifica tipos sin compilar |

---

## 🏗️ Estructura del proyecto

```
src/
├── app/                  # Punto de entrada y enrutamiento
│   ├── App.tsx           # Componente raíz
│   ├── router.tsx        # Configuración de TanStack Router (hash)
│   └── providers.tsx     # Providers globales
├── components/
│   ├── layout/           # PageShell, BottomNav, AppShell
│   ├── motion/           # Animaciones (PageTransition, BottomSheet, etc.)
│   ├── pwa/              # PwaProvider, PwaInstallPrompt, PwaUpdatePrompt
│   └── ui/               # Componentes reutilizables (Slider, Button, icons, etc.)
├── features/
│   ├── focus-timer/      # Focus Session (temporizador Pomodoro)
│   ├── player/           # NowPlaying, MiniPlayer, Queue
│   ├── playlist/         # Biblioteca y listas de reproducción
│   └── settings/         # Panel de configuración
├── hooks/                # Custom hooks (usePlatform, useVisualViewport, etc.)
├── lib/                  # Utilidades (cn, etc.)
├── pages/                # Páginas lazy-loadeadas
├── pwa/                  # Lógica PWA (install, update)
├── services/
│   ├── audio-engine/     # AudioEngine, AudioContextManager, AudioFocusManager
│   └── storage/          # Dexie database y migraciones
├── stores/               # Zustand stores (ui, player, library, settings)
├── styles/               # CSS global, tokens, animaciones, safe-area
└── types/                # Tipos compartidos
```

### Code Splitting

El proyecto usa code-splitting agresivo para una carga inicial mínima:

| Chunk | Tamaño (gzip) | Contenido |
|-------|---------------|-----------|
| `index-*.js` | **~61 KB** | React + ReactDOM (carga inicial) |
| `App-*.js` | **~28 KB** | App shell, router, stores |
| `PageTransition-*.js` | **~41 KB** | framer-motion (lazy) |
| `import-wrapper-*.js` | **~31 KB** | Dexie (lazy, solo en primer acceso a DB) |
| Cada página | **2–3 KB** | Lazy por ruta |

---

## 🌐 PWA — Instalación

### En Android (Chrome)

1. Abre la app en Chrome
2. Presiona el banner "Install Ambient Player" o el menú ⋮ → "Add to Home Screen"
3. Confirma la instalación

### En iOS (Safari)

1. Abre la app en Safari
2. Presiona el botón **Compartir** (ícono cuadrado con flecha hacia arriba)
3. Desplázate hacia abajo y selecciona **"Add to Home Screen"**
4. Presiona **"Add"** en la esquina superior derecha

> La app aparecerá como una aplicación nativa, sin la barra de navegación de Safari y con soporte para reproducción en segundo plano.

---

## 🧪 Build de producción

```bash
bun run build
```

El output se genera en `dist/` y contiene:

```
dist/
├── index.html
├── manifest.webmanifest
├── sw.js                  # Service Worker (generado por vite-plugin-pwa)
├── workbox-*.js           # Workbox para caching
├── registerSW.js          # Registro del SW
├── assets/
│   ├── index-*.js         # Chunk principal (~61 KB gzip)
│   ├── App-*.js           # App shell (~28 KB gzip)
│   ├── index-*.css        # Estilos (~8 KB gzip)
│   ├── PageTransition-*.js # framer-motion (~41 KB gzip, lazy)
│   └── ...                # Chunks de páginas y componentes lazy
├── icons/
└── favicon.svg
```

Para previsualizar el build localmente:

```bash
bun run preview
```

---

## 🧠 Arquitectura de audio

El motor de audio (`AudioEngine`) maneja:

- **Estados:** IDLE → CONTEXT_READY → LOADING → READY → PLAYING ↔ PAUSED ↔ INTERRUPTED → ENDED/ERROR
- **AudioContext:** Se crea en el primer gesto del usuario (requisito de iOS)
- **Cache LRU:** Hasta 5 buffers, máximo 50 MB
- **Interrupciones:** Phone call, pérdida de Bluetooth, timeout de iOS (30s)
- **Auto-resume:** Detecta cambios de estado del AudioContext y reanuda automáticamente
- **Media Session:** Controles en pantalla de bloqueo (play/pause/prev/next/seek)

---

## 📱 Soporte iOS

| Aspecto | Estado |
|---------|--------|
| Safe areas (notch, Dynamic Island) | ✅ Clases CSS `env()` + `constant()` |
| Teclado virtual | ✅ `useVisualViewport` + `PageShell` |
| AudioContext en primer gesto | ✅ Diferido hasta `play()`/`playTrack()` |
| Auto-resume de audio | ✅ Reconexión automática si iOS cierra el contexto |
| Instalación PWA | ✅ Instrucciones "Share → Add to Home Screen" |
| Pantalla de bloqueo | ✅ Media Session API |

---

## 📄 Licencia

MIT
