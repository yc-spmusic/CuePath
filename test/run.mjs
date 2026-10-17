// Headless runner: serves the repo over http, runs test/url-load.html, and smoke-tests the
// standalone CuePath.html over file:// (the double-click case). Needs Chrome/Edge + puppeteer-core.
import http from "node:http";
import { readFileSync, existsSync, statSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CANDIDATES = [process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"];
const executablePath = CANDIDATES.find(p => p && existsSync(p));
if (!executablePath) { console.error("No Chrome/Edge found; set CHROME_PATH"); process.exit(2); }

const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = join(root, rel);
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--autoplay-policy=no-user-gesture-required", "--no-sandbox"] });
let failures = 0;
const watch = (page, label) => {
  const problems = [];
  page.on("console", m => {
    if (m.type() !== "error" && m.type() !== "warning") return;
    if (/favicon/i.test(m.location().url || "")) return; // browsers always probe /favicon.ico
    if (/ERR_ABORTED|status of 404/.test(m.text()) && /favicon/i.test(m.location().url || "")) return;
    problems.push(label + " console." + m.type() + ": " + m.text() + " @" + (m.location().url || ""));
  });
  page.on("pageerror", e => problems.push(label + " pageerror: " + e.message));
  page.on("requestfailed", r => {
    const err = (r.failure() && r.failure().errorText) || "";
    if (err === "net::ERR_ABORTED") return; // intentional: destroy()/supersede aborts in-flight fetches
    problems.push(label + " requestfailed: " + r.url() + " " + err);
  });
  return problems;
};
const report = (ok, msg) => { console.log((ok ? "PASS " : "FAIL ") + msg); if (!ok) failures++; };

/* 1. core test page over http */
{
  const page = await browser.newPage();
  const problems = watch(page, "url-load");
  await page.goto(`http://127.0.0.1:${port}/test/url-load.html`);
  await page.waitForFunction("window.__done === true", { timeout: 60000 });
  const results = await page.evaluate("window.__results");
  for (const r of results) report(r.ok, r.name + (r.detail ? "  [" + r.detail + "]" : ""));
  problems.forEach(p => { console.log("PROBLEM " + p); failures++; });
  await page.close();
}

/* 2. standalone over file:// */
{
  const page = await browser.newPage();
  const problems = watch(page, "standalone");
  page.on("dialog", d => (d.type() === "beforeunload" ? d.accept() : d.dismiss()).catch(() => {})); // beforeunload guard / title prompt / project-file confirm
  await page.goto(pathToFileURL(join(root, "CuePath.html")).href);
  await page.waitForSelector(".cuepath-root .btn-load");
  const info = await page.evaluate(() => ({
    title: document.title,
    hasRoot: !!document.querySelector("#app.cuepath-root"),
    nav: !!document.querySelector(".top-nav-tag"),
    rates: document.querySelectorAll(".rate-button").length,
    proto: location.protocol
  }));
  console.log("standalone load:", JSON.stringify(info));
  report(info.proto === "file:" && info.hasRoot && info.nav && info.rates === 7, "standalone renders over file://");

  const sr = 8000, n = sr * 3, b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 330 * i / sr) * 20000), 44 + i * 2);
  const wavPath = join(mkdtempSync(join(tmpdir(), "cuepath-test-")), "tone.wav");
  writeFileSync(wavPath, b);

  const input = await page.$('input[type="file"][accept="audio/*"]');
  await input.uploadFile(wavPath);
  await page.waitForFunction("document.querySelector('.cuepath-root').classList.contains('audio-loaded') && document.querySelector('audio').duration > 2.9", { timeout: 15000 });
  await page.waitForFunction("(() => { const c = document.querySelector('canvas.timeline-waveform'); if (!c || !c.width) return false; const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data; for (let i=3;i<d.length;i+=4) if (d[i]) return true; return false; })()", { timeout: 15000 });
  report(true, "standalone: local file loaded (3s) and decoded waveform drawn");

  await page.evaluate(() => { document.querySelector("audio").currentTime = 1; });
  await page.click('[data-cp="setAButton"]');
  await page.evaluate(() => { document.querySelector("audio").currentTime = 2; });
  await page.click('[data-cp="setBButton"]');
  await page.click('[data-cp="toggleLoopButton"]');
  await page.click('[data-cp="addRegionFromLoopButton"]');
  await page.click('[data-cp="addMarkerButton"]');
  await page.click('.rate-button[data-rate="0.5"]');
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.keyboard.press("m"); // document-scope shortcut
  const s = await page.evaluate(() => window.cuepath.getState());
  report(s.markers.length === 2 && s.regions.length === 1 && s.settings.loop.enabled && s.settings.playbackRate === 0.5,
    "standalone: A/B loop, region, marker (button + M key), speed -> " + JSON.stringify({ m: s.markers.length, r: s.regions.length, loop: s.settings.loop.enabled, rate: s.settings.playbackRate }));
  report(await page.evaluate(() => window.cuepath.toCsv().split("\r\n").length === 4), "standalone: CSV has header + 2 markers + 1 region");
  await page.reload();
  await page.waitForSelector(".cuepath-root .markers-table");
  report(await page.evaluate(() => window.cuepath.getState().markers.length === 2), "standalone: state restored from localStorage after reload");
  problems.forEach(p => { console.log("PROBLEM " + p); failures++; });
  await page.close();
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
