const { chromium } = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const screenshots = [];
const trace = [];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  const html = 'file://' + process.cwd() + '/dist/index.html';
  await page.goto(html, { waitUntil: 'load' });
  await sleep(500);

  // Step 1: Title screen screenshot
  await page.screenshot({ path: 'screenshots/01-title.png' });
  console.log('Screenshot: 01-title.png');
  trace.push({ event: 'start', t: 0, screenshot: '01-title.png' });

  // Step 2: Click to start
  await page.click('canvas');
  await sleep(1500); // Wait for signal to arrive
  await page.screenshot({ path: 'screenshots/02-signal-arrived.png' });
  console.log('Screenshot: 02-signal-arrived.png');

  // Step 3: Decision 1 - Route to Alpha (first channel, x~200 y~400)
  const canvas = await page.$('canvas');
  const rect = await canvas.boundingBox();
  // Click Alpha channel (leftmost)
  await page.mouse.click(rect.x + 200, rect.y + 410);
  await sleep(800);
  await page.screenshot({ path: 'screenshots/03-route-alpha.png' });
  console.log('Screenshot: 03-route-alpha.png');
  trace.push({ event: 'meaningful_decision', t: trace[trace.length-1].t + 2, screenshot: '03-route-alpha.png', detail: 'Routed to Alpha channel' });

  // Continue routing - click to advance through rounds
  for (let i = 0; i < 4; i++) {
    await sleep(1500); // Wait for next signal
    // Check if interference appeared by checking if canvas shows diversion options
    const content = await page.evaluate(() => document.querySelector('canvas').toDataURL().slice(0, 50));
    // Try clicking the route area
    await page.mouse.click(rect.x + 350, rect.y + 410);
    await sleep(800);
    await page.screenshot({ path: `screenshots/0${4+i}-round-${i+2}.png` });
    console.log(`Screenshot: 0${4+i}-round-${i+2}.png`);

    // Check if we're in divert mode and handle it
    const inDivert = await page.evaluate(() => {
      try { return state === 'divert'; } catch(e) { return false; }
    });
    if (inDivert) {
      trace.push({ event: 'escalation', t: trace[trace.length-1].t + 3, screenshot: `0${4+i}-round-${i+2}.png`, detail: 'Interference spike detected' });
      // Choose DIVERT (safe option, left button)
      await page.mouse.click(rect.x + 260, rect.y + 300);
      await sleep(600);
      await page.screenshot({ path: `screenshots/0${9+i}-divert-response.png` });
      console.log(`Screenshot: 0${9+i}-divert-response.png`);
      trace.push({ event: 'meaningful_decision', t: trace[trace.length-1].t + 1, screenshot: `0${9+i}-divert-response.png`, detail: 'Chose DIVERT to manage interference' });
    }
  }

  // Step: Check if we reached payoff phase
  const inPayoff = await page.evaluate(() => {
    try { return state === 'payoff'; } catch(e) { return false; }
  });

  if (inPayoff) {
    await page.screenshot({ path: 'screenshots/14-payoff.png' });
    console.log('Screenshot: 14-payoff.png');
    // Decision 3 - Choose Harmonic Stack (middle option)
    await page.mouse.click(rect.x + 480, rect.y + 300);
    await sleep(800);
    await page.screenshot({ path: 'screenshots/15-outcome.png' });
    console.log('Screenshot: 15-outcome.png');
    trace.push({ event: 'payoff', t: trace[trace.length-1].t + 2, screenshot: '14-payoff.png', detail: 'Chose Harmonic Stack final strategy' });
    trace.push({ event: 'outcome', t: trace[trace.length-1].t + 1, screenshot: '15-outcome.png', detail: 'Game outcome reached' });
  } else {
    // Haven't reached payoff yet, continue routing
    console.log('Not in payoff yet, continuing...');
    await page.mouse.click(rect.x + 350, rect.y + 410);
    await sleep(1500);
    await page.mouse.click(rect.x + 500, rect.y + 410);
    await sleep(1500);
    await page.screenshot({ path: 'screenshots/14-later.png' });
  }

  // Restart
  await page.click('canvas');
  await sleep(500);
  await page.screenshot({ path: 'screenshots/16-restart.png' });
  console.log('Screenshot: 16-restart.png');
  trace.push({ event: 'restart', t: trace[trace.length-1].t + 1, screenshot: '16-restart.png' });

  // Get game trace data
  const gameTrace = await page.evaluate(() => {
    try { return JSON.stringify(trace || []); } catch(e) { return '[]'; }
  });
  console.log('Game trace:', gameTrace);

  await browser.close();
  console.log('Playtrace complete. Screenshots:', fs.readdirSync('screenshots/').length);
})();
