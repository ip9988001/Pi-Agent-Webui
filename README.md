# Pi Agent WebUI

Customized Web UI for **Pi Agent**, rebuilt from the original `@agegr/pi-web` and enhanced for a more practical day-to-day workflow.

[Chinese README](./README.zh-CN.md)

## Overview

This version changes the original interaction model from:

- left sidebar
- center chat area
- right file preview

to a more editor-friendly layout:

- left sidebar for sessions and file explorer
- **center file editor**
- **right chat workspace**

It also adds direct text file editing, autosave, file write-back support, and a built-in Chinese voice interaction system.

## Screenshots

### Main UI

![Pi Agent WebUI main layout](./docs/images/ui-overview.png)

### Server Startup

![Pi Agent WebUI server startup](./docs/images/server-console.png)

## Key Enhancements Compared to the Original

### 1. New workspace layout
- Keeps the left sidebar for sessions and project navigation.
- Moves the file workspace to the center.
- Moves the chat workspace to the right.

### 2. Direct file editing
- Text files open in editable mode by default.
- Supports `Save`, `Discard`, and autosave.
- Supports `Ctrl+S / Cmd+S`.
- Adds file write-back through the file API `PUT` route.

### 3. Built-in voice features
- Voice is built into the WebUI instead of relying on a browser extension.
- Chinese toolbar controls in the chat header for:
  - voice toggle
  - recording
  - speech playback
  - settings
- Browser-native speech recognition and speech synthesis.
- Push-to-talk flow with live recognition bubble.
- Delayed send / cancel-send workflow for safer voice input.

### 4. Better text-to-speech behavior
- Cleans Markdown noise before playback.
- Avoids reading large code blocks and raw formatting verbosely.
- Faster default speech rate (`1.8`).

## Tech Notes

### Runtime dependencies
This project does **not** add a new third-party voice npm package.

Voice features rely on browser-native APIs:
- `SpeechRecognition / webkitSpeechRecognition`
- `speechSynthesis`

Recommended browsers:
- Chrome
- Edge

Microphone permission is required for speech input.

## Getting Started

This repository is intended to be run from source.

### 1. Clone this repository

```bash
git clone https://github.com/ip9988001/Pi-Agent-Webui.git
cd Pi-Agent-Webui
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start in development mode

```bash
npm run dev
```

Default dev URL:

```text
http://localhost:30141
```

### 4. Build for production

```bash
npm run build
```

### 5. Start production server

```bash
npm start
```

## Project Structure

```text
app/
  api/
    agent/
    auth/
    cwd/
    default-cwd/
    files/
    home/
    models/
    models-config/
    sessions/
    skills/
components/
hooks/
lib/
public/
docs/
```

## Main Modified Files

- `components/AppShell.tsx`
- `components/ChatInput.tsx`
- `components/ChatWindow.tsx`
- `components/FileViewer.tsx`
- `components/VoiceControls.tsx`
- `hooks/useVoiceChat.ts`
- `app/api/files/[...path]/route.ts`
- `app/page.tsx`
- `package.json`

For a more detailed description, see:

- [Customization Notes (Chinese)](./docs/CUSTOMIZATION_NOTES.zh-CN.md)
- [Changed Files List (Chinese)](./docs/CHANGED_FILES.zh-CN.md)

## Files You Should Commit

Commit the source files and config files in this repository, but **do not** commit:

- `.next/`
- `node_modules/`
- `.codegraph/`
- `*.log`
- `tsconfig.tsbuildinfo`

## License

MIT
