# CuePath — v0.1.4-BETA

[繁體中文版](./README.zh-Hant.md)

CuePath is a lightweight player designed specifically for music transcription and audio reference marking.

> **BETA Notes:**
> - Current version: v0.1.4-BETA.
> - **Professional Saving:** Once a `.cuepath` file is saved/linked, `Ctrl+S` performs a silent overwrite using the File System Access API.
> - **Smart Markers:** Markers now use a dynamic lane system to prevent label overlap.
> - **Region Editing:** Regions can now be resized by dragging their boundaries on the timeline.
> - Tested on Windows; macOS functionality is expected but not fully verified.

The core tool is a single file `CuePath.html`, which can be opened directly in a browser without the need for a server, Node.js, React, PHP, databases, or external packages.

## Files

- `CuePath.html`: Main player and marking tool, containing HTML, CSS, and JavaScript.
- `downloads/`: Suggested directory for downloaded or exported audio files.
- `assets/`, `fonts/`: Local assets and legacy fonts used by the interface.

## Usage

1. Open `CuePath.html` directly in Chrome, Edge, Brave, or Firefox.
2. Click `Load Audio` to select a local audio file.
3. For new projects, the project name will default to the file name.
4. Click anywhere on the timeline to seek.
5. Use Markers, Regions, and A/B Loop for transcription and marking.
6. Use `Export CuePath` to save/link a `.cuepath` project file; use `Import` to restore data.
7. Once linked, use `Ctrl+S` to save changes silently.

## Features

### Audio Playback
- Native browser `<audio>` playback for local files.
- Supports `audio/*` formats depending on browser capabilities.
- Play/Pause and Seek to Start.
- Fast Forward/Rewind: 1s, 3s, 5s, 10s.
- Playback Speed: 0.25x to 2x.

### Timeline
- Full-width timeline for precise alignment.
- Time scale display.
- Click-to-seek support.
- Draggable current position cursor/playhead.
- Waveform visualization using Web Audio API and Canvas.

### A/B Loop
- Supports Set A and Set B.
- Integrated A/B time display within the Loop control group.
- Draggable A/B markers on the timeline.
- Auto-looping logic: jumps back to A when reaching B.
- Create Region from the current A/B Loop.

### Markers
- Add markers at the current playback time.
- **Smart Lanes:** Automatic multi-layer layout to prevent label overlap.
- **Density Control:** Labels automatically hide in crowded areas, showing on hover.
- Features: Edit label/note/tags, status selection, seek, delete, and drag-to-adjust time.

### Regions
- Create regions from A/B Loops.
- **Boundary Dragging:** Resize start/end times directly on the timeline.
- **Table Time Editing:** Edit timecodes directly within the regions table.
- Features: Edit label/note/tags, status selection, seek, delete, and one-click loop activation.

### Import / Export / Saving
- **Professional Save:** Support for persistent file handles; silent overwrite on `Ctrl+S`.
- Export project file (`.cuepath` JSON).
- Import support: `.cuepath`, `.cuepath.json`, `.json`.
- Export to CSV and Markdown tables.

### Storage
- Auto-saves project state to `localStorage`.
- Syncs `isDirty` state with the document title (`*` indicator) and status bar.

### Downloads / Folder API
- Support for File System Access API (Chromium-based browsers).
- **Brave Support:** Guidance for `brave://flags` and specialized re-authorization logic.
- Set a downloads folder to scan for files and auto-reload audio/projects.

## Shortcuts

- `Ctrl + S`: Save project (Silent overwrite if linked, otherwise Save As)
- `Space`: Play / Pause
- `ArrowLeft / Right`: Jump 3s (add `Shift` for 10s, `Alt` for 1s)
- `Home`: Seek to start
- `A / B`: Set Loop A / B
- `L`: Toggle Loop On / Off
- `M`: Add Marker

## Browser Compatibility

- Windows (Fully tested)
- macOS (Core functionality expected to work)
- Chrome / Edge / Brave (Recommended)
- Firefox (Supported, but lacks Folder API)
