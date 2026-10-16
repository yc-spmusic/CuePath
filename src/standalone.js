// Entry point of the standalone CuePath.html app (bundled to a classic IIFE script by scripts/build.mjs).
import { createCuePath } from "./cuepath-core.js";

const host = document.getElementById("app");
const instance = createCuePath(host, {
  standalone: true,
  storageKey: "cuepath:html:mvp",
  documentTitle: "CuePath — 故事痕跡音樂藝術",
  header: {
    logoSrc: "assets/logo-icon.png",
    logoAlt: "Story Path Music",
    tag: "CuePath",
    version: __CUEPATH_VERSION__
  }
});

// Handy for debugging from the devtools console.
window.cuepath = instance;
