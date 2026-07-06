import puppeteer from "puppeteer-core";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const RES = path.join(dir, "..", "android", "app", "src", "main", "res");
const PLAY = path.join(dir, "..", "play-graphics");

// ── Elementy SVG ────────────────────────────────────────────────
const DEFS = `
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#3F6212"/><stop offset="1" stop-color="#1A2E05"/>
  </linearGradient>
  <linearGradient id="leaf" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#BEF264"/><stop offset="1" stop-color="#65A30D"/>
  </linearGradient>`;

// szyszka: zdefiniowana wokół (0,0)..(0,196), środek wizualny y≈76 względem punktu zaczepienia
const CONE = `
  <path d="M 0 -30 C 18 -18 18 6 0 18 C -18 6 -18 -18 0 -30 Z" fill="#84CC16"/>
  <g fill="url(#leaf)" stroke="#4D7C0F" stroke-width="4">
    <path d="M -8 -6 C -60 -2 -78 40 -62 78 C -30 88 -4 66 -2 20 Z"/>
    <path d="M 8 -6 C 60 -2 78 40 62 78 C 30 88 4 66 2 20 Z"/>
    <path d="M -6 30 C -52 40 -62 86 -44 122 C -14 128 6 100 4 56 Z"/>
    <path d="M 6 30 C 52 40 62 86 44 122 C 14 128 -6 100 -4 56 Z"/>
    <path d="M -4 78 C -38 92 -40 136 -22 162 C 2 166 14 138 10 100 Z"/>
    <path d="M 4 78 C 38 92 40 136 22 162 C -2 166 -14 138 -10 100 Z"/>
    <path d="M 0 120 C -22 138 -18 176 0 196 C 18 176 22 138 0 120 Z"/>
  </g>`;

// cone at translate(cx,cy) scale(k): wizualny środek szyszki to lokalne y≈83 (od -44 do 210? faktycznie -30..196 → środek 83)
function coneAt(cx, cy, k) {
  return `<g transform="translate(${cx},${cy}) scale(${k}) translate(0,-83)">${CONE}</g>`;
}

function svgSquare(S, { withBg, coneScale }) {
  return `<svg width="${S}" height="${S}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>${DEFS}</defs>
    ${withBg ? '<rect width="512" height="512" fill="url(#bg)"/>' : ""}
    ${coneAt(256, 256, coneScale)}
  </svg>`;
}

function svgBg(S) {
  return `<svg width="${S}" height="${S}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>${DEFS}</defs><rect width="512" height="512" fill="url(#bg)"/>
  </svg>`;
}

function svgSplash(W, H) {
  const k = Math.min(W, H) / 512;
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>${DEFS}</defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    ${coneAt(W / 2, H / 2, 1.1 * k)}
  </svg>`;
}

function svgFeature() {
  return `<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
    <defs>${DEFS}</defs>
    <rect width="1024" height="500" fill="url(#bg)"/>
    ${coneAt(215, 250, 1.55)}
    <text x="400" y="235" font-family="Segoe UI, sans-serif" font-size="86" font-weight="700" fill="#FFFFFF">Warzelnik</text>
    <text x="405" y="295" font-family="Segoe UI, sans-serif" font-size="30" fill="#D9F99D">Twój asystent piwowarski</text>
    <text x="405" y="345" font-family="Segoe UI, sans-serif" font-size="30" fill="#D9F99D">receptury · kalkulatory · dziennik warzenia</text>
  </svg>`;
}

// ── Render ──────────────────────────────────────────────────────
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
});
const page = await browser.newPage();

async function render(svg, W, H, outPath, transparent) {
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.setContent(
    `<html><head><style>*{margin:0;padding:0}body{background:${transparent ? "transparent" : "#000"}}</style></head><body>${svg}</body></html>`
  );
  const el = await page.$("svg");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await el.screenshot({ path: outPath, omitBackground: !!transparent });
  console.log("->", path.relative(path.join(dir, ".."), outPath));
}

// legacy launcher (pelny kwadrat z gradientem)
const legacy = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [d, S] of Object.entries(legacy)) {
  const svg = svgSquare(S, { withBg: true, coneScale: 1.5 });
  await render(svg, S, S, path.join(RES, `mipmap-${d}`, "ic_launcher.png"));
  await render(svg, S, S, path.join(RES, `mipmap-${d}`, "ic_launcher_round.png"));
}

// adaptive: foreground (przezroczysty, strefa bezpieczna) + background (gradient PNG)
const adaptive = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
for (const [d, S] of Object.entries(adaptive)) {
  await render(svgSquare(S, { withBg: false, coneScale: 1.15 }), S, S, path.join(RES, `mipmap-${d}`, "ic_launcher_foreground.png"), true);
  await render(svgBg(S), S, S, path.join(RES, `mipmap-${d}`, "ic_launcher_bg.png"));
}

// splash
await render(svgSplash(480, 320), 480, 320, path.join(RES, "drawable", "splash.png"));
const ports = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
for (const [d, [w, h]] of Object.entries(ports)) {
  await render(svgSplash(w, h), w, h, path.join(RES, `drawable-port-${d}`, "splash.png"));
  await render(svgSplash(h, w), h, w, path.join(RES, `drawable-land-${d}`, "splash.png"));
}

// grafiki Play
await render(svgSquare(512, { withBg: true, coneScale: 1.5 }), 512, 512, path.join(PLAY, "icon-512.png"));
await render(svgFeature(), 1024, 500, path.join(PLAY, "feature-1024x500.png"));

await browser.close();
console.log("DONE");
