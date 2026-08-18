# AURA / FORM

A browser-based video editor for reshaping a luminous AI agent and art-directing its aura in real time.

**Live demo:** [aura-form-studio.vapormaxgyp.chatgpt.site](https://aura-form-studio.vapormaxgyp.chatgpt.site)

## Features

- Six agent forms: orb, squircle, crystal, droplet, star core, and capsule
- Custom aura and core-highlight colors
- Shape size, glow spread, and opacity controls
- Drag-to-position editing directly on the video preview
- Import your own video files
- Record and export the finished composition as WebM
- Responsive editor UI for desktop and mobile

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal.

## Production build

```bash
npm run build
```

## How it works

The source video is drawn to an HTML canvas frame by frame. A configurable procedural shape and multi-layer glow are composited on top using Canvas 2D. Export uses `canvas.captureStream()` and `MediaRecorder`, so processing stays in the browser and uploaded videos are not sent to a server.

## Stack

- React 19
- TypeScript
- vinext / Vite
- Canvas 2D and MediaRecorder APIs

## Browser notes

Recent Chromium-based browsers provide the best export support. Exported files use WebM because browser-native MP4 recording support varies.
