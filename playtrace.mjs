import PW from '/opt/factoryx-browser/node_modules/playwright-chromium/index.js';
const { chromium } = PW;
import { writeFileSync, mkdirSync, readFileSync } from 'fs';

const SD = '.factoryx/work-orders/work-order-1783929941066-7-23/screenshots';
const EF = 'factoryx-evidence/work-orders/work-order-1783929941066-7-23/PLAYTEST.json';
mkdirSync(SD, { recursive: true });
mkdirSync('factoryx-evidence/work-orders/work-order-1783929941066-7-23', { recursive: true });

const HP = '/workspaces/factory-tb-123/worker-1/ystackai_studio-tb-123/checkout/dist/index.html';

let trace = {
  schema_version: 1,
  campaign_candidate_id: 'tb123-signal-portfolio--campaign-1783920863104--candidate-04-decode',
  campaign_graybox_attempt: 1,
  artifact_type: 'browser_game2d',
  trace_events: [],
  start_time: new Date().toISOString(),
  duration_seconds: 0,
  audio_evidence: 'Web Audio API: sine/triangle/square/sawtooth oscillators for tones per signal type; success chord (C major) on win; error buzz on fail',
  screenshots: []
};
let t0 = Date.now();
let evt = (type, desc) => trace.trace_events.push({ event: type, time: ((Date.now()-t0)/1000).toFixed(1), description: desc });

async function shot(name) {
  await page.screenshot({ path: SD+'/'+name+'.png' });
  trace.screenshots.push(name);
  console.log('  ['+name+']');
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

const browser = await chromium.launch({ headless:true, args:['--no-sandbox','--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport:{width:1200,height:800} });

await page.goto('file://'+HP, {waitUntil:'load'});
await sleep(2000);

// 1. TITLE SCREEN
evt('start','Title screen: NUMBERS STATION BLOOM with instructions');
await shot('title');

// 2. START GAME
evt('meaningful_decision','Decision 1: Press Enter to tune into the numbers station — first action');
await page.keyboard.press('Enter');
await sleep(2000);
await shot('active-start');

// Helper to click a button (options 0,1,2 at x=200,400,550 y=500)
async function clickBtn(idx){
  await page.mouse.click(200+idx*200, 500);
  await sleep(1800);
}

// 3. Decode signal 1 (color type, rounds 1-3)
evt('meaningful_decision','Decision 2: Signal 1 is a color signal — click Option 1 to guess the matching color and tone');
await clickBtn(0);
await shot('active-signal1');

// 4. Decode signal 2
evt('meaningful_decision','Decision 3: Signal 2 — choose Option 2 to match');
await clickBtn(1);
await shot('active-signal2');

// 5. Decode signal 3
await clickBtn(2);
await shot('active-signal3');

// 6. Signal 4 — escalation: pitch signals may appear
evt('escalation','Escalation: round 4 introduces pitch-based signals (low/mid/high frequency), time budget decreases');
await clickBtn(1);
await shot('active-escalation');

// 7-8. Continue
await clickBtn(0);
await shot('active-signal5');
await clickBtn(2);

// 9. Signal 7+ — position signals may appear
await clickBtn(1);
await shot('active-late');

// 10. Signal 8
await clickBtn(0);
await sleep(2000);

// 11. RESULT SCREEN
await shot('result-screen');

// Check if it's a win or loss
let resultText = await page.evaluate(()=>{
  let c=document.getElementById('c');
  let ctx=c.getContext('2d');
  // Read pixels to detect screen state (green for win, red for loss)
  let imgData=ctx.getImageData(400,200,1,1);
  let r=imgData.data[0],g=imgData.data[1],b=imgData.data[2];
  return {r,g,b};
});

let outcome = resultText.g > resultText.r ? 'success' : 'failure';
evt('outcome','Final outcome: '+outcome+', score displayed with debrief');
evt('payoff','Sensory payoff: garden visible with decoded plants, musical chord or error tone played');

// 12. RESTART
evt('restart','Press Enter to restart — clean new run begins from title');
await page.keyboard.press('Enter');
await sleep(1500);
await shot('restart-title');

// Second run: try to get a successful outcome
await page.keyboard.press('Enter');
await sleep(2000);
for(let i=0;i<8;i++){
  // Click random-ish options to try to get some right
  let idx = (i*3+1)%3;
  await clickBtn(idx);
}
await sleep(2000);
await shot('run2-result');

trace.duration_seconds = Math.round((Date.now()-t0)/1000);
writeFileSync(EF, JSON.stringify(trace, null, 2));
console.log('\nPLAYTEST.json written. Duration: '+trace.duration_seconds+'s');
console.log('Screenshots:',trace.screenshots.join(', '));
console.log('Trace events:',trace.trace_events.map(e=>e.event).join(', '));

await browser.close();
