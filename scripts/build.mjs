// Build: src/ -> dist/ (ESM + CSS for embedding) and CuePath.html (single-file standalone app).
// Usage: npm install && npm run build
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => join(root, ...a);
const pkg = JSON.parse(readFileSync(p("package.json"), "utf8"));
const VERSION = "v" + pkg.version.replace(/-beta$/i, "-BETA");

mkdirSync(p("dist"), { recursive: true });

// 1. ESM for hosts (vendored by the hub). Unminified for readability; no dependencies.
await build({
  entryPoints: [p("src/cuepath-core.js")],
  outfile: p("dist/cuepath-core.mjs"),
  bundle: true, format: "esm", target: "es2020", charset: "utf8", legalComments: "none"
});

// 2. CSS (scoped under .cuepath-root).
copyFileSync(p("src/cuepath-core.css"), p("dist/cuepath-core.css"));

// 3. Standalone: classic IIFE script, inlined together with the CSS so file:// works.
const iife = await build({
  entryPoints: [p("src/standalone.js")],
  write: false, bundle: true, format: "iife", target: "es2020", charset: "utf8", legalComments: "none",
  define: { __CUEPATH_VERSION__: JSON.stringify(VERSION) }
});
const js = iife.outputFiles[0].text.replace(/<\/script/gi, "<\/script");
const css = readFileSync(p("src/cuepath-core.css"), "utf8");
const tpl = readFileSync(p("src/standalone.template.html"), "utf8");
// function replacers: avoid "$&"-style patterns in bundle text being interpreted
const html = tpl
  .replace("/*__CUEPATH_CSS__*/", () => css.replace(/\s+$/, ""))
  .replace("/*__CUEPATH_JS__*/", () => js.replace(/\s+$/, ""));
writeFileSync(p("CuePath.html"), html.replace(/\r\n/g, "\n"), "utf8");
console.log("built dist/cuepath-core.mjs, dist/cuepath-core.css, CuePath.html (" + VERSION + ")");
