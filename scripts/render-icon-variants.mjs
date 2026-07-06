import puppeteer from "puppeteer-core";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(dir, "..", "play-graphics", "icon-variants");
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: 2200, height: 600, deviceScaleFactor: 1 });
await page.goto("file:///" + path.join(dir, "icon-variants.html").replace(/\\/g, "/"), { waitUntil: "networkidle0" });

for (const id of ["A", "B", "C", "D"]) {
  const el = await page.$(`#${id}`);
  await el.screenshot({ path: `${OUT}/wariant-${id}.png` });
  console.log("rendered", id);
}
await browser.close();
console.log("DONE");
