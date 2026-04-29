# CuePath(BETA)_MVP

CuePath 是一個本機版音樂採譜／參考音檔標記播放器。核心工具是單一檔案 `CuePath.html`，可直接用瀏覽器開啟，不需要伺服器、Node、React、PHP、資料庫或外部套件。

## 目前檔案

- `CuePath.html`：主要播放器與標記工具，包含 HTML、CSS、JavaScript。
- `downloads/`：建議放置下載或轉出的音檔。（功能尚未實裝）
- `assets/`、`fonts/`：目前介面使用的本機素材與字型。

## 使用方式

1. 直接雙擊 `CuePath.html`，或用 Chrome / Edge / Brave / Firefox 開啟。
2. 按 `載入音檔 Load Audio` 選擇本機音檔。
3. 第一次載入新專案時，會以音檔名稱作為預設值，詢問專案名稱。
4. 在 timeline 上點擊可跳到指定時間。
5. 使用 Marker、Region、A/B Loop 進行採譜標記。
6. 用 `匯出 CuePath` 儲存 `.cuepath` 專案檔，之後可用 `匯入 Import` 還原標記資料。

## 已實作功能

### 音檔播放

- 使用瀏覽器原生 `<audio>` 播放本機音檔。
- 支援 `audio/*`，實際可播放格式依瀏覽器能力而定。
- 可播放 / 暫停。
- 可跳回開頭。
- 支援快退 / 快進：
  - 1 秒
  - 3 秒
  - 5 秒
  - 10 秒
- 支援播放速度：
  - `0.25x`
  - `0.5x`
  - `0.75x`
  - `1x`
  - `1.25x`
  - `1.5x`
  - `2x`

### Timeline

- 全寬 timeline，方便採譜時對齊時間比例。
- 顯示時間刻度。
- 支援點擊 timeline 任意位置跳轉播放位置。
- 目前播放位置的 cursor / playhead 可拖曳。
- 顯示音波圖，使用瀏覽器原生 Web Audio API 解碼並以 canvas 繪製。
- 沒有使用 wavesurfer.js 或任何外部視覺化套件。

### A/B Loop

- 支援 Set A、Set B。
- A/B 位置顯示在 timecode 下方、timeline 上方的獨立 loop bar，不與 Region 混在一起。
- A/B 以 `A▼`、`B▼` 顯示。
- 可開關 Loop。
- Loop On 時：
  - Loop 按鈕變紫色。
  - timecode / A-B 顯示 / timeline 刻度變紫色。
  - 播放到 B 時自動跳回 A。
- A 必須小於 B，否則不允許開啟有效 loop。
- 可從目前 A/B Loop 建立 Region。
- 點選 Region 的 `Loop` 按鈕可直接用該 Region 啟用 loop。

### Marker

- 可在目前播放時間新增 Marker。
- Marker 在 timeline 上以一條垂直線表示，旁邊顯示文字，避免看起來像一段長時間區間。
- Marker 支援：
  - 編輯 label
  - 編輯 note
  - 編輯 tags
  - 狀態選擇
  - 跳轉
  - 刪除
  - timeline 上拖曳調整時間
- Marker 依時間排序。
- Marker 狀態：
  - `todo`
  - `doing`
  - `review`
  - `done`

### Region

- 可由 A/B Loop 建立 Region。
- Region 顯示 start、end、duration。
- Region 支援：
  - 編輯 label
  - 編輯 note
  - 編輯 tags
  - 狀態選擇
  - 跳轉
  - 刪除
  - 一鍵啟用 loop
- Region 依 start 排序。

### 匯入 / 匯出

- 支援匯出 CuePath 專案檔：
  - 副檔名 `.cuepath`
  - 內容為 JSON
  - 不包含音檔本體
- 支援匯入：
  - `.cuepath`
  - `.cuepath.json`
  - `.json`
- 支援匯出 CSV。
- 支援匯出 Markdown。
- CSV 會加入 UTF-8 BOM，方便 Excel 開啟中文。
- Markdown 表格會處理 `|` 與換行。

### 拖曳檔案

- 可把音檔拖到頁面上載入。
- 可把 `.cuepath` 拖到頁面上匯入。
- 可同時拖入音檔與 `.cuepath`，會先匯入專案，再載入音檔。
- 同時拖入音檔與 `.cuepath` 時，不會再詢問專案名稱。

### localStorage

- 自動儲存目前 project state 到 localStorage。
- localStorage key：
  - `cuepath:html:mvp`
- 會保存：
  - project title
  - media metadata
  - playbackRate
  - loop 設定
  - markers
  - regions
- 不會保存音檔本體。
- 重新整理後會還原標記資料。
- 若 state 中有音檔名稱，但瀏覽器沒有音檔本體，會提示重新載入對應音檔。

### 專案檔保護邏輯

- 如果已匯入 `.cuepath`，會視為已經有專案檔。
- 如果已成功 `匯出 CuePath`，會視為已經有專案檔。
- 如果已設定 downloads Folder API，載入音檔後會掃描該資料夾，只要找到 `.cuepath` 或 `.cuepath.json`，就視為已有專案檔。
- 如果目前專案已有工作內容，但還沒有 `.cuepath` 專案檔：
  - 載入其他音檔前會詢問是否先儲存。
  - 不儲存就取消載入新音檔。
  - 關閉或重新整理頁面時，瀏覽器會顯示離開警告。

### Downloads / Folder API

- 介面保留 Downloads 區塊。
- 支援瀏覽器 File System Access API 時，可設定 downloads 資料夾。
- 設定後可：
  - 掃描 downloads 內檔案數與總大小。
  - 嘗試從 downloads 中重新載入 state 記錄的同名音檔。
  - 查詢 downloads 中是否已有 `.cuepath` 專案檔。
- Folder API 支援依瀏覽器而定。
- Chromium 系瀏覽器通常較可能支援。
- Firefox 通常不支援 File System Access API。
- 若 API 不支援，仍可用 `Load Audio` 手動載入音檔。

### 快捷鍵

- `Space`：播放 / 暫停
- `ArrowLeft`：快退 3 秒
- `ArrowRight`：快進 3 秒
- `Shift + ArrowLeft`：快退 10 秒
- `Shift + ArrowRight`：快進 10 秒
- `Alt + ArrowLeft`：快退 1 秒
- `Alt + ArrowRight`：快進 1 秒
- `Home`：回到開頭
- `A`：Set A
- `B`：Set B
- `L`：Loop On / Off
- `M`：新增 Marker

當焦點在 input、textarea、select 或 contenteditable 中時，快捷鍵不會干擾輸入。

## 資料格式

CuePath 專案檔使用 JSON，schemaVersion 固定為：

```json
"cuepath-html-v1"
```

主要結構：

```json
{
  "schemaVersion": "cuepath-html-v1",
  "project": {
    "title": "Untitled Project",
    "createdAt": "ISO string",
    "updatedAt": "ISO string"
  },
  "media": {
    "type": "audio",
    "source": "local",
    "fileName": null,
    "duration": null
  },
  "settings": {
    "playbackRate": 1,
    "skipSmall": 3,
    "skipLarge": 10,
    "loop": {
      "enabled": false,
      "a": null,
      "b": null
    }
  },
  "markers": [],
  "regions": []
}
```

音檔本體不會被寫入 `.cuepath`，只會保存檔名與 duration 等 metadata。

## YouTube 輔助下載

目前 HTML 介面內沒有 YouTube URL 輸入欄位。

專案內保留 Windows 輔助腳本：

- `CuePath-Download-YouTube.bat`
- `CuePath-Download-YouTube.ps1`

這個輔助器需要另外安裝：

```powershell
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
```

HTML 本身不能直接把 YouTube 影片自動轉成音檔，因為瀏覽器本機 HTML 沒有系統層下載與轉檔能力。需要外部工具如 `yt-dlp` 與 `ffmpeg`。

## 瀏覽器與平台

核心功能支援：

- Windows
- macOS
- Chrome
- Edge
- Brave
- Firefox

差異：

- Windows `.bat` / `.ps1` 輔助器只適用 Windows。
- macOS 可使用 `CuePath.html` 核心功能，但需要另做 shell script 才能有同等 YouTube 輔助器。
- Folder API 依瀏覽器支援而定。
- 瀏覽器基於安全限制，不允許一般 HTML 永久記住任意本機音檔路徑；因此重新整理後通常仍需要重新授權或重新載入音檔。

## 不包含的功能

目前沒有實作：

- React / Vue / Vite
- Node.js app
- PHP
- 後端 API
- 資料庫
- 登入
- 雲端同步
- 即時多人協作
- YouTube API
- AI 採譜
- BPM 偵測
- 和弦偵測
- 音高分析
- UVR / Demucs
- 音軌分離
- waveform 外部套件
- Electron / Tauri / PWA

## 注意事項

- `.cuepath` 是專案標記檔，不是音檔。
- 交換 `.cuepath` 給別人時，也需要對方擁有相同或對應的音檔。
- 如果更換音檔，現有 markers / regions 不會自動刪除。
- 使用 `Clear` 才會清空專案資料與 localStorage。
