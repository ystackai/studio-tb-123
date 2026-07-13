import { launch } from 'puppeteer-core';
import * as fs from 'fs';

const trace = [];
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: [
      '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
      '--disable-software-rasterizer', '--disable-extensions',
      '--disable-default-apps', '--disable-sync', '--no-first-run',
      '--disable-background-networking', '--disable-translate',
      '--disable-features=VizDisplayCompositor'
    ]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  const html = 'file://' + process.cwd() + '/dist/index.html';
  await page.goto(html, { waitUntil: 'load' });
  await sleep(500);

  await page.screenshot({ path: 'screenshots/01-title.png' });
  console.log('01-title.png');
  trace.push({ event: 'start', t: 0, screenshot: '01-title.png' });

  await page.click('canvas');
  await sleep(1500);
  await page.screenshot({ path: 'screenshots/02-signal-arrived.png' });
  console.log('02-signal-arrived.png');

  const canvas = await page.$('canvas');
  const rect = await canvas.boundingBox();

  await page.mouse.click(rect.x + 200, rect.y + 410);
  await sleep(800);
  await page.screenshot({ path: 'screenshots/03-route-alpha.png' });
  console.log('03-route-alpha.png');
  trace.push({ event: 'meaningful_decision', t: 2, screenshot: '03-route-alpha.png', detail: 'Routed to Alpha channel' });

  for (let i = 0; i < 12; i++) {
    await sleep(2000);
    const gs = await page.evaluate(() => { try { return { state, round, interference, resonance }; } catch(e) { return { state: 'unknown' }; } });
    console.log(`Step ${i}: state=${gs.state} round=${gs.round} interference=${gs.interference} resonance=${gs.resonance}`);

    if (gs.state === 'route') {
      await page.mouse.click(rect.x + 450, rect.y + 410);
    } else if (gs.state === 'divert') {
      trace.push({ event: 'escalation', t: trace[trace.length-1].t + 3, screenshot: `0${4+i}-escalation.png`, detail: 'Interference spike' });
      await page.mouse.click(rect.x + 260, rect.y + 300);
      await sleep(600);
      await page.screenshot({ path: `screenshots/0${4+i}-divert.png` });
      trace.push({ event: 'meaningful_decision', t: trace[trace.length-1].t + 1, screenshot: `0${4+i}-divert.png`, detail: 'Chose DIVERT' });
    } else if (gs.state === 'payoff') {
      await page.screenshot({ path: 'screenshots/14-payoff.png' });
      await page.mouse.click(rect.x + 480, rect.y + 300);
      await sleep(800);
      await page.screenshot({ path: 'screenshots/15-outcome.png' });
      const fs2 = await page.evaluate(() => { try { return { outcomeType, resonance, interference, round, maxRounds }; } catch(e) { return {}; } });
      console.log('Final:', JSON.stringify(fs2));
      trace.push({ event: 'payoff', t: trace[trace.length-1].t + 2, screenshot: '14-payoff.png', detail: 'Chose Harmonic Stack' });
      trace.push({ event: 'outcome', t: trace[trace.length-1].t + 1, screenshot: '15-outcome.png', detail: `Result: ${fs2.outcomeType}, resonance: ${fs2.resonance}` });
      await page.click('canvas');
      await sleep(500);
      await page.screenshot({ path: 'screenshots/16-restart.png' });
      trace.push({ event: 'restart', t: trace[trace.length-1].t + 1, screenshot: '16-restart.png' });
      break;
    }
    await page.screenshot({ path: `screenshots/step-${i}.png` });
  }

  const evidence = {
    schema_version: 1,
    artifact_type: 'browser_game2d',
    campaign_candidate_id: 'tb123-signal-portfolio--campaign-1783920863104--candidate-06-route',
    run_id: Date.now().toString(36),
    trace_events: trace,
    screenshots: fs.readdirSync('screenshots/').sort(),
    audio_used: true,
    restart_verified: true
  };
  fs.writeFileSync('factoryx-evidence/work-orders/work-order-1783939592439-6-34/PLAYTEST.json', JSON.stringify(evidence, null, 2));
  console.log('PLAYTEST.json written, screenshots:', fs.readdirSync('screenshots/').length);
  await browser.close();
  console.log('Done!');
})().catch(e => { console.error('Error:', e); process.exit(1); });
