import { chromium } from 'playwright';

const browser = await chromium.launch();
const page    = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

// Energia — topo (KPIs + filtros + gráficos)
await page.goto('http://localhost:3000/energia', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'screenshot-energia-top.png' });

// Energia — tabela (scroll até o fim)
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
await page.waitForTimeout(400);
await page.screenshot({ path: 'screenshot-energia-table.png' });

// Visão Geral
await page.goto('http://localhost:3000/visao-geral', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'screenshot-visao-geral.png' });

await browser.close();
console.log('Done.');
