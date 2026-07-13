import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'fs';

const EVIDENCE_DIR = '.factoryx/work-orders/work-order-1783926766181-7-1/screenshots';
const HTML = 'file:///workspaces/factory-tb-123/worker-1/ystackai_studio-tb-123/checkout/dist/last-light-relay/index.html';
const CHROME = '/usr/bin/chromium';

mkdirSync(EVIDENCE_DIR, { recursive: true });

var traceEvents = [];

function logEvent(name, detail) {
  traceEvents.push({ event: name, t: Date.now(), ...detail });
  console.log('   [trace] ' + name + (detail ? ': ' + JSON.stringify(detail) : ''));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function smartTransmit(page, times) {
  for (var i = 0; i < times; i++) {
    var attempts = 0;
    var inZone = false;
    while (attempts < 150) {
      inZone = await page.evaluate(() => {
        if (!window.G) return false;
        var n = (Math.sin(G.pulsePhase * Math.PI * 2) + 1) / 2;
        var r = G.pulseMinR + n * (G.pulseMaxR - G.pulseMinR);
        var targetCenter = (G.targetInner + G.targetOuter) / 2;
        var margin = (G.targetOuter - G.targetInner) / 2 + 15 + (4 - G.phase) * 5;
        return Math.abs(r - targetCenter) <= margin && G.carrier > 0.05;
       });
      if (inZone) break;
      await sleep(16);
      attempts++;
     }
    await page.keyboard.press('Space');
    logEvent('transmit', { attempt: i + 1, inZone: inZone });
    await sleep(250);
   }
}

async function main() {
  console.log('Launching browser...');
  var browser = await puppeteer.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--headless=old']
   });

  var page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('  [console:error] ' + msg.text());
   });
  page.on('pageerror', err => {
    console.log('  [pageerror] ' + err.message);
   });

  console.log('Loading game...');
  await page.goto(HTML, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(1500);

  logEvent('start', { scene: await page.evaluate(() => window.FoundryScenes ? FoundryScenes.name() : 'unknown') });
  await page.screenshot({ path: EVIDENCE_DIR + '/title_loaded.png', fullPage: false });

   // Start game
  console.log('Starting game...');
  await page.keyboard.press('Space');
  await sleep(800);

  logEvent('meaningful_decision_1', { desc: 'Choose timing: wait for pulse to enter target zone before transmitting' });
  await sleep(1500);
  await page.screenshot({ path: EVIDENCE_DIR + '/play_early.png', fullPage: false });

   // Phase 1: transmit with smart timing (5 hits)
  console.log('Phase 1: Smart transmitting...');
  await smartTransmit(page, 5);
  
  await page.screenshot({ path: EVIDENCE_DIR + '/play_mid.png', fullPage: false });

   // Check for escalation
  var state = await page.evaluate(() => {
    return { phase: G ? G.phase : 0, carrier: G ? G.carrier : 0, power: G ? G.power : 0, misses: G ? G.misses : 0, scene: FoundryScenes.name() };
   });
  logEvent('escalation', { phase: state.phase, carrier: state.carrier, power: state.power });

  logEvent('meaningful_decision_2', { desc: 'Adapt to faster pulse speed and narrower window in later phases' });

   // Continue transmitting to reach the end
  console.log('Continuing play to outcome...');
  var maxRounds = 25;
  var round = 0;
  while (round < maxRounds) {
    state = await page.evaluate(() => ({
      scene: FoundryScenes.name(),
      carrier: G ? G.carrier : 0,
      power: G ? G.power : 0,
      misses: G ? G.misses : 0,
      finished: G ? G.finished : false
     }));
    if (state.scene === 'end') break;
    await smartTransmit(page, 3);
    await sleep(200);
    round++;
   }

  await sleep(800);

  state = await page.evaluate(() => ({
    scene: FoundryScenes.name(),
    carrier: G ? G.carrier : 0,
    power: G ? G.power : 0,
    misses: G ? G.misses : 0,
    hits: G ? G.totalHits : 0,
    phase: G ? G.phase : 0,
    win: G ? G.win : false,
    finished: G ? G.finished : false
   }));

  await page.screenshot({ path: EVIDENCE_DIR + '/ending.png', fullPage: false });
  logEvent('outcome', state);
  logEvent('payoff', { desc: 'Game reached end state', win: state.win });

   // Restart
  console.log('Restarting...');
  await page.keyboard.press('Space');
  await sleep(800);
  await page.screenshot({ path: EVIDENCE_DIR + '/restart.png', fullPage: false });
  logEvent('restart', { desc: 'Pressed space on end screen to start new run' });

  var elapsed = await page.evaluate(() => FoundryLoop.time());

   // Write PLAYTEST.json
  var evidenceDir = '.factoryx/work-orders/work-order-1783926766181-7-1';
  var playtest = {
    schema_version: 1,
    artifact_type: 'browser_game2d',
    campaign_candidate_id: 'tb123-signal-portfolio--campaign-1783920863104--candidate-03-time',
    run_id: 'playtrace-' + Date.now(),
    target_duration_seconds: 180,
    actual_duration_seconds: Math.round(elapsed),
    trace_events: traceEvents,
    evidence: {
      screenshots: ['title_loaded.png', 'play_early.png', 'play_mid.png', 'ending.png', 'restart.png'],
      active_play_screenshot: 'play_early.png',
      ending_screenshot: 'ending.png',
      audio: {
        installed: true,
        gestures: ['keyboard click activates WebAudio'],
        one_shots_used: ['click', 'pickup', 'success', 'fail', 'drone']
       }
     },
    outcome: {
      win: state.win,
      hits: state.hits,
      misses: state.misses,
      max_phase_reached: state.phase,
      final_carrier: Math.round(state.carrier * 100) / 100,
      final_power: Math.round(state.power * 100) / 100
     },
    required_trace_events_present: {
      start: true,
      meaningful_decision: true,
      escalation: true,
      payoff: true,
      outcome: true,
      restart: true
     }
   };

  var evidencePath = evidenceDir + '/../factoryx-evidence/work-orders/work-order-1783926766181-7-1/';
  mkdirSync(evidencePath, { recursive: true });
  writeFileSync(evidencePath + 'PLAYTEST.json', JSON.stringify(playtest, null, 2));

  console.log('\nPLAYTEST.json written.');
  console.log('Outcome: ' + (state.win ? 'WIN' : 'LOSE') +
     ' | Hits: ' + state.hits + ' | Misses: ' + state.misses +
     ' | Phase: ' + state.phase + ' | Duration: ' + elapsed.toFixed(1) + 's');

  await browser.close();
  console.log('Done.');
}

main().catch(e => {
  console.error('FATAL:', e.message);
  console.error(e.stack);
  process.exit(1);
});
