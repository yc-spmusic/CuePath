# 更新日誌 / CHANGELOG

所有對 CuePath 的重要更新都會記錄在此檔案中。 / All notable changes to CuePath will be documented in this file.

## [0.2.1-BETA] - 2026-10-17

### 新增功能 / New Features
- **`ui.headerActions`**: 設為 `false` 可隱藏工具列的匯入／匯出／清除按鈕，預設仍顯示。 / `ui.headerActions: false` hides the toolbar import/export/clear buttons; default unchanged (shown).
- **`clearProject()`**: 新增公開 API，行為同「清除」按鈕但**不會跳出確認視窗**，確認由宿主負責；會觸發 `change` 事件。 / New public API behaving like the Clear button but **without the confirm dialog** (the host app confirms); emits `change`.

---

## [0.2.0-BETA] - 2026-10-17

### 新增功能 / New Features
- **可嵌入的播放器核心 / Embeddable Player Core**: 播放器（音檔控制、波形、A/B Loop、速度、Marker/Region、快速鍵、匯出）抽成 ES module `src/cuepath-core.js`（`createCuePath(root, options)`）與限定在 `.cuepath-root` 之下的 `src/cuepath-core.css`，供其他網頁應用（例如 React 元件）掛載。 / The player (audio control, waveform, A/B loop, speed, markers/regions, shortcuts, export) is extracted into the ES module `src/cuepath-core.js` (`createCuePath(root, options)`) with CSS scoped under `.cuepath-root`, so other web apps (e.g. a React component) can mount it.
- **loadUrl 與預先計算的波形 / loadUrl with Pre-computed Peaks**: `loadUrl(url, { peaksUrl | peaks })` 以 `<audio src>` 串流播放，有 peaks 時不會下載或解碼整個檔案；沒有 peaks 時沿用原本的整檔解碼。Peaks 格式見 `docs/peaks-format.md`。 / `loadUrl` streams through `<audio src>` and never decodes the file when peaks are supplied; without peaks the previous whole-file decode is used. Format: `docs/peaks-format.md`.
- **可設定項目 / Configurable**: `storageKey`、`crossOrigin`、`labels`（所有介面文字皆可覆寫，預設為原本文字）、`ui`、`shortcuts`、`dragDrop`、`header`；`on/off` 事件、`getState/setState`、`destroy()`（移除所有監聽、動畫幀、fetch、AudioContext）。 / Options `storageKey`, `crossOrigin`, `labels` (every UI string overridable, defaults unchanged), `ui`, `shortcuts`, `dragDrop`, `header`; `on/off` events, `getState/setState`, leak-free `destroy()`.
- **建置流程 / Build Step**: `npm run build`（esbuild）產生 `CuePath.html`（單檔，內嵌 CSS 與 IIFE，雙擊 `file://` 即可使用）、`dist/cuepath-core.mjs`、`dist/cuepath-core.css`。`npm test` 以無頭瀏覽器驗證。 / `npm run build` (esbuild) generates the single-file `CuePath.html` (inlined CSS + IIFE, works by double-click over `file://`), `dist/cuepath-core.mjs` and `dist/cuepath-core.css`. `npm test` verifies in a headless browser.

### 優化與調整 / Improvements
- **波形資料 / Waveform Data**: 內部改用 min/max peaks（與 `peaks-format` 相同），繪製時依畫面寬度聚合；波形外觀由對稱的絕對值包絡，變為真實的 min/max。 / Internally the waveform now uses min/max peaks (the documented format), aggregated per pixel when drawn; the look changes from a symmetric absolute-value envelope to true min/max.
- **快速鍵 / Shortcuts**: 在輸入框（含專案標題）內輸入時不再觸發 Space/A/B/L/M；`Ctrl`/`Cmd` 組合鍵（`Ctrl+S` 除外）不再被當成單鍵快速鍵。獨立版的快速鍵仍作用於整個文件。 / Typing in inputs (including the project title) no longer triggers Space/A/B/L/M, and Ctrl/Cmd combos (other than Ctrl+S) are no longer treated as plain-key shortcuts. The standalone app keeps document-wide shortcuts.
- **音檔錯誤訊息 / Audio Error Message**: 音檔載入失敗時顯示錯誤訊息。 / A load failure of the audio element now shows an error message.

---

## [0.1.4-BETA] - 2026-04-29

### 新增功能 / New Features
- **專業儲存體驗 / Professional Saving Experience**: 實裝 File System Access API 的持久化 Handle。一旦設定過儲存路徑，`Ctrl+S` 將直接覆寫檔案，不再重複彈出下載視窗。 / Implemented persistent file handles via File System Access API. Once a save path is set, `Ctrl+S` silently overwrites the file without redundant download prompts.
- **Region 邊界拖曳 / Region Boundary Dragging**: 現在可以直接在時間軸上拖曳 Region 的左右邊緣來縮放開始與結束時間。 / Added support for dragging the left and right boundaries of a Region on the timeline to resize its duration.
- **Region 表格時間編輯 / Region Table Time Editing**: 在 Region 表格中新增「編輯時間」功能，支援直接輸入時間碼進行精確調整。 / Added an "Edit Time" feature in the regions table, allowing precise manual entry of timecodes.
- **Marker 智能避讓系統 / Marker Smart Lane System**: 實裝自動軌道佈局，防止標籤文字相互重疊；在極度擁擠時自動隱藏標籤，僅在懸停時顯示。 / Implemented a dynamic lane system for Markers to prevent label overlap. Labels automatically hide in high-density areas and reveal on hover.

### 優化與調整 / Improvements
- **Brave 瀏覽器優化 / Brave Browser Optimizations**: 針對 Brave 的存取限制新增了 `brave://flags` 引導語，並在權限失效時提供「重新授權」按鈕。 / Added `brave://flags` guidance for Brave's restrictions and a "Re-authorize" button for expired permissions.
- **介面佈局精煉 / UI Layout Refinement**: 將 A/B 點的時間顯示移至 Loop 控制組中，並在狀態列顯示目前連結的專案檔名。 / Moved A/B time displays to the Loop control group and added the linked project filename to the status bar.
- **狀態同步修正 / Status Sync Logic Fix**: 修正了 `isDirty` 在重新整理或匯入後的同步問題，確保標題 `*` 號準確反映檔案狀態。 / Refined the `isDirty` logic to ensure the `*` indicator accurately reflects the file sync state across refreshes and imports.

---

## [0.1.3-BETA] - 2026-04-29

### 新增功能 / New Features
- **Ctrl+S 快速鍵 / Ctrl+S Shortcut**: 現在可以使用 `Ctrl+S` (或 `Cmd+S`) 快速匯出專案檔。 / Added `Ctrl+S` (or `Cmd+S`) shortcut to quickly export the project file.
- **未儲存狀態提醒 / Unsaved Changes Indicator**: 當專案內容有變動但尚未匯出時，瀏覽器分頁標題會顯示 `*` 號，且資訊欄會顯示「檔案未儲存」。 / Added an asterisk `*` to the browser title and an "Unsaved" status in the info bar when there are unsaved changes.

### 優化與調整 / Improvements
- **狀態同步 / Status Syncing**: 匯出或匯入檔案後，會自動清除未儲存狀態。 / Automatically clears the unsaved status after exporting or importing a file.

---

## [0.1.2-BETA] - 2026-04-29

### 新增功能 / New Features
- **檔案關聯狀態顯示 / File Association Status Display**: 在資訊欄新增「專案 (Project)」狀態，顯示目前是否已連結 `.cuepath` 檔案或僅為暫存。 / Added a "Project" status chip to the info bar, indicating if the session is linked to a `.cuepath` file or just stored in local cache.
- **下載資料夾顯示 / Folder Name Visibility**: 現在會顯示目前所選取的 downloads 資料夾名稱。 / Now displays the name of the selected downloads folder.

### 優化與調整 / Improvements
- **狀態顏色編碼 / Status Color Coding**: 使用顏色（綠色/紅色）更直觀地顯示音檔與專案的載入/連結狀態。 / Used color coding (green/red) to more intuitively show the loading/linking status of audio and projects.

---

## [0.1.1-BETA] - 2026-04-29

### 新增功能 / New Features
- **A/B Loop 拖曳 / A/B Loop Dragging**: 現在可以直接在時間軸上拖曳 A 與 B 標記點來調整循環區間。 / Added support for dragging A and B markers directly on the timeline to adjust loop points.

### 優化與調整 / Improvements
- **字體更換 / Font Update**: 切換為系統內建的可商用黑體組合（system-ui），確保法律安全與各平台美觀。 / Switched to system-native Gothic font stacks (system-ui) for legal safety and cross-platform consistency.
- **版本標示 / Version Label**: 在頂部導覽列加入版本號顯示。 / Added version label in the top navigation bar.

---

## [0.1.0-BETA] - 2026-04-29

### 初始版本發布 / Initial Release
- 支援基礎音檔播放與波形顯示。 / Support for basic audio playback and waveform visualization.
- 支援 Marker 與 Region 標記功能。 / Support for Marker and Region marking features.
- 支援專案匯入/匯出 (.cuepath)。 / Support for project import/export (.cuepath).
- 支援 CSV 與 Markdown 匯出。 / Support for CSV and Markdown export.
- 支援 Windows YouTube 輔助下載腳本。 / Support for Windows YouTube download helper scripts.
- 支援 localStorage 自動儲存。 / Support for localStorage auto-save.
