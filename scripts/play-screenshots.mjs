import puppeteer from "puppeteer-core";
import fs from "fs";

const OUT = "C:/Users/marci/Desktop/Projekty/brewing-app/play-graphics/screenshots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: 360, height: 780, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await page.goto("http://localhost:5199/warzelnik/", { waitUntil: "networkidle0" });
// nadpisz dialogi, zeby nic nie blokowalo
page.on("dialog", (d) => d.accept());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickByText(selector, text) {
  await page.evaluate(
    (sel, t) => {
      const el = [...document.querySelectorAll(sel)].find((b) => b.innerText.includes(t));
      if (el) el.click();
    },
    selector,
    text
  );
  await sleep(600);
}

async function shot(name) {
  await sleep(400);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("shot:", name);
}

// 1. Receptury (lista)
await clickByText("nav button", "Receptury");
await shot("01-receptury");

// 2. Edytor receptury
await page.evaluate(() => document.querySelector("main button.block")?.click());
await sleep(600);
await shot("02-edytor");

// 3. Skladniki
await clickByText("nav button", "Składniki");
await shot("03-skladniki");

// 4. Warzenie - gotowanie
await clickByText("nav button", "Warzenie");
await clickByText("main button", "Gotowanie");
await shot("04-warzenie");

// 5. Narzedzia
await clickByText("nav button", "Narzędzia");
await shot("05-narzedzia");

await browser.close();
console.log("DONE");
