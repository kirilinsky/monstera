import { chromium } from "playwright-core";

const BRAVE = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
const URL = "http://127.0.0.1:5173/";

const browser = await chromium.launch({
  executablePath: BRAVE,
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 420, height: 820 } });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(URL, { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/shot-1-app.png" });

// open devlog via "?" button
await page.click("#showDevlog");
await page.waitForTimeout(500);
const modalVisibleAfterOpen = await page.isVisible("#modal");
await page.screenshot({ path: "/tmp/shot-2-devlog.png" });
const title = await page.textContent("#modal_title");

// click backdrop to close
await page.click(".modal__backdrop", { position: { x: 8, y: 8 } });
await page.waitForTimeout(400);
const modalHiddenAfterBackdrop = await page.getAttribute("#modal", "hidden");
await page.screenshot({ path: "/tmp/shot-3-closed.png" });

// reopen + Esc to close
await page.click("#showDevlog");
await page.waitForTimeout(300);
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
const modalHiddenAfterEsc = await page.getAttribute("#modal", "hidden");

console.log(
  JSON.stringify(
    {
      modalVisibleAfterOpen,
      title: title?.trim(),
      closedByBackdrop: modalHiddenAfterBackdrop !== null,
      closedByEsc: modalHiddenAfterEsc !== null,
      errors,
    },
    null,
    2,
  ),
);

await browser.close();
