# CuePath — v0.1.2-BETA

[English Version](./README.md)

CuePath 是一個專為音樂採譜與參考音檔標記設計的輕量級播放器。

> **BETA 測試說明：**
> - 目前版本為 v0.1.2-BETA.
> - 已實作檔案關聯狀態顯示資訊欄。
> - 已實作 A/B Loop 標記點拖曳功能。
> - 部分功能（如下載目錄追蹤等）尚未完全實裝測試。
> - 已在 Windows 環境測試正常，macOS 尚未經過完整測試。

核心工具是單一檔案 `CuePath.html`，可直接用瀏覽器開啟，不需要伺服器、Node、React、PHP、資料庫或外部套件。

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
- 支援快退 / 快進：1 秒、3 秒、5 秒、10 秒。
- 支援播放速度：0.25x 到 2x。

### Timeline

- 全寬 timeline，方便採譜時對齊時間比例。
- 顯示時間刻度與點擊跳轉。
- 目前播放位置的 cursor / playhead 可拖曳。
- 顯示音波圖（使用 Web Audio API 解碼並以 Canvas 繪製）。

### A/B Loop

- 支援 Set A、Set B 與獨立 Loop Bar。
- 標記點可在時間軸上直接拖曳調整。
- 循環模式開啟時，播放到 B 會自動跳回 A。
- 可從目前 A/B Loop 建立 Region。

### Marker (標記點)

- 可在目前播放時間新增 Marker。
- 支援編輯標題、筆記、標籤、狀態選擇、跳轉、刪除與拖曳調整時間。
- 狀態包含：`todo`、`doing`、`review`、`done`。

### Region (區段)

- 可由 A/B Loop 建立 Region。
- 顯示開始、結束、持續時間。
- 支援編輯標題、筆記、標籤、狀態選擇、跳轉、刪除與一鍵啟用循環。

### 匯入 / 匯出

- 支援匯出專案檔 (.cuepath JSON)。
- 支援匯入 .cuepath、.json。
- 支援匯出 CSV 與 Markdown 表格。

### 拖曳檔案

- 支援拖入音檔、專案檔，或同時拖入兩者以自動載入。

### localStorage

- 自動儲存專案狀態（不含音檔本體）至瀏覽器 localStorage。

### Downloads / Folder API (實驗性)

- 支援瀏覽器 File System Access API（Chromium 系瀏覽器）。
- 可設定下載資料夾以自動掃描與重新載入音檔。

## 快捷鍵

- `Space`：播放 / 暫停
- `ArrowLeft / Right`：跳轉 3 秒 (加 `Shift` 跳轉 10 秒, 加 `Alt` 跳轉 1 秒)
- `Home`：回到開頭
- `A / B`：設定 A / B 循環點
- `L`：循環開關
- `M`：新增 Marker

## 瀏覽器與平台

- Windows (完整測試)
- macOS (核心功能應可運行)
- Chrome / Edge / Brave (建議使用)
- Firefox (支援，但無 Folder API)

## 注意事項

- `.cuepath` 是專案標記檔，不包含音檔。
- 字體已調整為系統內建之可商用黑體，確保顯示美觀與法律安全。
