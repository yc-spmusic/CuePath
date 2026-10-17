/*
 * CuePath core - reusable player / marker / region / A-B loop engine.
 *
 *   import { createCuePath } from "./cuepath-core.js";
 *   import "./cuepath-core.css";            // or <link rel="stylesheet">
 *   const cp = createCuePath(element, { storageKey: "hub:123" });
 *   await cp.loadUrl("/audio/123/stream", { peaksUrl: "/audio/123/peaks.json" });
 *   ...
 *   cp.destroy();
 *
 * Peaks JSON format: see docs/peaks-format.md.
 * This file contains no brand / organisation strings: all visible text lives in
 * DEFAULT_LABELS and can be overridden through options.labels.
 */

export const SCHEMA_VERSION = "cuepath-html-v1";
export const PEAKS_VERSION = 1;
export const DEFAULT_STORAGE_KEY = "cuepath:html:mvp";

const DOWNLOADS_DB_NAME = "cuepath-downloads-db";
const DOWNLOADS_STORE_NAME = "handles";
const DOWNLOADS_HANDLE_KEY = "downloads";
const STATUS_OPTIONS = ["todo", "doing", "review", "done"];
const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const DECODE_BUCKETS = 1800;

/* Every user visible string. "{name}" style placeholders are substituted. */
export const DEFAULT_LABELS = {
  // toolbar
  projectTitleAria: "Project Title",
  importProject: "匯入 Import",
  exportProject: "匯出 CuePath",
  exportCsv: "匯出 CSV",
  exportMarkdown: "匯出 MD",
  clearProject: "清除 Clear",
  // control bar
  loadAudio: "匯入音檔 Import Audio",
  chipAudio: "音檔 Audio",
  chipProject: "專案 Project",
  chipNow: "位置 Now",
  chipLength: "總長 Length",
  fileNone: "尚未載入",
  fileUnknown: "未知檔案",
  messageInitial: "尚未匯入音檔",
  messageNoAudio: "尚未載入音檔",
  projectStatusInitial: "尚未儲存/匯入",
  projectUnsaved: "● 檔案未儲存",
  projectSynced: "● 檔案已同步",
  projectDetached: "○ 連結已斷開 (請重新另存)",
  projectCacheOnly: "僅瀏覽器暫存 (未儲存)",
  downloadsTitle: "Downloads",
  downloadsDefault: "下載到 downloads 資料夾 / Save to downloads folder",
  downloadsHint: "Chrome/Edge can remember an authorized local downloads folder.",
  downloadsSet: "設定 Set",
  downloadsRefresh: "更新 Refresh",
  downloadsReauthorize: "重新授權 Re-authorize",
  play: "播放 Play",
  pause: "暫停 Pause",
  speed: "速度 Speed",
  loop: "Loop",
  loopOn: "循環開 Loop On",
  loopOff: "循環關 Loop Off",
  loopClear: "清除 Clear",
  loopToRegion: "＋區段 Region",
  // panels
  markersTitle: "Markers",
  addMarker: "＋ 新增 Marker / Add",
  regionsTitle: "Regions",
  addRegion: "＋ 從 Loop 建立 / Add",
  timelineEmpty: "載入音檔後可在時間軸上設置 Marker 與 Region",
  waveformAnalyzing: "音波分析中 / analyzing waveform...",
  waveformLoading: "載入音波圖 / loading waveform...",
  waveformUnavailable: "無法產生音波圖 / waveform unavailable",
  emptyMarkers: "尚無 Marker / No markers. Press 「＋ 新增 Marker / Add」 to create one at the current time.",
  emptyRegions: "尚無 Region。設定 A-B Loop 後按下「＋區段」建立。",
  thTime: "時間",
  thLabel: "標籤",
  thNote: "備註",
  thTags: "標記",
  thStatus: "狀態",
  thActions: "操作",
  thStart: "起始",
  thEnd: "結束",
  thLength: "長度",
  rowJump: "跳至 Jump",
  rowDelete: "刪除 Delete",
  rowEditTime: "編輯時間",
  rowEditDone: "完成",
  rowLoop: "Loop",
  tagsPlaceholder: "tag1, tag2",
  defaultMarkerLabel: "Marker",
  defaultRegionLabel: "Region",
  defaultProjectTitle: "Untitled Project",
  dropHint: "拖曳音檔或 CuePath 檔案至此",
  // messages
  msgNeedAudio: "請先匯入音檔",
  msgSaved: "已儲存",
  msgInvalidStorage: "儲存資料無效",
  msgAudioLoaded: "音檔已載入：{name}",
  msgAudioError: "音檔載入失敗",
  msgReloadAudio: "請重新載入對應音檔：{name}",
  msgNeedAB: "請先設定 A 和 B 點",
  msgAAfterB: "A 點必須在 B 點之前",
  msgInvalidRegion: "無效的區段範圍",
  msgLoopEnabled: "已啟用循環：{label}",
  msgImportCancelled: "已取消匯入其他音檔",
  msgUnsupportedFile: "不支援的格式。請拖曳音檔或 .cuepath 檔案。",
  msgSaveCancelled: "已取消儲存",
  msgProjectSavedFile: "專案已儲存至檔案",
  msgProjectDownloaded: "專案已匯出下載",
  msgProjectImported: "專案已匯入",
  msgInvalidProjectFile: "無效的 CuePath JSON 檔案",
  msgCsvExported: "CSV 已匯出",
  msgMarkdownExported: "Markdown 已匯出",
  msgProjectCleared: "專案已清除",
  msgReloadedFromDownloads: "已從 downloads 重新載入：{name}",
  msgDownloadsMissing: "downloads 找不到對應音檔：{name}",
  msgDownloadsSet: "downloads folder 已設定",
  msgDownloadsSetFailed: "downloads folder 設定失敗",
  msgDownloadsRefreshFailed: "downloads refresh failed",
  msgFolderApiMissing: "目前瀏覽器未開放 Folder API；請用 Import Audio 匯入 downloads 檔案",
  msgFolderApiBrave: " (Brave 使用者請檢查 brave://flags/#file-system-access-api)",
  msgFolderBrave: "無法存取資料夾。Brave 使用者請確保已在 brave://flags 開啟 API，且勿選擇「下載」根目錄。",
  msgFolderError: "無法存取資料夾：{error}",
  downloadsApiAvailable: "Folder API 可用 / available ({protocol})",
  downloadsApiInsecure: "Folder API 存在但非 secure context / open via localhost",
  downloadsApiUnavailable: "Folder API 不可用 / unavailable ({protocol})",
  downloadsApiImportHint: "；可用 Import Audio 匯入 downloads 檔案",
  downloadsApiSetHint: "；可按 Set 選 downloads",
  downloadsFolderChosen: "已選擇資料夾 [{folder}]，請按 Refresh",
  downloadsFolderSummary: "[{folder}]: {count} 檔案 / {size}",
  downloadsPermissionExpired: "權限已過期，請點擊「重新授權」",
  // dialogs
  confirmClear: "確定要清除此專案嗎？",
  confirmSaveBeforeReplace:
    "目前專案尚未儲存為 CuePath 檔案。要先儲存再匯入其他音檔嗎？\nCurrent project has no CuePath file yet. Save before importing another audio?",
  confirmSaveProjectFile:
    "此資料夾尚未找到 CuePath 專案檔。要現在儲存專案檔嗎？\nNo CuePath project file was found. Save one now?",
  promptProjectTitle: "請輸入專案名稱 / Project title",
  projectFileTypeDescription: "CuePath Project",
  // misc
  exportMediaNone: "No audio loaded",
  exportMediaPrefix: "Media: ",
  documentTitleDirtyPrefix: "* "
};

/* ------------------------------------------------------------------ */
/* pure helpers                                                        */
/* ------------------------------------------------------------------ */

export function secondsToTimecode(seconds) {
  const safeSeconds = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
  const totalTenths = Math.round(safeSeconds * 10);
  const minutes = Math.floor(totalTenths / 600);
  const secondPart = Math.floor((totalTenths % 600) / 10);
  const tenthPart = totalTenths % 10;
  return String(minutes).padStart(2, "0") + ":" + String(secondPart).padStart(2, "0") + "." + String(tenthPart);
}

function timecodeToSeconds(tc) {
  if (!tc || typeof tc !== "string") return null;
  const parts = tc.split(":");
  if (parts.length !== 2) return null;
  const min = parseFloat(parts[0]);
  const sec = parseFloat(parts[1]);
  if (isNaN(min) || isNaN(sec)) return null;
  return min * 60 + sec;
}

function parseTags(input) { return String(input || "").split(",").map(t => t.trim()).filter(Boolean); }
function tagsToInput(tags) { return Array.isArray(tags) ? tags.join(", ") : ""; }
function generateId(prefix) { return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9); }
function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
function normalizeStatus(v) { return STATUS_OPTIONS.includes(v) ? v : "todo"; }

function escapeHtml(text) {
  return String(text === null || text === undefined ? "" : text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeCsvValue(value) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function escapeMarkdownCell(value) {
  return String(value === null || value === undefined ? "" : value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return value + " B";
  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) { size /= 1024; unitIndex += 1; }
  return size.toFixed(size >= 10 ? 1 : 2) + " " + units[unitIndex];
}

function sanitizeFilename(name) {
  return (String(name || "").trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")) || "cuepath-project";
}

function filenameToProjectTitle(fileName, fallback) {
  const name = String(fileName || "").trim();
  return name.replace(/\.[^/.\\]+$/, "") || fallback;
}

function fileNameFromUrl(url) {
  try {
    const u = new URL(String(url), "http://x.invalid/");
    const last = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() || "");
    return last || "audio";
  } catch (e) {
    return "audio";
  }
}

function isAudioFile(f) { return Boolean(f && typeof f.type === "string" && f.type.indexOf("audio/") === 0); }
function isCuePathFile(f) {
  const n = f && typeof f.name === "string" ? f.name.toLowerCase() : "";
  return n.endsWith(".cuepath") || n.endsWith(".cuepath.json") || n.endsWith(".json");
}
function isCuePathFileName(name) {
  const n = String(name || "").toLowerCase();
  return n.endsWith(".cuepath") || n.endsWith(".cuepath.json");
}

function createInitialState(defaultTitle) {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    project: { title: defaultTitle, createdAt: now, updatedAt: now },
    media: { type: "audio", source: "local", fileName: null, duration: null },
    settings: { playbackRate: 1, skipSmall: 3, skipLarge: 10, loop: { enabled: false, a: null, b: null } },
    markers: [],
    regions: []
  };
}

function validateCuePathJson(data) {
  return Boolean(data && data.schemaVersion === SCHEMA_VERSION && data.project && data.media && data.settings && Array.isArray(data.markers) && Array.isArray(data.regions));
}

/**
 * Validate and normalise a peaks object (see docs/peaks-format.md).
 * Returns { peaks: Float32Array, buckets, duration, sampleRate, samplesPerPixel }.
 * Throws on invalid input.
 */
export function parsePeaks(input) {
  let data = input;
  if (typeof data === "string") data = JSON.parse(data);
  if (!data || typeof data !== "object") throw new Error("Peaks: not an object");
  if (data.version !== PEAKS_VERSION) throw new Error("Peaks: unsupported version " + data.version);
  const arr = data.peaks;
  if (!arr || typeof arr.length !== "number" || arr.length < 2 || arr.length % 2 !== 0) {
    throw new Error("Peaks: 'peaks' must be an even-length array of [min,max,...]");
  }
  const peaks = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    const v = Number(arr[i]);
    if (!Number.isFinite(v)) throw new Error("Peaks: non-numeric value at " + i);
    peaks[i] = clamp(v, -1, 1);
  }
  const duration = Number(data.duration);
  return {
    peaks,
    buckets: peaks.length / 2,
    duration: Number.isFinite(duration) && duration > 0 ? duration : null,
    sampleRate: Number.isFinite(Number(data.sampleRate)) ? Number(data.sampleRate) : null,
    samplesPerPixel: Number.isFinite(Number(data.samplesPerPixel)) ? Number(data.samplesPerPixel) : null
  };
}

/* ------------------------------------------------------------------ */
/* factory                                                             */
/* ------------------------------------------------------------------ */

/**
 * @param {HTMLElement} rootElement  container the UI is rendered into (its content is replaced)
 * @param {object} [options]
 * @param {string|false|null} [options.storageKey="cuepath:html:mvp"]  localStorage key; false/null disables persistence
 * @param {object}  [options.labels]       overrides for DEFAULT_LABELS
 * @param {""|"anonymous"|"use-credentials"|null} [options.crossOrigin=null]  crossorigin attr of <audio>
 * @param {boolean} [options.standalone=false]  enable app-level behaviour: dialogs, unload guard, downloads folder, document shortcuts/drop
 * @param {{logoSrc?:string,logoAlt?:string,tag?:string,version?:string}|null} [options.header]  brand strip in the toolbar
 * @param {string|null} [options.documentTitle]  when set, document.title is maintained (with dirty marker)
 * @param {"root"|"document"|false} [options.shortcuts]  keyboard shortcut scope (default root, standalone: document)
 * @param {"root"|"document"|false} [options.dragDrop]   drop target (default root, standalone: document)
 * @param {object}  [options.ui]  { toolbar, loadButton, downloads } booleans
 * @param {boolean} [options.decodeFallback=true]  decode whole file for the waveform when no peaks are given
 */
export function createCuePath(rootElement, options) {
  if (!rootElement || rootElement.nodeType !== 1) throw new Error("createCuePath: rootElement must be an element");
  const o = options || {};
  const standalone = Boolean(o.standalone);
  const opts = {
    storageKey: o.storageKey === undefined ? DEFAULT_STORAGE_KEY : o.storageKey,
    labels: Object.assign({}, DEFAULT_LABELS, o.labels || {}),
    crossOrigin: o.crossOrigin === undefined ? null : o.crossOrigin,
    standalone,
    header: o.header || null,
    documentTitle: typeof o.documentTitle === "string" ? o.documentTitle : null,
    shortcuts: o.shortcuts === undefined ? (standalone ? "document" : "root") : o.shortcuts,
    dragDrop: o.dragDrop === undefined ? (standalone ? "document" : "root") : o.dragDrop,
    ui: Object.assign({ toolbar: true, loadButton: standalone, downloads: standalone }, o.ui || {}),
    decodeFallback: o.decodeFallback !== false
  };
  const L = opts.labels;
  const t = (key, vars) => {
    let s = Object.prototype.hasOwnProperty.call(L, key) ? String(L[key]) : key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
    return s;
  };

  const doc = rootElement.ownerDocument;
  const win = doc.defaultView || window;

  /* ---------- lifecycle bookkeeping ---------- */
  let destroyed = false;
  const disposers = [];
  const rafIds = new Set();
  const subscribers = new Map();
  let activeAudioContext = null;
  let fetchAbort = null;

  function listen(target, type, fn, listenerOptions) {
    target.addEventListener(type, fn, listenerOptions);
    disposers.push(() => target.removeEventListener(type, fn, listenerOptions));
  }
  function raf(fn) {
    const id = win.requestAnimationFrame(() => { rafIds.delete(id); if (!destroyed) fn(); });
    rafIds.add(id);
    return id;
  }
  function emit(event, payload) {
    const set = subscribers.get(event);
    if (!set) return false;
    Array.from(set).forEach(cb => { try { cb(payload); } catch (e) { if (win.console) win.console.error(e); } });
    return set.size > 0;
  }
  function on(event, cb) {
    if (typeof cb !== "function") throw new Error("on: callback required");
    if (!subscribers.has(event)) subscribers.set(event, new Set());
    subscribers.get(event).add(cb);
    return () => off(event, cb);
  }
  function off(event, cb) {
    const set = subscribers.get(event);
    if (set) set.delete(cb);
  }

  /* ---------- DOM ---------- */
  rootElement.replaceChildren();
  rootElement.classList.add("cuepath-root");
  rootElement.setAttribute("data-drop-hint", t("dropHint"));
  const hadTabindex = rootElement.hasAttribute("tabindex");
  if (!hadTabindex) rootElement.setAttribute("tabindex", "-1");

  const h = opts.header;
  const headerHtml = h
    ? (h.logoSrc ? '<div class="top-nav-logo"><img src="' + escapeHtml(h.logoSrc) + '" alt="' + escapeHtml(h.logoAlt || "") + '"></div><div class="top-nav-sep"></div>' : "") +
      (h.tag ? '<span class="top-nav-tag">' + escapeHtml(h.tag) +
        (h.version ? ' <span style="opacity:0.5; font-weight:400; font-size:9px; margin-left:4px; letter-spacing:0;">' + escapeHtml(h.version) + "</span>" : "") + "</span>" : "")
    : "";

  rootElement.innerHTML =
    '<nav class="top-nav' + (opts.ui.toolbar ? "" : " cp-hidden") + '">' + headerHtml +
      '<input data-cp="projectTitleInput" class="cp-project-title" type="text" aria-label="' + escapeHtml(t("projectTitleAria")) + '" spellcheck="false">' +
      '<div class="nav-actions">' +
        '<button data-cp="importJsonButton" type="button" class="btn-nav">' + escapeHtml(t("importProject")) + "</button>" +
        '<button data-cp="exportJsonButton" type="button" class="btn-nav">' + escapeHtml(t("exportProject")) + "</button>" +
        '<button data-cp="exportCsvButton" type="button" class="btn-nav">' + escapeHtml(t("exportCsv")) + "</button>" +
        '<button data-cp="exportMarkdownButton" type="button" class="btn-nav">' + escapeHtml(t("exportMarkdown")) + "</button>" +
        '<button data-cp="clearProjectButton" type="button" class="btn-nav btn-danger">' + escapeHtml(t("clearProject")) + "</button>" +
      "</div>" +
    "</nav>" +
    '<input data-cp="audioFileInput" class="hidden-file" type="file" accept="audio/*">' +
    '<input data-cp="jsonFileInput" class="hidden-file" type="file" accept=".cuepath,.json,application/json">' +
    '<div class="ctrl-bar">' +
      '<button data-cp="loadAudioButton" type="button" class="btn-load' + (opts.ui.loadButton ? "" : " cp-hidden") + '">' + escapeHtml(t("loadAudio")) + "</button>" +
      '<div class="media-info">' +
        '<div class="info-chip"><span class="info-chip-label">' + escapeHtml(t("chipAudio")) + '</span><span class="info-chip-value" data-cp="fileNameText">' + escapeHtml(t("fileNone")) + "</span></div>" +
        '<div class="info-chip"><span class="info-chip-label">' + escapeHtml(t("chipProject")) + '</span><span class="info-chip-value" data-cp="projectStatusText">' + escapeHtml(t("projectStatusInitial")) + "</span></div>" +
        '<div class="info-chip"><span class="info-chip-label">' + escapeHtml(t("chipNow")) + '</span><span class="info-chip-value mono" data-cp="currentTimeText">00:00.0</span></div>' +
        '<div class="info-chip"><span class="info-chip-label">' + escapeHtml(t("chipLength")) + '</span><span class="info-chip-value mono" data-cp="durationText">00:00.0</span></div>' +
        '<div class="cp-message" data-cp="messageArea">' + escapeHtml(t("messageInitial")) + "</div>" +
      "</div>" +
      '<div class="downloads-panel' + (opts.ui.downloads ? "" : " cp-hidden") + '" title="' + escapeHtml(t("downloadsHint")) + '">' +
        '<span class="downloads-title">' + escapeHtml(t("downloadsTitle")) + "</span>" +
        '<span data-cp="downloadsStatusText" class="downloads-status">' + escapeHtml(t("downloadsDefault")) + "</span>" +
        '<button data-cp="setDownloadsFolderButton" type="button" class="btn-downloads">' + escapeHtml(t("downloadsSet")) + "</button>" +
        '<button data-cp="refreshDownloadsButton" type="button" class="btn-downloads">' + escapeHtml(t("downloadsRefresh")) + "</button>" +
      "</div>" +
      '<div class="ctrl-divider"></div>' +
      '<div class="transport-group">' +
        '<button data-cp="skipLargeBackButton" type="button" class="btn-skip" title="-10s">◀◀◀◀</button>' +
        '<button data-cp="skipFiveBackButton" type="button" class="btn-skip" title="-5s">◀◀◀</button>' +
        '<button data-cp="skipSmallBackButton" type="button" class="btn-skip" title="-3s">◀◀</button>' +
        '<button data-cp="skipOneBackButton" type="button" class="btn-skip" title="-1s">◀</button>' +
        '<button data-cp="playPauseButton" type="button" class="btn-play">' + escapeHtml(t("play")) + "</button>" +
        '<button data-cp="skipOneForwardButton" type="button" class="btn-skip" title="+1s">▶</button>' +
        '<button data-cp="skipSmallForwardButton" type="button" class="btn-skip" title="+3s">▶▶</button>' +
        '<button data-cp="skipFiveForwardButton" type="button" class="btn-skip" title="+5s">▶▶▶</button>' +
        '<button data-cp="skipLargeForwardButton" type="button" class="btn-skip" title="+10s">▶▶▶▶</button>' +
        '<button data-cp="goStartButton" type="button" style="display:none"></button>' +
      "</div>" +
      '<div class="ctrl-divider"></div>' +
      '<div class="rate-group"><span class="rate-label">' + escapeHtml(t("speed")) + '</span><div data-cp="playbackRateButtons" style="display:contents"></div></div>' +
      '<div class="ctrl-divider"></div>' +
      '<div class="loop-group">' +
        '<span class="loop-label">' + escapeHtml(t("loop")) + "</span>" +
        '<div class="loop-ab-pill" data-cp="loopAbPill" title="Loop A / B">' +
          '<span class="ab-item"><span class="ab-key">A</span><span class="ab-val" data-cp="loopAText">--:--.-</span></span>' +
          '<span class="ab-item"><span class="ab-key">B</span><span class="ab-val" data-cp="loopBText">--:--.-</span></span>' +
        "</div>" +
        '<button data-cp="setAButton" type="button" class="btn-loop btn-loop-set" title="Set Loop A">A▼</button>' +
        '<button data-cp="setBButton" type="button" class="btn-loop btn-loop-set" title="Set Loop B">B▼</button>' +
        '<button data-cp="toggleLoopButton" type="button" class="btn-loop">' + escapeHtml(t("loopOff")) + "</button>" +
        '<button data-cp="clearLoopButton" type="button" class="btn-loop">' + escapeHtml(t("loopClear")) + "</button>" +
        '<button data-cp="addRegionFromLoopButton" type="button" class="btn-loop btn-add-region">' + escapeHtml(t("loopToRegion")) + "</button>" +
      "</div>" +
    "</div>" +
    '<div class="main-content">' +
      '<div class="timeline-section"><div data-cp="cueTimeline" class="cue-timeline" aria-label="Cue timeline"></div></div>' +
      '<div class="audio-wrap"><audio data-cp="audioElement" controls></audio></div>' +
      '<div class="tables-area">' +
        '<div class="table-panel"><div class="table-panel-header"><span class="table-panel-title">' + escapeHtml(t("markersTitle")) + '</span>' +
          '<button data-cp="addMarkerButton" type="button" class="btn-add">' + escapeHtml(t("addMarker")) + '</button></div>' +
          '<div data-cp="markersContainer" class="table-wrap"></div></div>' +
        '<div class="table-panel"><div class="table-panel-header"><span class="table-panel-title">' + escapeHtml(t("regionsTitle")) + '</span>' +
          '<button data-cp="addRegionButton" type="button" class="btn-add">' + escapeHtml(t("addRegion")) + '</button></div>' +
          '<div data-cp="regionsContainer" class="table-wrap"></div></div>' +
      "</div>" +
    "</div>";

  const dom = {};
  Array.from(rootElement.querySelectorAll("[data-cp]")).forEach(el => { dom[el.getAttribute("data-cp")] = el; });
  const audio = dom.audioElement;
  audio.preload = "metadata";
  if (opts.crossOrigin !== null && opts.crossOrigin !== undefined) audio.crossOrigin = opts.crossOrigin;

  /* ---------- state ---------- */
  let state = createInitialState(t("defaultProjectTitle"));
  let currentObjectUrl = null;
  let hasLoadedAudioBody = false;
  let markerDrag = null;
  let loopDrag = null;
  let regionDrag = null;
  let playheadDrag = null;
  let suppressNextMarkerClick = false;
  const regionTimeEditIds = new Set();
  let currentFileHandle = null;
  let downloadsDirectoryHandle = null;
  let downloadsSummary = null;
  let waveform = null; // { peaks: Float32Array, buckets, duration, ... }
  let waveformStatus = "";
  let waveformBuildId = 0;
  let loadToken = 0;
  let pendingLoad = null;
  let hasProjectFileReference = false;
  let projectFileSavePrompted = false;
  let isDirty = false;

  /* ---------- state normalisation ---------- */
  function normalizeMarker(m) {
    if (!m || !Number.isFinite(m.time)) return null;
    const now = new Date().toISOString();
    return {
      id: typeof m.id === "string" && m.id ? m.id : generateId("marker"),
      time: Math.max(0, m.time),
      label: typeof m.label === "string" ? m.label : t("defaultMarkerLabel"),
      note: typeof m.note === "string" ? m.note : "",
      tags: Array.isArray(m.tags) ? m.tags.map(String) : [],
      status: normalizeStatus(m.status),
      createdAt: typeof m.createdAt === "string" ? m.createdAt : now,
      updatedAt: typeof m.updatedAt === "string" ? m.updatedAt : now
    };
  }

  function normalizeRegion(r) {
    if (!r || !Number.isFinite(r.start) || !Number.isFinite(r.end)) return null;
    const now = new Date().toISOString();
    return {
      id: typeof r.id === "string" && r.id ? r.id : generateId("region"),
      start: Math.max(0, r.start), end: Math.max(0, r.end),
      label: typeof r.label === "string" ? r.label : t("defaultRegionLabel"),
      note: typeof r.note === "string" ? r.note : "",
      tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
      status: normalizeStatus(r.status),
      createdAt: typeof r.createdAt === "string" ? r.createdAt : now,
      updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : now
    };
  }

  function normalizeImportedState(input) {
    const base = createInitialState(t("defaultProjectTitle"));
    const imp = input && typeof input === "object" ? input : {};
    const project = imp.project && typeof imp.project === "object" ? imp.project : {};
    const media = imp.media && typeof imp.media === "object" ? imp.media : {};
    const settings = imp.settings && typeof imp.settings === "object" ? imp.settings : {};
    const loop = settings.loop && typeof settings.loop === "object" ? settings.loop : {};
    return {
      schemaVersion: SCHEMA_VERSION,
      project: {
        title: typeof project.title === "string" ? project.title : base.project.title,
        createdAt: typeof project.createdAt === "string" ? project.createdAt : base.project.createdAt,
        updatedAt: typeof project.updatedAt === "string" ? project.updatedAt : base.project.updatedAt
      },
      media: {
        type: "audio", source: media.source === "url" ? "url" : "local",
        fileName: typeof media.fileName === "string" ? media.fileName : null,
        duration: Number.isFinite(media.duration) ? media.duration : null
      },
      settings: {
        playbackRate: PLAYBACK_RATES.includes(Number(settings.playbackRate)) ? Number(settings.playbackRate) : 1,
        skipSmall: 3, skipLarge: 10,
        loop: { enabled: Boolean(loop.enabled), a: Number.isFinite(loop.a) ? loop.a : null, b: Number.isFinite(loop.b) ? loop.b : null }
      },
      markers: Array.isArray(imp.markers) ? imp.markers.map(normalizeMarker).filter(Boolean) : [],
      regions: Array.isArray(imp.regions) ? imp.regions.map(normalizeRegion).filter(Boolean) : []
    };
  }

  function sortMarkers() { state.markers.sort((a, b) => a.time - b.time); }
  function sortRegions() { state.regions.sort((a, b) => a.start - b.start); }
  function updateTimestamp() { state.project.updatedAt = new Date().toISOString(); }
  function cloneState() { return JSON.parse(JSON.stringify(state)); }

  /* ---------- persistence ---------- */
  function storageGet() {
    if (!opts.storageKey) return null;
    try { return win.localStorage.getItem(opts.storageKey); } catch (e) { return null; }
  }
  function storageSet(value) {
    if (!opts.storageKey) return;
    try { win.localStorage.setItem(opts.storageKey, value); } catch (e) { /* quota / privacy mode */ }
  }
  function storageRemove() {
    if (!opts.storageKey) return;
    try { win.localStorage.removeItem(opts.storageKey); } catch (e) { /* ignore */ }
  }

  function saveState(showMsg, resetDirty = false) {
    updateTimestamp();
    isDirty = resetDirty ? false : true;
    storageSet(JSON.stringify(state));
    if (showMsg) setMessage(t("msgSaved"), false);
    renderMediaInfo();
    emit("change", cloneState());
  }

  function loadStateFromStorage() {
    const saved = storageGet();
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (validateCuePathJson(parsed)) { state = normalizeImportedState(parsed); sortMarkers(); sortRegions(); }
    } catch (e) { setMessage(t("msgInvalidStorage"), true); }
  }

  /* ---------- messages / misc ---------- */
  function setMessage(msg, isError) {
    dom.messageArea.textContent = msg;
    dom.messageArea.classList.toggle("error", Boolean(isError));
    emit("message", { text: msg, isError: Boolean(isError) });
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = win.URL.createObjectURL(blob);
    const a = doc.createElement("a");
    a.href = url; a.download = filename;
    doc.body.appendChild(a); a.click(); a.remove();
    win.URL.revokeObjectURL(url);
  }

  function getTimelineDuration() {
    if (Number.isFinite(audio.duration) && audio.duration > 0) return audio.duration;
    if (Number.isFinite(state.media.duration) && state.media.duration > 0) return state.media.duration;
    if (waveform && waveform.duration) return waveform.duration;
    return null;
  }

  function getTimelinePointerTime(event) {
    const duration = getTimelineDuration();
    if (!duration || !dom.cueTimeline) return null;
    const rect = dom.cueTimeline.getBoundingClientRect();
    return clamp((event.clientX - rect.left) / rect.width, 0, 1) * duration;
  }

  function isInteractiveTimelineTarget(target) {
    return Boolean(target && target.closest && target.closest(".timeline-marker, .timeline-region, .timeline-loop-point"));
  }

  /* ---------- waveform ---------- */
  function setWaveform(parsed) {
    waveform = parsed;
    waveformStatus = "";
    if (parsed.duration && !(Number.isFinite(state.media.duration) && state.media.duration > 0)) {
      // remember until the media element reports the real duration
      state.media.duration = parsed.duration;
    }
    renderTimeline();
    emit("peaks", { buckets: parsed.buckets, duration: parsed.duration });
  }

  function getAudioContextCtor() { return win.AudioContext || win.webkitAudioContext; }

  /** Decode a whole file into the peaks format. Used only when no peaks were supplied. */
  async function decodeArrayBufferToPeaks(arrayBuffer, buildId) {
    const Ctor = getAudioContextCtor();
    if (!Ctor) throw new Error("Web Audio API unavailable");
    const ctx = new Ctor();
    activeAudioContext = ctx;
    let audioBuffer;
    try {
      audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    } finally {
      if (ctx.close) { try { ctx.close(); } catch (e) { /* ignore */ } }
      if (activeAudioContext === ctx) activeAudioContext = null;
    }
    if (destroyed || buildId !== waveformBuildId) return null;
    const buckets = DECODE_BUCKETS;
    const peaks = new Float32Array(buckets * 2);
    const channelCount = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const per = Math.max(1, Math.floor(length / buckets));
    let maxAbs = 0;
    for (let i = 0; i < buckets; i++) {
      const start = i * per;
      const end = i === buckets - 1 ? length : Math.min(length, start + per);
      let mn = 0, mx = 0;
      for (let ch = 0; ch < channelCount; ch++) {
        const data = audioBuffer.getChannelData(ch);
        for (let j = start; j < end; j++) {
          const v = data[j] || 0;
          if (v < mn) mn = v;
          if (v > mx) mx = v;
        }
      }
      peaks[i * 2] = mn; peaks[i * 2 + 1] = mx;
      maxAbs = Math.max(maxAbs, -mn, mx);
    }
    if (maxAbs > 0) for (let i = 0; i < peaks.length; i++) peaks[i] = peaks[i] / maxAbs;
    return { peaks, buckets, duration: audioBuffer.duration, sampleRate: audioBuffer.sampleRate, samplesPerPixel: per };
  }

  async function buildWaveformFromBuffer(getBuffer) {
    const buildId = ++waveformBuildId;
    waveform = null;
    waveformStatus = t("waveformAnalyzing");
    renderTimeline();
    try {
      const arrayBuffer = await getBuffer();
      if (destroyed || buildId !== waveformBuildId) return;
      const parsed = await decodeArrayBufferToPeaks(arrayBuffer, buildId);
      if (!parsed || destroyed || buildId !== waveformBuildId) return;
      setWaveform(parsed);
    } catch (error) {
      if (destroyed || buildId !== waveformBuildId) return;
      waveform = null;
      waveformStatus = t("waveformUnavailable");
      renderTimeline();
    }
  }

  function buildWaveformPeaks(file) {
    return buildWaveformFromBuffer(() => {
      if (!file || typeof file.arrayBuffer !== "function") throw new Error("Audio file unavailable");
      return file.arrayBuffer();
    });
  }

  function loadPeaks(input) {
    if (destroyed) return;
    const parsed = parsePeaks(input); // throws on invalid input
    waveformBuildId += 1; // cancel any running decode
    setWaveform(parsed);
  }

  async function loadPeaksFromUrl(url, fetchOptions, signal) {
    const buildId = ++waveformBuildId;
    waveform = null;
    waveformStatus = t("waveformLoading");
    renderTimeline();
    try {
      const res = await win.fetch(url, Object.assign({}, fetchOptions || {}, { signal }));
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      if (destroyed || buildId !== waveformBuildId) return;
      setWaveform(parsePeaks(json));
    } catch (error) {
      if (destroyed || buildId !== waveformBuildId) return;
      waveform = null;
      waveformStatus = t("waveformUnavailable");
      renderTimeline();
      emit("error", { type: "peaks", error });
    }
  }

  function drawWaveform(canvas) {
    if (!canvas || !waveform || !waveform.buckets) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = win.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(rect.width * ratio));
    const height = Math.max(1, Math.floor(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    const center = height / 2;
    const scale = height * 0.45;
    const n = waveform.buckets;
    const p = waveform.peaks;
    const barWidth = Math.max(1, Math.ceil(width / n));
    ctx.fillStyle = state.settings.loop.enabled ? "rgba(124, 58, 237, 0.28)" : "rgba(94, 61, 37, 0.22)";
    for (let x = 0; x < width; x += barWidth) {
      const i0 = Math.min(n - 1, Math.floor((x / width) * n));
      const i1 = Math.max(i0 + 1, Math.min(n, Math.ceil(((x + barWidth) / width) * n)));
      let mn = 0, mx = 0;
      for (let i = i0; i < i1; i++) {
        if (p[i * 2] < mn) mn = p[i * 2];
        if (p[i * 2 + 1] > mx) mx = p[i * 2 + 1];
      }
      const top = Math.min(center - mx * scale, center - 1);
      const bottom = Math.max(center - mn * scale, center + 1);
      ctx.fillRect(x, top, barWidth, bottom - top);
    }
    ctx.fillStyle = state.settings.loop.enabled ? "rgba(124, 58, 237, 0.08)" : "rgba(62, 42, 26, 0.06)";
    ctx.fillRect(0, center - 1, width, 2);
  }

  /* ---------- transport ---------- */
  function hasSource() { return Boolean(audio.getAttribute("src")); }

  function play() {
    if (!hasSource()) { setMessage(t("msgNeedAudio"), true); return; }
    audio.play().catch(() => setMessage(t("msgNeedAudio"), true));
  }
  function pause() { audio.pause(); }
  function togglePlay() {
    if (!hasSource()) { setMessage(t("msgNeedAudio"), true); return; }
    if (audio.paused) play(); else pause();
  }

  function seekTo(seconds, options2) {
    if (!hasSource()) { setMessage(t("msgNeedAudio"), true); return; }
    const opt = options2 || {};
    if (opt.disableLoop && state.settings.loop.enabled) {
      state.settings.loop.enabled = false; saveState(false); renderLoop();
    }
    const dur = Number.isFinite(audio.duration) ? audio.duration : 0;
    audio.currentTime = clamp(seconds, 0, dur || Number.MAX_SAFE_INTEGER);
    renderTimeDisplays();
  }

  function skip(s) { seekTo(audio.currentTime + s); }
  function goStart() { seekTo(0); }

  function setPlaybackRate(rate) {
    state.settings.playbackRate = Number(rate);
    audio.playbackRate = Number(rate);
    saveState(false); render();
  }

  /* ---------- project-file guards (standalone) ---------- */
  function hasRecordedProjectTitle() {
    const title = String(state.project && state.project.title ? state.project.title : "").trim();
    return Boolean(title && title !== t("defaultProjectTitle"));
  }
  function downloadsHasCuePathProject() {
    return Boolean(downloadsSummary && Array.isArray(downloadsSummary.files) && downloadsSummary.files.some(file => isCuePathFileName(file.name)));
  }
  function projectHasWork() {
    return Boolean(hasLoadedAudioBody || state.media.fileName || state.markers.length || state.regions.length || hasRecordedProjectTitle());
  }
  function needsCuePathProjectFileSave() {
    return projectHasWork() && !hasProjectFileReference;
  }

  async function confirmBeforeReplacingAudio() {
    if (!needsCuePathProjectFileSave()) return true;
    const shouldSave = win.confirm(t("confirmSaveBeforeReplace"));
    if (!shouldSave) return false;
    return await saveCuePathProjectFile();
  }

  async function checkProjectFileAfterAudioLoad() {
    if (hasProjectFileReference || projectFileSavePrompted) return;
    if (downloadsHasCuePathProject()) { hasProjectFileReference = true; return; }
    if (downloadsDirectoryHandle) {
      const ok = await verifyDownloadsPermission(downloadsDirectoryHandle, false);
      if (ok) {
        downloadsSummary = await scanDownloadsFolder(downloadsDirectoryHandle);
        renderDownloadsStatus();
        if (downloadsHasCuePathProject()) { hasProjectFileReference = true; return; }
      }
    }
    if (destroyed) return;
    projectFileSavePrompted = true;
    const shouldSave = win.confirm(t("confirmSaveProjectFile"));
    if (shouldSave) await saveCuePathProjectFile();
  }

  /* ---------- loading audio ---------- */
  function releaseSource() {
    if (currentObjectUrl) { win.URL.revokeObjectURL(currentObjectUrl); currentObjectUrl = null; }
    if (fetchAbort) { try { fetchAbort.abort(); } catch (e) { /* ignore */ } fetchAbort = null; }
  }

  function settlePending(err, value) {
    const p = pendingLoad;
    pendingLoad = null;
    if (!p) return;
    if (err) p.reject(err); else p.resolve(value);
  }

  async function handleAudioFile(file, hostOptions) {
    if (destroyed || !file) return;
    const ho = hostOptions || {};
    const dialogs = opts.standalone && !ho.silent;
    if (dialogs && !ho.skipReplaceGuard && hasLoadedAudioBody) {
      const canReplace = await confirmBeforeReplacingAudio();
      if (!canReplace) { setMessage(t("msgImportCancelled"), false); return; }
    }
    if (destroyed) return;
    if (!hasRecordedProjectTitle()) {
      const defaultProjectTitle = filenameToProjectTitle(file.name, t("defaultProjectTitle"));
      if (dialogs && !ho.skipProjectTitlePrompt) {
        const inputTitle = win.prompt(t("promptProjectTitle"), defaultProjectTitle);
        state.project.title = (inputTitle === null ? defaultProjectTitle : inputTitle.trim()) || defaultProjectTitle;
      } else if (ho.title) {
        state.project.title = ho.title;
      }
    }
    ++loadToken;
    settlePending(new Error("superseded"));
    releaseSource();
    currentObjectUrl = win.URL.createObjectURL(file);
    hasLoadedAudioBody = true;
    waveformBuildId += 1;
    waveform = null;
    waveformStatus = "";
    audio.removeAttribute("crossorigin");
    audio.src = currentObjectUrl;
    audio.load();
    state.media.type = "audio"; state.media.source = "local";
    state.media.fileName = file.name; state.media.duration = null;
    saveState(false); render();
    buildWaveformPeaks(file);
    if (dialogs) checkProjectFileAfterAudioLoad().catch(() => {});
  }

  /** Public: load a local File / Blob (decodes it for the waveform unless peaks are given). */
  function loadFile(file, fileOptions) {
    const fo = fileOptions || {};
    const p = handleAudioFile(file, { silent: true, title: fo.title });
    if (fo.peaks) { try { loadPeaks(fo.peaks); } catch (e) { emit("error", { type: "peaks", error: e }); } }
    return p;
  }

  /**
   * Public: stream audio from a URL through <audio src>. The file is never fetched or decoded
   * when peaks (inline or via peaksUrl) are available.
   * Resolves once metadata is loaded (and the peaks fetch has settled).
   */
  function loadUrl(url, urlOptions) {
    const uo = urlOptions || {};
    if (destroyed) return Promise.reject(new Error("destroyed"));
    const token = ++loadToken;
    settlePending(new Error("superseded"));
    releaseSource();
    fetchAbort = typeof win.AbortController === "function" ? new win.AbortController() : null;
    const signal = fetchAbort ? fetchAbort.signal : undefined;

    const name = uo.title || fileNameFromUrl(url);
    if (!hasRecordedProjectTitle()) state.project.title = filenameToProjectTitle(name, t("defaultProjectTitle"));
    hasLoadedAudioBody = true;
    waveformBuildId += 1;
    waveform = null;
    waveformStatus = "";
    state.media.type = "audio"; state.media.source = "url";
    state.media.fileName = name; state.media.duration = null;

    const co = uo.crossOrigin !== undefined ? uo.crossOrigin : opts.crossOrigin;
    if (co === null || co === undefined) audio.removeAttribute("crossorigin"); else audio.crossOrigin = co;
    const metadataReady = new Promise((resolve, reject) => { pendingLoad = { resolve, reject, token }; });
    audio.src = String(url);
    audio.load();
    saveState(false); render();

    let peaksDone = Promise.resolve();
    if (uo.peaks) {
      try { loadPeaks(uo.peaks); } catch (e) { emit("error", { type: "peaks", error: e }); }
    } else if (uo.peaksUrl) {
      peaksDone = loadPeaksFromUrl(uo.peaksUrl, uo.fetchOptions, signal);
    } else if (opts.decodeFallback) {
      peaksDone = buildWaveformFromBuffer(async () => {
        const res = await win.fetch(String(url), Object.assign({}, uo.fetchOptions || {}, { signal }));
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.arrayBuffer();
      });
    }
    return Promise.all([metadataReady, peaksDone]).then(() => undefined);
  }

  async function handleDroppedFiles(files) {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    const audioFile = arr.find(isAudioFile);
    const cp = arr.find(isCuePathFile);
    if (audioFile && cp) { importJsonFile(cp, () => handleAudioFile(audioFile, { skipProjectTitlePrompt: true, skipReplaceGuard: true })); return; }
    if (audioFile) { await handleAudioFile(audioFile); return; }
    if (cp) { importJsonFile(cp); return; }
    setMessage(t("msgUnsupportedFile"), true);
  }

  /* ---------- downloads folder (standalone) ---------- */
  function getDownloadsApiStatusText() {
    const hasDirectoryPicker = "showDirectoryPicker" in win;
    const secure = win.isSecureContext === true;
    const protocol = (win.location && win.location.protocol) || "unknown:";
    if (hasDirectoryPicker && secure) return t("downloadsApiAvailable", { protocol });
    if (hasDirectoryPicker && !secure) return t("downloadsApiInsecure");
    return t("downloadsApiUnavailable", { protocol });
  }

  function openDownloadsDb() {
    return new Promise((resolve, reject) => {
      if (!win.indexedDB) { reject(new Error("IndexedDB unavailable")); return; }
      const request = win.indexedDB.open(DOWNLOADS_DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(DOWNLOADS_STORE_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function saveDownloadsHandle(handle) {
    const db = await openDownloadsDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DOWNLOADS_STORE_NAME, "readwrite");
      tx.objectStore(DOWNLOADS_STORE_NAME).put(handle, DOWNLOADS_HANDLE_KEY);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  async function loadDownloadsHandle() {
    const db = await openDownloadsDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DOWNLOADS_STORE_NAME, "readonly");
      const request = tx.objectStore(DOWNLOADS_STORE_NAME).get(DOWNLOADS_HANDLE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  }

  async function verifyDownloadsPermission(handle, requestPermission) {
    if (!handle || !handle.queryPermission) return false;
    const popts = { mode: "read" };
    if (await handle.queryPermission(popts) === "granted") return true;
    if (requestPermission && handle.requestPermission) return await handle.requestPermission(popts) === "granted";
    return false;
  }

  async function scanDownloadsFolder(handle) {
    const summary = { count: 0, totalBytes: 0, files: [] };
    for await (const entry of handle.values()) {
      if (entry.kind !== "file") continue;
      const file = await entry.getFile();
      summary.count += 1;
      summary.totalBytes += file.size;
      summary.files.push({ name: file.name, size: file.size, type: file.type || "" });
    }
    summary.files.sort((a, b) => a.name.localeCompare(b.name));
    return summary;
  }

  function renderDownloadsStatus() {
    if (!opts.ui.downloads) return;
    if (!("showDirectoryPicker" in win)) {
      dom.downloadsStatusText.textContent = getDownloadsApiStatusText() + t("downloadsApiImportHint");
      return;
    }
    if (!downloadsDirectoryHandle) {
      dom.downloadsStatusText.textContent = getDownloadsApiStatusText() + t("downloadsApiSetHint");
      return;
    }
    const folderName = downloadsDirectoryHandle.name || "downloads";
    if (!downloadsSummary) {
      dom.downloadsStatusText.textContent = t("downloadsFolderChosen", { folder: folderName });
      return;
    }
    dom.downloadsStatusText.textContent = t("downloadsFolderSummary", { folder: folderName, count: downloadsSummary.count, size: formatBytes(downloadsSummary.totalBytes) });
  }

  async function refreshDownloadsStatus(ro) {
    const r = ro || {};
    if (!downloadsDirectoryHandle) { renderDownloadsStatus(); return; }
    const ok = await verifyDownloadsPermission(downloadsDirectoryHandle, Boolean(r.requestPermission));
    if (destroyed) return;
    if (!ok) {
      dom.downloadsStatusText.textContent = t("downloadsPermissionExpired");
      dom.refreshDownloadsButton.textContent = t("downloadsReauthorize");
      return;
    }
    dom.refreshDownloadsButton.textContent = t("downloadsRefresh");
    downloadsSummary = await scanDownloadsFolder(downloadsDirectoryHandle);
    if (destroyed) return;
    renderDownloadsStatus();
    if (r.tryReloadAudio) await tryReloadAudioFromDownloads();
  }

  async function setDownloadsFolder() {
    if (!("showDirectoryPicker" in win)) {
      const isBrave = win.navigator.userAgent.includes("Brave");
      let msg = t("msgFolderApiMissing");
      if (isBrave) msg += t("msgFolderApiBrave");
      setMessage(msg, true);
      renderDownloadsStatus();
      return;
    }
    try {
      downloadsDirectoryHandle = await win.showDirectoryPicker({ mode: "read" });
      await saveDownloadsHandle(downloadsDirectoryHandle);
      await refreshDownloadsStatus({ requestPermission: true, tryReloadAudio: true });
      setMessage(t("msgDownloadsSet"), false);
    } catch (err) {
      if (err.name === "AbortError") return;
      const isBrave = win.navigator.userAgent.includes("Brave");
      if (isBrave) setMessage(t("msgFolderBrave"), true);
      else setMessage(t("msgFolderError", { error: err.message }), true);
    }
  }

  async function initDownloadsFolder() {
    try {
      downloadsDirectoryHandle = await loadDownloadsHandle();
      await refreshDownloadsStatus({ requestPermission: false, tryReloadAudio: true });
    } catch (error) {
      if (!destroyed) renderDownloadsStatus();
    }
  }

  async function tryReloadAudioFromDownloads() {
    if (!downloadsDirectoryHandle || hasLoadedAudioBody || !state.media.fileName) return;
    const ok = await verifyDownloadsPermission(downloadsDirectoryHandle, false);
    if (!ok || destroyed) return;
    try {
      const fileHandle = await downloadsDirectoryHandle.getFileHandle(state.media.fileName);
      const file = await fileHandle.getFile();
      handleAudioFile(file, { skipReplaceGuard: true });
      setMessage(t("msgReloadedFromDownloads", { name: file.name }), false);
    } catch (error) {
      if (!destroyed) setMessage(t("msgDownloadsMissing", { name: state.media.fileName }), false);
    }
  }

  /* ---------- loop ---------- */
  function setLoopA() { state.settings.loop.a = audio.currentTime || 0; saveState(false); render(); }
  function setLoopB() { state.settings.loop.b = audio.currentTime || 0; saveState(false); render(); }

  function canUseLoop(showError) {
    const loop = state.settings.loop;
    if (loop.a === null || loop.b === null) { if (showError) setMessage(t("msgNeedAB"), true); return false; }
    if (loop.a >= loop.b) { if (showError) setMessage(t("msgAAfterB"), true); return false; }
    return true;
  }

  function toggleLoop() {
    if (state.settings.loop.enabled) state.settings.loop.enabled = false;
    else if (canUseLoop(true)) state.settings.loop.enabled = true;
    saveState(false); render();
  }

  function clearLoop() {
    state.settings.loop.enabled = false; state.settings.loop.a = null; state.settings.loop.b = null;
    saveState(false); render();
  }

  function enforceLoop() {
    const loop = state.settings.loop;
    if (loop.enabled && loop.a !== null && loop.b !== null && audio.currentTime >= loop.b) {
      audio.currentTime = loop.a;
      if (!audio.paused) audio.play().catch(() => {});
    }
  }

  /* ---------- markers / regions ---------- */
  function addMarker() {
    const now = new Date().toISOString();
    state.markers.push({
      id: generateId("marker"), time: audio.currentTime || 0,
      label: t("defaultMarkerLabel") + " " + (state.markers.length + 1), note: "", tags: [], status: "todo",
      createdAt: now, updatedAt: now
    });
    sortMarkers(); saveState(false); renderTimeline(); renderMarkers();
  }

  function updateMarker(id, field, value) {
    const m = state.markers.find(x => x.id === id);
    if (!m) return;
    if (field === "tags") m.tags = parseTags(value);
    else if (field === "status") m.status = normalizeStatus(value);
    else if (field === "label" || field === "note") m[field] = value;
    m.updatedAt = new Date().toISOString();
    saveState(false); renderTimeline(); renderMarkers();
  }

  function deleteMarker(id) { state.markers = state.markers.filter(x => x.id !== id); saveState(false); renderTimeline(); renderMarkers(); }
  function jumpToMarker(id) { const m = state.markers.find(x => x.id === id); if (m) seekTo(m.time, { disableLoop: true }); }

  function addRegionFromLoop() {
    if (!canUseLoop(true)) return;
    const now = new Date().toISOString();
    state.regions.push({
      id: generateId("region"), start: state.settings.loop.a, end: state.settings.loop.b,
      label: t("defaultRegionLabel") + " " + (state.regions.length + 1), note: "", tags: [], status: "todo",
      createdAt: now, updatedAt: now
    });
    sortRegions(); saveState(false); renderTimeline(); renderRegions();
  }

  function updateRegion(id, field, value) {
    const r = state.regions.find(x => x.id === id);
    if (!r) return;
    if (field === "tags") r.tags = parseTags(value);
    else if (field === "status") r.status = normalizeStatus(value);
    else if (field === "label" || field === "note") r[field] = value;
    else if ((field === "start" || field === "end") && Number.isFinite(value)) r[field] = Math.max(0, value);
    r.updatedAt = new Date().toISOString();
    saveState(false); renderTimeline(); renderRegions();
  }

  function deleteRegion(id) { state.regions = state.regions.filter(x => x.id !== id); saveState(false); renderTimeline(); renderRegions(); }
  function jumpToRegion(id) { const r = state.regions.find(x => x.id === id); if (r) seekTo(r.start, { disableLoop: true }); }

  function loopRegion(id) {
    const r = state.regions.find(x => x.id === id);
    if (!r || r.start >= r.end) { setMessage(t("msgInvalidRegion"), true); return; }
    state.settings.loop.a = r.start; state.settings.loop.b = r.end; state.settings.loop.enabled = true;
    seekTo(r.start); saveState(false); renderLoop(); renderTimeline();
    setMessage(t("msgLoopEnabled", { label: r.label }), false);
  }

  /* ---------- drag handling ---------- */
  function startMarkerDrag(event, markerId, dragPart) {
    const time = getTimelinePointerTime(event);
    if (time === null) return;
    event.preventDefault(); event.stopPropagation();
    markerDrag = {
      markerId, dragPart, startX: event.clientX, moved: false,
      markerElement: event.currentTarget.closest(".timeline-marker")
    };
  }

  function continueMarkerDrag(event) {
    if (!markerDrag) return;
    event.preventDefault();
    const time = getTimelinePointerTime(event);
    if (time === null) return;
    if (Math.abs(event.clientX - markerDrag.startX) > 2) markerDrag.moved = true;
    const m = state.markers.find(x => x.id === markerDrag.markerId);
    const duration = getTimelineDuration();
    if (!m || !duration) return;
    m.time = Math.max(0, time); m.updatedAt = new Date().toISOString();
    if (markerDrag.markerElement) markerDrag.markerElement.style.left = clamp(m.time / duration, 0, 1) * 100 + "%";
    updateTimelinePlayhead();
  }

  function endMarkerDrag() {
    if (markerDrag) {
      suppressNextMarkerClick = markerDrag.moved;
      if (markerDrag.moved) { sortMarkers(); saveState(false); renderTimeline(); renderMarkers(); }
    }
    markerDrag = null;
  }

  function startLoopDrag(event, pointLabel) {
    const time = getTimelinePointerTime(event);
    if (time === null) return;
    event.preventDefault(); event.stopPropagation();
    loopDrag = {
      pointLabel, startX: event.clientX, moved: false,
      pointElement: event.currentTarget.closest(".timeline-loop-point")
    };
  }

  function continueLoopDrag(event) {
    if (!loopDrag) return;
    event.preventDefault();
    const time = getTimelinePointerTime(event);
    if (time === null) return;
    if (Math.abs(event.clientX - loopDrag.startX) > 2) loopDrag.moved = true;
    const duration = getTimelineDuration();
    if (!duration) return;
    if (loopDrag.pointLabel === "A") state.settings.loop.a = Math.max(0, time);
    else if (loopDrag.pointLabel === "B") state.settings.loop.b = Math.max(0, time);
    if (loopDrag.pointElement) loopDrag.pointElement.style.left = clamp(time / duration, 0, 1) * 100 + "%";
    renderLoop();
  }

  function endLoopDrag() {
    if (loopDrag && loopDrag.moved) { saveState(false); renderTimeline(); }
    loopDrag = null;
  }

  function startRegionDrag(event, regionId, dragPart) {
    const time = getTimelinePointerTime(event);
    if (time === null) return;
    event.preventDefault(); event.stopPropagation();
    regionDrag = {
      regionId, dragPart, startX: event.clientX, moved: false,
      regionElement: event.currentTarget.closest(".timeline-region")
    };
  }

  function continueRegionDrag(event) {
    if (!regionDrag) return;
    event.preventDefault();
    const time = getTimelinePointerTime(event);
    if (time === null) return;
    if (Math.abs(event.clientX - regionDrag.startX) > 2) regionDrag.moved = true;
    const r = state.regions.find(x => x.id === regionDrag.regionId);
    const duration = getTimelineDuration();
    if (!r || !duration) return;
    const newTime = Math.max(0, time);
    if (regionDrag.dragPart === "left") r.start = Math.min(newTime, r.end - 0.1);
    else if (regionDrag.dragPart === "right") r.end = Math.max(newTime, r.start + 0.1);
    r.updatedAt = new Date().toISOString();
    if (regionDrag.regionElement) {
      const s = clamp(r.start / duration, 0, 1) * 100;
      const e = clamp(r.end / duration, 0, 1) * 100;
      regionDrag.regionElement.style.left = s + "%";
      regionDrag.regionElement.style.width = Math.max(0.5, e - s) + "%";
    }
  }

  function endRegionDrag() {
    if (regionDrag && regionDrag.moved) { sortRegions(); saveState(false); renderTimeline(); renderRegions(); }
    regionDrag = null;
  }

  function startPlayheadDrag(event) {
    const time = getTimelinePointerTime(event);
    if (time === null) return;
    event.preventDefault(); event.stopPropagation();
    playheadDrag = true;
    seekTo(time, { disableLoop: true });
  }

  function continuePlayheadDrag(event) {
    if (!playheadDrag) return;
    event.preventDefault();
    const time = getTimelinePointerTime(event);
    if (time !== null) seekTo(time, { disableLoop: true });
  }

  function endPlayheadDrag() { playheadDrag = null; }

  /* ---------- project file / export ---------- */
  async function saveCuePathProjectFile() {
    updateTimestamp();
    const content = JSON.stringify(state, null, 2);
    const mimeType = "application/json;charset=utf-8";
    if ("showSaveFilePicker" in win) {
      try {
        if (!currentFileHandle) {
          currentFileHandle = await win.showSaveFilePicker({
            suggestedName: sanitizeFilename(state.project.title) + ".cuepath",
            types: [{ description: t("projectFileTypeDescription"), accept: { "application/json": [".cuepath", ".json"] } }]
          });
        }
        const writable = await currentFileHandle.createWritable();
        await writable.write(new Blob([content], { type: mimeType }));
        await writable.close();
        hasProjectFileReference = true;
        if (destroyed) return true;
        saveState(false, true);
        setMessage(t("msgProjectSavedFile"), false);
        return true;
      } catch (error) {
        if (error && error.name === "AbortError") { setMessage(t("msgSaveCancelled"), false); return false; }
        currentFileHandle = null; // reset handle on error, fall through to download
      }
    }
    if (destroyed) return false;
    downloadFile(sanitizeFilename(state.project.title) + ".cuepath", content, mimeType);
    hasProjectFileReference = true;
    saveState(false, true);
    setMessage(t("msgProjectDownloaded"), false);
    return true;
  }

  function exportJson() { return saveCuePathProjectFile(); }

  function toCsv() {
    const rows = [["type", "time", "start", "end", "label", "note", "tags", "status"]];
    state.markers.forEach(m => rows.push(["marker", secondsToTimecode(m.time), "", "", m.label, m.note, m.tags.join(", "), m.status]));
    state.regions.forEach(r => rows.push(["region", "", secondsToTimecode(r.start), secondsToTimecode(r.end), r.label, r.note, r.tags.join(", "), r.status]));
    return "﻿" + rows.map(row => row.map(escapeCsvValue).join(",")).join("\r\n");
  }

  function toMarkdown() {
    const lines = [];
    lines.push("# " + (state.project.title.trim() || t("defaultProjectTitle")), "");
    lines.push(t("exportMediaPrefix") + (state.media.fileName || t("exportMediaNone")), "");
    lines.push("## Markers", "", "| Time | Label | Tags | Status | Note |", "|---|---|---|---|---|");
    state.markers.forEach(m => lines.push("| " + [secondsToTimecode(m.time), m.label, m.tags.join(", "), m.status, m.note].map(escapeMarkdownCell).join(" | ") + " |"));
    lines.push("", "## Regions", "", "| Start | End | Label | Tags | Status | Note |", "|---|---|---|---|---|---|");
    state.regions.forEach(r => lines.push("| " + [secondsToTimecode(r.start), secondsToTimecode(r.end), r.label, r.tags.join(", "), r.status, r.note].map(escapeMarkdownCell).join(" | ") + " |"));
    return lines.join("\n");
  }

  function exportCsv() {
    updateTimestamp();
    downloadFile(sanitizeFilename(state.project.title) + ".csv", toCsv(), "text/csv;charset=utf-8");
    saveState(false); setMessage(t("msgCsvExported"), false);
  }

  function exportMarkdown() {
    updateTimestamp();
    downloadFile(sanitizeFilename(state.project.title) + ".md", toMarkdown(), "text/markdown;charset=utf-8");
    saveState(false); setMessage(t("msgMarkdownExported"), false);
  }

  function resetMediaElement() {
    audio.removeAttribute("src"); audio.removeAttribute("crossorigin"); audio.load();
  }

  function importJsonFile(file, afterImport) {
    if (!file) return;
    const reader = new win.FileReader();
    reader.onload = function () {
      if (destroyed) return;
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        if (!validateCuePathJson(parsed)) throw new Error("Invalid schema");
        state = normalizeImportedState(parsed); sortMarkers(); sortRegions();
        hasProjectFileReference = true;
        isDirty = false;
        projectFileSavePrompted = false;
        waveformBuildId += 1;
        waveform = null;
        waveformStatus = "";
        hasLoadedAudioBody = false;
        ++loadToken;
        settlePending(new Error("superseded"));
        releaseSource();
        resetMediaElement();
        saveState(false, true); render(); setMessage(t("msgProjectImported"), false);
        if (state.media.fileName) setMessage(t("msgReloadAudio", { name: state.media.fileName }), false);
        if (typeof afterImport === "function") afterImport();
      } catch (e) { setMessage(t("msgInvalidProjectFile"), true); }
    };
    reader.onerror = function () { if (!destroyed) setMessage(t("msgInvalidProjectFile"), true); };
    reader.readAsText(file);
  }

  function clearProject() {
    if (!win.confirm(t("confirmClear"))) return;
    state = createInitialState(t("defaultProjectTitle")); hasLoadedAudioBody = false;
    hasProjectFileReference = false;
    projectFileSavePrompted = false;
    waveformBuildId += 1;
    waveform = null;
    waveformStatus = "";
    ++loadToken;
    settlePending(new Error("superseded"));
    releaseSource();
    resetMediaElement();
    storageRemove();
    render(); setMessage(t("msgProjectCleared"), false);
    emit("change", cloneState());
  }

  /* ---------- rendering ---------- */
  function render() {
    dom.projectTitleInput.value = state.project.title;
    audio.playbackRate = state.settings.playbackRate;
    renderMediaInfo(); renderTimeDisplays(); renderLoop();
    renderPlaybackRateButtons(); renderTimeline(); renderMarkers(); renderRegions(); renderPlayButton(); renderDownloadsStatus();
  }

  function updateDocumentTitle() {
    if (opts.documentTitle === null) return;
    doc.title = (isDirty ? t("documentTitleDirtyPrefix") : "") + opts.documentTitle;
  }

  function renderMediaInfo() {
    rootElement.classList.toggle("audio-loaded", hasLoadedAudioBody);
    updateDocumentTitle();

    if (hasLoadedAudioBody) {
      dom.fileNameText.textContent = state.media.fileName || t("fileUnknown");
      dom.fileNameText.style.color = "var(--ok)";
    } else if (state.media.fileName) {
      dom.fileNameText.textContent = state.media.fileName;
      dom.fileNameText.style.color = "var(--danger)";
    } else {
      dom.fileNameText.textContent = t("fileNone");
      dom.fileNameText.style.color = "inherit";
    }

    if (currentFileHandle) {
      const statusText = isDirty ? t("projectUnsaved") : t("projectSynced");
      dom.projectStatusText.textContent = `${statusText} (${currentFileHandle.name})`;
      dom.projectStatusText.style.color = isDirty ? "var(--danger)" : "var(--ok)";
      dom.projectStatusText.style.maxWidth = "280px";
      dom.projectStatusText.style.overflow = "hidden";
      dom.projectStatusText.style.textOverflow = "ellipsis";
      dom.projectStatusText.style.whiteSpace = "nowrap";
    } else if (hasProjectFileReference) {
      dom.projectStatusText.textContent = t("projectDetached");
      dom.projectStatusText.style.color = "var(--text-muted)";
    } else {
      dom.projectStatusText.textContent = t("projectCacheOnly");
      dom.projectStatusText.style.color = "var(--text-muted)";
    }

    dom.durationText.textContent = secondsToTimecode(state.media.duration);

    if (!hasLoadedAudioBody && state.media.fileName) setMessage(t("msgReloadAudio", { name: state.media.fileName }), false);
    else if (!hasLoadedAudioBody) setMessage(t("messageNoAudio"), false);
  }

  function renderTimeDisplays() {
    dom.currentTimeText.textContent = secondsToTimecode(audio.currentTime || 0);
    const dur = Number.isFinite(audio.duration) ? audio.duration : state.media.duration;
    dom.durationText.textContent = secondsToTimecode(dur);
    updateTimelinePlayhead();
  }

  function renderPlayButton() {
    dom.playPauseButton.textContent = audio.paused ? t("play") : t("pause");
  }

  function renderPlaybackRateButtons() {
    if (dom.playbackRateButtons.children.length > 0) {
      Array.from(dom.playbackRateButtons.children).forEach(btn => {
        btn.classList.toggle("active", Number(btn.dataset.rate) === state.settings.playbackRate);
      });
      return;
    }
    PLAYBACK_RATES.forEach(rate => {
      const btn = doc.createElement("button");
      btn.type = "button"; btn.className = "rate-button";
      btn.dataset.rate = String(rate); btn.textContent = rate + "x";
      btn.addEventListener("click", () => setPlaybackRate(rate));
      dom.playbackRateButtons.appendChild(btn);
    });
    renderPlaybackRateButtons();
  }

  function renderLoop() {
    const loop = state.settings.loop;
    dom.loopAText.textContent = loop.a === null ? "--:--.-" : secondsToTimecode(loop.a);
    dom.loopBText.textContent = loop.b === null ? "--:--.-" : secondsToTimecode(loop.b);
    dom.toggleLoopButton.textContent = loop.enabled ? t("loopOn") : t("loopOff");
    dom.toggleLoopButton.classList.toggle("loop-on", loop.enabled);
    dom.currentTimeText.classList.toggle("loop-active", loop.enabled);
    dom.durationText.classList.toggle("loop-active", loop.enabled);
    dom.loopAbPill.classList.toggle("loop-active", loop.enabled);
    dom.cueTimeline.classList.toggle("loop-active", loop.enabled);
    const canvas = dom.cueTimeline.querySelector(".timeline-waveform");
    if (canvas) raf(() => drawWaveform(canvas));
  }

  function updateTimelinePlayhead() {
    const playhead = dom.cueTimeline.querySelector(".timeline-playhead");
    const duration = getTimelineDuration();
    if (!playhead || !duration) return;
    playhead.style.left = clamp((audio.currentTime || 0) / duration, 0, 1) * 100 + "%";
  }

  function renderTimeline() {
    const duration = getTimelineDuration();
    dom.cueTimeline.replaceChildren();
    dom.cueTimeline.classList.toggle("loop-active", state.settings.loop.enabled);
    dom.cueTimeline.onpointerdown = function (event) {
      if (isInteractiveTimelineTarget(event.target)) return;
      const time = getTimelinePointerTime(event);
      if (time !== null) seekTo(time, { disableLoop: true });
    };

    const ruler = doc.createElement("div");
    ruler.className = "timeline-ruler";
    for (let i = 0; i <= 10; i++) {
      const pct = (i / 10) * 100;
      const tick = doc.createElement("div");
      tick.className = "timeline-tick"; tick.style.left = pct + "%";
      ruler.appendChild(tick);
      if (duration) {
        const label = doc.createElement("div");
        label.className = "timeline-tick-label"; label.style.left = pct + "%";
        const parts = secondsToTimecode(duration * i / 10).split(".");
        const main = doc.createElement("span"); main.className = "tick-main"; main.textContent = parts[0];
        const ms = doc.createElement("span"); ms.className = "tick-ms"; ms.textContent = "." + parts[1];
        label.append(main, ms); ruler.appendChild(label);
      }
    }

    const loopTrack = doc.createElement("div");
    loopTrack.className = "timeline-loop-track";

    const body = doc.createElement("div"); body.className = "timeline-body";
    const waveformCanvas = doc.createElement("canvas");
    waveformCanvas.className = "timeline-waveform";
    waveformCanvas.setAttribute("aria-hidden", "true");
    const regionTrack = doc.createElement("div"); regionTrack.className = "timeline-track regions-track";
    const markerTrack = doc.createElement("div"); markerTrack.className = "timeline-track markers-track";
    const playhead = doc.createElement("div"); playhead.className = "timeline-playhead";
    playhead.addEventListener("pointerdown", startPlayheadDrag);
    body.append(waveformCanvas, regionTrack, markerTrack, playhead);

    if (!duration) {
      const empty = doc.createElement("div"); empty.className = "timeline-empty";
      empty.textContent = t("timelineEmpty");
      body.appendChild(empty); dom.cueTimeline.append(ruler, loopTrack, body); updateTimelinePlayhead(); return;
    }

    if (waveformStatus) {
      const status = doc.createElement("div");
      status.className = "timeline-waveform-status";
      status.textContent = waveformStatus;
      body.appendChild(status);
    }

    [["A", state.settings.loop.a], ["B", state.settings.loop.b]].forEach(point => {
      const label = point[0];
      const time = point[1];
      if (!Number.isFinite(time)) return;
      const el = doc.createElement("button");
      el.type = "button";
      el.className = "timeline-loop-point";
      el.style.left = clamp(time / duration, 0, 1) * 100 + "%";
      el.title = "Loop " + label + " " + secondsToTimecode(time);
      el.innerHTML = '<span class="loop-point-label">' + label + '</span><span class="loop-point-arrow">▼</span>';
      el.addEventListener("pointerdown", ev => startLoopDrag(ev, label));
      el.addEventListener("click", ev => {
        ev.stopPropagation();
        if (loopDrag && loopDrag.moved) return;
        seekTo(time, { disableLoop: true });
      });
      loopTrack.appendChild(el);
    });

    sortRegions();
    state.regions.forEach(region => {
      const s = clamp(region.start / duration, 0, 1) * 100;
      const e = clamp(region.end / duration, 0, 1) * 100;
      const el = doc.createElement("button");
      el.type = "button";
      el.className = "timeline-region status-" + normalizeStatus(region.status);
      el.style.left = s + "%"; el.style.width = Math.max(0.5, e - s) + "%";
      el.textContent = region.label || secondsToTimecode(region.start);
      el.title = secondsToTimecode(region.start) + " – " + secondsToTimecode(region.end);

      const lh = doc.createElement("div"); lh.className = "region-handle left";
      lh.addEventListener("pointerdown", ev => startRegionDrag(ev, region.id, "left"));
      const rh = doc.createElement("div"); rh.className = "region-handle right";
      rh.addEventListener("pointerdown", ev => startRegionDrag(ev, region.id, "right"));
      el.append(lh, rh);

      el.addEventListener("click", ev => {
        if (ev.target === lh || ev.target === rh) return;
        if (regionDrag && regionDrag.moved) return;
        ev.stopPropagation(); loopRegion(region.id);
      });
      regionTrack.appendChild(el);
    });

    sortMarkers();
    const timelineWidth = dom.cueTimeline.clientWidth || 1000;
    const laneOccupancy = [];

    state.markers.forEach(marker => {
      const leftPct = clamp(marker.time / duration, 0, 1) * 100;
      const xPos = (leftPct / 100) * timelineWidth;
      const labelWidth = 100;
      const labelMargin = 10;
      const range = [xPos, xPos + labelWidth + labelMargin];

      let laneIdx = 0;
      while (true) {
        if (!laneOccupancy[laneIdx]) { laneOccupancy[laneIdx] = [range]; break; }
        const collision = laneOccupancy[laneIdx].some(r => (range[0] < r[1] && range[1] > r[0]));
        if (!collision) { laneOccupancy[laneIdx].push(range); break; }
        laneIdx++;
        if (laneIdx > 10) break;
      }

      const el = doc.createElement("div");
      el.className = "timeline-marker lane-dynamic status-" + normalizeStatus(marker.status);
      el.style.left = leftPct + "%";
      el.style.setProperty("--lane-idx", laneIdx);

      const isCrowded = laneIdx >= 4;

      el.title = secondsToTimecode(marker.time) + " — " + (marker.label || t("defaultMarkerLabel"));
      const lh = doc.createElement("div"); lh.className = "timeline-marker-handle left";
      lh.addEventListener("pointerdown", ev => startMarkerDrag(ev, marker.id, "left"));

      const txt = doc.createElement("span");
      txt.className = "timeline-marker-text";
      txt.textContent = marker.label || secondsToTimecode(marker.time);
      if (isCrowded) txt.style.opacity = "0";

      const rh = doc.createElement("div"); rh.className = "timeline-marker-handle right";
      rh.addEventListener("pointerdown", ev => startMarkerDrag(ev, marker.id, "right"));

      el.append(lh, txt, rh);
      el.addEventListener("pointerdown", ev => { if (ev.target === lh || ev.target === rh) return; startMarkerDrag(ev, marker.id, "center"); });
      el.addEventListener("click", ev => {
        ev.stopPropagation();
        if (suppressNextMarkerClick) { suppressNextMarkerClick = false; return; }
        jumpToMarker(marker.id);
      });
      markerTrack.appendChild(el);
    });

    dom.cueTimeline.append(ruler, loopTrack, body);
    raf(() => drawWaveform(waveformCanvas));
    updateTimelinePlayhead();
  }

  function renderStatusOptions(cur) {
    return STATUS_OPTIONS.map(s => `<option value="${s}"${s === cur ? " selected" : ""}>${s}</option>`).join("");
  }

  function renderMarkers() {
    const c = dom.markersContainer;
    if (!state.markers.length) {
      c.innerHTML = '<div class="empty">' + escapeHtml(t("emptyMarkers")) + "</div>"; return;
    }
    const table = doc.createElement("table"); table.className = "markers-table";
    const thead = doc.createElement("thead");
    thead.innerHTML = "<tr><th>" + [t("thTime"), t("thLabel"), t("thNote"), t("thTags"), t("thStatus"), t("thActions")].map(escapeHtml).join("</th><th>") + "</th></tr>";
    const tbody = doc.createElement("tbody");
    state.markers.forEach(marker => {
      const tr = doc.createElement("tr");
      tr.innerHTML =
        '<td class="time-cell">' + secondsToTimecode(marker.time) + "</td>" +
        '<td><input type="text" value="' + escapeHtml(marker.label) + '" data-id="' + escapeHtml(marker.id) + '" data-field="label"></td>' +
        '<td><textarea data-id="' + escapeHtml(marker.id) + '" data-field="note">' + escapeHtml(marker.note) + "</textarea></td>" +
        '<td><input type="text" value="' + escapeHtml(tagsToInput(marker.tags)) + '" data-id="' + escapeHtml(marker.id) + '" data-field="tags" placeholder="' + escapeHtml(t("tagsPlaceholder")) + '"></td>' +
        '<td class="small-cell"><select data-id="' + escapeHtml(marker.id) + '" data-field="status">' + renderStatusOptions(marker.status) + "</select></td>" +
        '<td class="actions-cell"><div class="row-actions">' +
          '<button type="button" class="btn-row" data-action="jump" data-id="' + escapeHtml(marker.id) + '">' + escapeHtml(t("rowJump")) + "</button>" +
          '<button type="button" class="btn-row btn-danger" data-action="delete" data-id="' + escapeHtml(marker.id) + '">' + escapeHtml(t("rowDelete")) + "</button>" +
        "</div></td>";
      tbody.appendChild(tr);
    });
    table.append(thead, tbody); c.replaceChildren(table);
    c.querySelectorAll("input, select, textarea").forEach(el => el.addEventListener("change", () => updateMarker(el.dataset.id, el.dataset.field, el.value)));
    c.querySelectorAll("[data-action]").forEach(btn => btn.addEventListener("click", () => {
      if (btn.dataset.action === "jump") jumpToMarker(btn.dataset.id);
      else if (btn.dataset.action === "delete") deleteMarker(btn.dataset.id);
    }));
  }

  function renderRegions() {
    const c = dom.regionsContainer;
    if (!state.regions.length) {
      c.innerHTML = '<div class="empty">' + escapeHtml(t("emptyRegions")) + "</div>"; return;
    }
    const table = doc.createElement("table"); table.className = "regions-table";
    const thead = doc.createElement("thead");
    thead.innerHTML = "<tr><th>" + [t("thStart"), t("thEnd"), t("thLength"), t("thLabel"), t("thNote"), t("thTags"), t("thStatus"), t("thActions")].map(escapeHtml).join("</th><th>") + "</th></tr>";
    const tbody = doc.createElement("tbody");
    state.regions.forEach(region => {
      const dur = region.end - region.start;
      const isEditing = regionTimeEditIds.has(region.id);
      const tr = doc.createElement("tr");
      const rid = escapeHtml(region.id);

      let timeStartHtml = "<td>" + secondsToTimecode(region.start) + "</td>";
      let timeEndHtml = "<td>" + secondsToTimecode(region.end) + "</td>";
      if (isEditing) {
        timeStartHtml = '<td><input type="text" style="width:70px; font-family:monospace; font-size:12px; padding:2px 4px;" value="' + secondsToTimecode(region.start) + '" data-id="' + rid + '" data-field="start"></td>';
        timeEndHtml = '<td><input type="text" style="width:70px; font-family:monospace; font-size:12px; padding:2px 4px;" value="' + secondsToTimecode(region.end) + '" data-id="' + rid + '" data-field="end"></td>';
      }

      tr.innerHTML =
        timeStartHtml + timeEndHtml +
        '<td class="time-cell">' + secondsToTimecode(dur) + "</td>" +
        '<td><input type="text" value="' + escapeHtml(region.label) + '" data-id="' + rid + '" data-field="label"></td>' +
        '<td><textarea data-id="' + rid + '" data-field="note">' + escapeHtml(region.note) + "</textarea></td>" +
        '<td><input type="text" value="' + escapeHtml(tagsToInput(region.tags)) + '" data-id="' + rid + '" data-field="tags" placeholder="' + escapeHtml(t("tagsPlaceholder")) + '"></td>' +
        '<td class="small-cell"><select data-id="' + rid + '" data-field="status">' + renderStatusOptions(region.status) + "</select></td>" +
        '<td class="actions-cell"><div class="row-actions">' +
          '<button type="button" class="btn-row" data-action="toggle-edit" data-id="' + rid + '">' + escapeHtml(isEditing ? t("rowEditDone") : t("rowEditTime")) + "</button>" +
          '<button type="button" class="btn-row" data-action="jump" data-id="' + rid + '">' + escapeHtml(t("rowJump")) + "</button>" +
          '<button type="button" class="btn-row" data-action="loop" data-id="' + rid + '">' + escapeHtml(t("rowLoop")) + "</button>" +
          '<button type="button" class="btn-row btn-danger" data-action="delete" data-id="' + rid + '">' + escapeHtml(t("rowDelete")) + "</button>" +
        "</div></td>";
      tbody.appendChild(tr);
    });
    table.append(thead, tbody); c.replaceChildren(table);

    c.querySelectorAll("input, select, textarea").forEach(el => {
      el.addEventListener("change", () => {
        const field = el.dataset.field;
        if (field === "start" || field === "end") {
          const val = timecodeToSeconds(el.value);
          if (val !== null) updateRegion(el.dataset.id, field, val);
          else renderRegions();
        } else {
          updateRegion(el.dataset.id, field, el.value);
        }
      });
    });

    c.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if (action === "toggle-edit") {
          if (regionTimeEditIds.has(id)) regionTimeEditIds.delete(id); else regionTimeEditIds.add(id);
          renderRegions();
        } else if (action === "jump") jumpToRegion(id);
        else if (action === "loop") loopRegion(id);
        else if (action === "delete") deleteRegion(id);
      });
    });
  }

  /* ---------- keyboard ---------- */
  function handleShortcut(event) {
    const target = event.target;
    const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
    const key = event.key;
    const ctrl = event.ctrlKey || event.metaKey;
    const isSave = ctrl && (key === "s" || key === "S");

    if (isTyping && !(isSave && target === dom.projectTitleInput)) return;

    if (isSave) {
      event.preventDefault();
      if (!emit("save-request", cloneState())) exportJson();
      return;
    }
    if (ctrl || (event.altKey && key !== "ArrowLeft" && key !== "ArrowRight")) return;

    if (key === " ") { event.preventDefault(); togglePlay(); }
    else if (key === "ArrowLeft") { event.preventDefault(); skip(event.shiftKey ? -state.settings.skipLarge : event.altKey ? -1 : -state.settings.skipSmall); }
    else if (key === "ArrowRight") { event.preventDefault(); skip(event.shiftKey ? state.settings.skipLarge : event.altKey ? 1 : state.settings.skipSmall); }
    else if (key === "Home") { event.preventDefault(); goStart(); }
    else if (key === "a" || key === "A") { event.preventDefault(); setLoopA(); }
    else if (key === "b" || key === "B") { event.preventDefault(); setLoopB(); }
    else if (key === "l" || key === "L") { event.preventDefault(); toggleLoop(); }
    else if (key === "m" || key === "M") { event.preventDefault(); addMarker(); }
  }

  /* ---------- wiring ---------- */
  function bindEventListeners() {
    listen(dom.loadAudioButton, "click", () => dom.audioFileInput.click());
    listen(dom.audioFileInput, "change", async function () {
      if (this.files && this.files[0]) { const f = this.files[0]; this.value = ""; await handleAudioFile(f); }
    });
    listen(dom.importJsonButton, "click", () => dom.jsonFileInput.click());
    listen(dom.jsonFileInput, "change", function () {
      if (this.files && this.files[0]) { const f = this.files[0]; this.value = ""; importJsonFile(f); }
    });
    listen(dom.exportJsonButton, "click", exportJson);
    listen(dom.exportCsvButton, "click", exportCsv);
    listen(dom.exportMarkdownButton, "click", exportMarkdown);
    listen(dom.clearProjectButton, "click", clearProject);
    listen(dom.setDownloadsFolderButton, "click", () => setDownloadsFolder().catch(() => setMessage(t("msgDownloadsSetFailed"), true)));
    listen(dom.refreshDownloadsButton, "click", () => refreshDownloadsStatus({ requestPermission: true, tryReloadAudio: true }).catch(() => setMessage(t("msgDownloadsRefreshFailed"), true)));
    listen(dom.projectTitleInput, "change", function () {
      state.project.title = this.value.trim() || t("defaultProjectTitle"); saveState(false);
    });
    listen(dom.skipLargeBackButton, "click", () => skip(-state.settings.skipLarge));
    listen(dom.skipFiveBackButton, "click", () => skip(-5));
    listen(dom.skipSmallBackButton, "click", () => skip(-state.settings.skipSmall));
    listen(dom.skipOneBackButton, "click", () => skip(-1));
    listen(dom.playPauseButton, "click", togglePlay);
    listen(dom.skipOneForwardButton, "click", () => skip(1));
    listen(dom.skipSmallForwardButton, "click", () => skip(state.settings.skipSmall));
    listen(dom.skipFiveForwardButton, "click", () => skip(5));
    listen(dom.skipLargeForwardButton, "click", () => skip(state.settings.skipLarge));
    listen(dom.goStartButton, "click", goStart);
    listen(dom.setAButton, "click", setLoopA);
    listen(dom.setBButton, "click", setLoopB);
    listen(dom.toggleLoopButton, "click", toggleLoop);
    listen(dom.clearLoopButton, "click", clearLoop);
    listen(dom.addRegionFromLoopButton, "click", addRegionFromLoop);
    listen(dom.addMarkerButton, "click", addMarker);
    listen(dom.addRegionButton, "click", addRegionFromLoop);

    listen(audio, "loadedmetadata", function () {
      state.media.duration = Number.isFinite(this.duration) ? this.duration : (waveform && waveform.duration) || null;
      this.playbackRate = state.settings.playbackRate;
      saveState(false); render(); setMessage(t("msgAudioLoaded", { name: state.media.fileName }), false);
      emit("ready", { duration: state.media.duration, fileName: state.media.fileName, source: state.media.source });
      settlePending(null);
    });
    listen(audio, "error", function () {
      if (!hasSource()) return;
      setMessage(t("msgAudioError"), true);
      const err = new Error("Audio failed to load");
      emit("error", { type: "audio", error: err });
      settlePending(err);
    });
    listen(audio, "timeupdate", function () { enforceLoop(); renderTimeDisplays(); emit("timeupdate", { currentTime: audio.currentTime }); });
    listen(audio, "play", () => { renderPlayButton(); emit("play"); });
    listen(audio, "pause", () => { renderPlayButton(); emit("pause"); });

    if (opts.shortcuts) listen(opts.shortcuts === "document" ? doc : rootElement, "keydown", handleShortcut);

    listen(doc, "pointermove", ev => {
      continueMarkerDrag(ev); continueLoopDrag(ev); continueRegionDrag(ev); continuePlayheadDrag(ev);
    });
    const endDrags = () => { endMarkerDrag(); endLoopDrag(); endRegionDrag(); endPlayheadDrag(); };
    listen(doc, "pointerup", endDrags);
    listen(doc, "pointercancel", endDrags);

    if (opts.dragDrop) {
      const dropTarget = opts.dragDrop === "document" ? doc : rootElement;
      listen(dropTarget, "dragenter", ev => { ev.preventDefault(); rootElement.classList.add("drag-over"); });
      listen(dropTarget, "dragover", ev => { ev.preventDefault(); if (ev.dataTransfer) ev.dataTransfer.dropEffect = "copy"; rootElement.classList.add("drag-over"); });
      listen(dropTarget, "dragleave", ev => { if (!ev.relatedTarget || !dropTarget.contains(ev.relatedTarget)) rootElement.classList.remove("drag-over"); });
      listen(dropTarget, "drop", ev => {
        ev.preventDefault(); rootElement.classList.remove("drag-over");
        handleDroppedFiles(ev.dataTransfer ? ev.dataTransfer.files : []);
      });
    }

    if (typeof win.ResizeObserver === "function") {
      let last = dom.cueTimeline.clientWidth;
      const ro = new win.ResizeObserver(() => {
        const w = dom.cueTimeline.clientWidth;
        if (w === last) return;
        last = w;
        raf(renderTimeline);
      });
      ro.observe(dom.cueTimeline);
      disposers.push(() => ro.disconnect());
    } else {
      listen(win, "resize", renderTimeline);
    }

    if (opts.standalone) {
      listen(win, "beforeunload", ev => {
        if (!needsCuePathProjectFileSave()) return;
        ev.preventDefault();
        ev.returnValue = "";
      });
    }
  }

  /* ---------- public API ---------- */
  function setState(next) {
    if (destroyed) return;
    if (!next || typeof next !== "object") throw new Error("setState: object required");
    const prevName = state.media.fileName;
    state = normalizeImportedState(next);
    if (!state.media.fileName && hasLoadedAudioBody) state.media.fileName = prevName;
    sortMarkers(); sortRegions();
    saveState(false, true);
    render();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    settlePending(new Error("destroyed"));
    disposers.splice(0).forEach(fn => { try { fn(); } catch (e) { /* ignore */ } });
    rafIds.forEach(id => win.cancelAnimationFrame(id));
    rafIds.clear();
    if (fetchAbort) { try { fetchAbort.abort(); } catch (e) { /* ignore */ } fetchAbort = null; }
    if (activeAudioContext && activeAudioContext.close) { try { activeAudioContext.close(); } catch (e) { /* ignore */ } }
    activeAudioContext = null;
    try { audio.pause(); } catch (e) { /* ignore */ }
    audio.removeAttribute("src");
    try { audio.load(); } catch (e) { /* ignore */ }
    if (currentObjectUrl) { win.URL.revokeObjectURL(currentObjectUrl); currentObjectUrl = null; }
    dom.cueTimeline.onpointerdown = null;
    rootElement.replaceChildren();
    rootElement.classList.remove("cuepath-root", "audio-loaded", "drag-over");
    rootElement.removeAttribute("data-drop-hint");
    if (!hadTabindex) rootElement.removeAttribute("tabindex");
    subscribers.clear();
    waveform = null;
  }

  loadStateFromStorage();
  bindEventListeners();
  render();
  if (opts.ui.downloads) initDownloadsFolder();

  return {
    loadFile,
    loadUrl,
    loadPeaks,
    destroy,
    on,
    off,
    getState: cloneState,
    setState,
    play,
    pause,
    seek: (seconds) => seekTo(seconds),
    setPlaybackRate,
    getAudioElement: () => audio,
    exportProject: exportJson,
    exportCsv,
    exportMarkdown,
    toCsv,
    toMarkdown
  };
}

export default createCuePath;
