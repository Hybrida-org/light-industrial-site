// Copies site-chrome.js's nav, footer and phone card into each page's HTML, so
// tools that read raw HTML without running scripts (SEO and site scanners) see
// the real menu, email, phone and address. Visitors always get the JS version:
// site-chrome.js still runs and replaces the slot contents with the same markup.
//
// Run it after changing site-chrome.js, otherwise the static copy goes stale:
//   python3 -m http.server 8769          # from the repo root, in another tab
//   PLAYWRIGHT=/path/to/node_modules/playwright-core/index.mjs \
//   CHROME="/path/to/Chrome" node docs/prerender-chrome.mjs
// PLAYWRIGHT defaults to the package 'playwright-core'; CHROME to Playwright's own.
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright-core');
const BASE = process.env.BASE || 'http://localhost:8769';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SLOTS = ['nav', 'footer', 'phone'];

// Snapshot the slots the moment site-chrome.js finishes, before any page script
// (reveal animations etc.) touches them.
const SNAP = `\n;window.__chrome = {};[${SLOTS.map((s) => `'${s}'`)}].forEach(function (k) {
  var el = document.querySelector('[data-site-' + k + ']'); if (el) window.__chrome[k] = el.innerHTML; });`;

const pages = fs.readdirSync(ROOT, { recursive: true })
  .filter((f) => f.endsWith('index.html') && !f.includes('node_modules'))
  .filter((f) => fs.readFileSync(path.join(ROOT, f), 'utf8').includes('data-site-nav'));

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
for (const file of pages) {
  const dir = path.dirname(file);                     // '.' for the home page
  const page = await browser.newPage();
  await page.route('**/site-chrome.js*', async (route) => {
    const res = await route.fetch();
    route.fulfill({ response: res, body: (await res.text()) + SNAP });
  });
  await page.goto(`${BASE}/${dir === '.' ? '' : dir + '/'}`, { waitUntil: 'load' });
  const chrome = await page.evaluate(() => window.__chrome);
  await page.close();

  // site-chrome.js writes absolute URLs from its own address; make them relative
  // to the page's folder so the static copy works off the disk too.
  const up = dir === '.' ? '' : '../'.repeat(dir.split(path.sep).length);
  let html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const k of SLOTS) {
    if (chrome[k] == null) continue;
    const inner = chrome[k].split(BASE + '/').join(up);
    const re = new RegExp(`(<(div|footer)\\b[^>]*data-site-${k}\\b[^>]*>)(?:<!--prerendered-->[\\s\\S]*?<!--/prerendered-->)?(</\\2>)`);
    if (!re.test(html)) throw new Error(`${file}: no empty or prerendered ${k} slot`);
    html = html.replace(re, (_, open, tag, close) => `${open}<!--prerendered-->${inner}<!--/prerendered-->${close}`);
  }
  fs.writeFileSync(path.join(ROOT, file), html);
  console.log('prerendered', file, Object.keys(chrome).join(' '));
}
await browser.close();
