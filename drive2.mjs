import { chromium } from "playwright-core";

const BRAVE = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
const URL = "http://127.0.0.1:5173/";

const browser = await chromium.launch({ executablePath: BRAVE, headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 820 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(URL, { waitUntil: "networkidle" });

// reveal game UI + stats button
await page.click("#block");
await page.waitForTimeout(300);
await page.click("#show_stat");
await page.waitForTimeout(400);
const statsTitle = (await page.textContent("#modal_title"))?.trim();
await page.screenshot({ path: "/tmp/shot-4-stats.png" });

// open cheat from stats
await page.click("#cheat_modal_open");
await page.waitForTimeout(400);
const cheatTitle = (await page.textContent("#modal_title"))?.trim();
await page.screenshot({ path: "/tmp/shot-5-cheat.png" });

// close cheat -> should return to stats (closeTo)
await page.click("#modal_close");
await page.waitForTimeout(400);
const backToTitle = (await page.textContent("#modal_title"))?.trim();
const stillOpen = (await page.getAttribute("#modal", "hidden")) === null;

console.log(JSON.stringify({ statsTitle, cheatTitle, backToTitle, stillOpen, errors }, null, 2));
await browser.close();
