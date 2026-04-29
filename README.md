# CuePath — v0.1.1-BETA

[繁體中文版](./README.zh-Hant.md)

CuePath is a lightweight player designed specifically for music transcription and audio reference marking.

> **BETA Notes:**
> - Current version: v0.1.1-BETA.
> - A/B Loop dragging functionality is now implemented.
> - Some advanced features (e.g., download folder tracking) are still under development and testing.
> - Tested on Windows; macOS functionality is expected but not fully verified.

The core tool is a single file `CuePath.html`, which can be opened directly in a browser without the need for a server, Node.js, React, PHP, databases, or external packages.

## Files

- `CuePath.html`: Main player and marking tool, containing HTML, CSS, and JavaScript.
- `downloads/`: Suggested directory for downloaded or exported audio files (auto-tracking not yet implemented).
- `assets/`, `fonts/`: Local assets and legacy fonts used by the interface.

## Usage

1. Open `CuePath.html` directly in Chrome, Edge, Brave, or Firefox.
2. Click `Load Audio` to select a local audio file.
3. For new projects, the project name will default to the file name.
4. Click anywhere on the timeline to seek.
5. Use Markers, Regions, and A/B Loop for transcription and marking.
6. Use `Export CuePath` to save a `.cuepath` project file; use `Import` to restore data later.

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
- Independent loop bar above the timeline.
- Draggable A/B markers on the timeline.
- Auto-looping logic: jumps back to A when reaching B.
- Create Region from the current A/B Loop.

### Markers
- Add markers at the current playback time.
- Markers displayed as vertical lines with text labels.
- Features: Edit label/note/tags, status selection, seek, delete, and drag-to-adjust time.
- Statuses: `todo`, `doing`, `review`, `done`.

### Regions
- Create regions from A/B Loops.
- Displays start, end, and duration.
- Features: Edit label/note/tags, status selection, seek, delete, and one-click loop activation.

### Import / Export
- Export project file (`.cuepath` JSON).
- Import support: `.cuepath`, `.cuepath.json`, `.json`.
- Export to CSV and Markdown tables.

### Drag and Drop
- Drag audio files onto the page to load.
- Drag `.cuepath` files to import project data.
- Simultaneous drag-and-drop of audio and project files supported.

### Storage
- Auto-saves project state to `localStorage`.
- Saves project title, metadata, playback settings, markers, and regions (excludes audio data).

### Downloads / Folder API (Experimental)
- Support for File System Access API (Chromium-based browsers).
- Set a downloads folder to scan for files and auto-reload audio/projects.

## Shortcuts

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

## Notes

- `.cuepath` files contain marking data, not the audio itself.
- When sharing projects, both the `.cuepath` and the corresponding audio file must be provided.
- Fonts used are system-native Gothic stacks for legal and performance reasons.
