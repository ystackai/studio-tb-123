// Bunny One — a bunny astronaut orbit-hops to the carrot moon.
// Intent: small and brave in a big gentle sky — a held breath during the
// burn, weightless relief in the drift, a soft giggle when you land.
// One input: hold to burn, release to drift. No fail states — only physics.

import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { BUNNY_GLB_BASE64 } from './vendor/bunny_data.js';
import { SFX_BASE64 } from './vendor/sfx_data.js';

// file://-proof asset delivery: fetch() is blocked under the critic's
// file wrapper, so binary assets ship as embedded modules.
function base64ToArrayBuffer(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

const canvas = document.getElementById('game');
const titleEl = document.getElementById('title');
const subtitleEl = document.getElementById('subtitle');
const carrotsEl = document.getElementById('carrots');

// ── Renderer & camera ────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e1a);
scene.fog = new THREE.Fog(0x0b0e1a, 60, 140);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
const CAM_HOME = new THREE.Vector3(0, 4, 46);
camera.position.copy(CAM_HOME);

let camDist = CAM_HOME.z;
const INSPECT = new URLSearchParams(location.search).has('inspect');
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // one-screen guarantee: pull back on narrow aspects so the whole
  // planetary ladder (and the bunny) always fits
  camDist = CAM_HOME.z * Math.max(1, 1.55 / Math.max(0.55, camera.aspect));
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ── Lights: warm key, cool fill, gentle rim ──────────────────────────────
scene.add(new THREE.HemisphereLight(0xfff3e0, 0x2a2f4a, 0.75));
const key = new THREE.DirectionalLight(0xffe9c4, 1.35);
key.position.set(18, 22, 30);
scene.add(key);
const rim = new THREE.DirectionalLight(0x8fb7ff, 0.5);
rim.position.set(-24, -6, -18);
scene.add(rim);

// ── Starfield: two parallax layers, twinkling ────────────────────────────
function makeStars(count, spread, size, tint) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.7;
    pos[i * 3 + 2] = -20 - Math.random() * 90;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: tint, size, sizeAttenuation: true, transparent: true, opacity: 0.9 });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return mat;
}
const starsFar = makeStars(700, 160, 0.28, 0xcdd6ff);
const starsNear = makeStars(180, 120, 0.5, 0xfff3d6);

// ── Planets: a loose diagonal ladder, toy palette ────────────────────────
const PLANETS = [
  { x: -14, y: -7, r: 4.2, color: 0x9f86c0, emissive: 0x2a1f45 },  // lavender home
  { x: -1,  y:  2, r: 2.6, color: 0x84a98c, emissive: 0x1d3524 },  // sage
  { x: 10,  y: -4, r: 3.2, color: 0xd4a373, emissive: 0x3d2a14, ringed: true }, // ochre, ringed
  { x: 19,  y:  7, r: 2.4, color: 0xe8985e, emissive: 0x4a2410, goal: true },   // the carrot moon
];
const planetMeshes = [];
for (const p of PLANETS) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.r, 48, 32),
    new THREE.MeshStandardMaterial({ color: p.color, emissive: p.emissive, roughness: 0.85, metalness: 0.05 })
  );
  mesh.position.set(p.x, p.y, 0);
  scene.add(mesh);
  planetMeshes.push(mesh);
  p.mesh = mesh;
  if (p.ringed) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(p.r * 1.7, 0.16, 10, 64),
      new THREE.MeshStandardMaterial({ color: 0xc9b79c, roughness: 0.7 })
    );
    ring.rotation.x = Math.PI / 2.6;
    ring.rotation.y = 0.35;
    ring.position.copy(mesh.position);
    scene.add(ring);
  }
  if (p.goal) {
    // The carrot: planted proudly on top of the moon.
    const carrot = new THREE.Group();
    const root = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 1.5, 10),
      new THREE.MeshStandardMaterial({ color: 0xff7f2a, roughness: 0.6 })
    );
    root.rotation.x = Math.PI; // point down into the moon
    root.position.y = 0.45;
    carrot.add(root);
    for (let i = 0; i < 3; i++) {
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.8, 6),
        new THREE.MeshStandardMaterial({ color: 0x74c69d, roughness: 0.6 })
      );
      leaf.position.y = 1.3;
      leaf.rotation.z = (i - 1) * 0.5;
      carrot.add(leaf);
    }
    carrot.position.set(p.x - 1.1, p.y + p.r + 0.1, 0.6);
    carrot.rotation.z = 0.25;
    scene.add(carrot);
    p.carrot = carrot;
  }
}

// Dawn over the carrot moon: a warm glow that leads the eye to the goal.
{
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 160, 80, 0.30)');
  grad.addColorStop(0.4, 'rgba(255, 130, 70, 0.10)');
  grad.addColorStop(1, 'rgba(255, 140, 80, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  glow.scale.set(21, 21, 1);
  glow.position.set(23, 10, -12);
  scene.add(glow);
}

// ── Star pickups along the route ─────────────────────────────────────────
const pickups = [];
const PICKUP_SPOTS = [ [-8, -1], [-4, 5.5], [4, 0.5], [7.5, 4.5], [14.5, 1] ];
for (const [x, y] of PICKUP_SPOTS) {
  const star = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42),
    new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0x8a6d1a, roughness: 0.3 })
  );
  star.position.set(x, y, 0);
  scene.add(star);
  pickups.push({ mesh: star, taken: false, phase: Math.random() * Math.PI * 2 });
}

// ── The ship: little rocket + glass dome, bunny seated inside ────────────
const ship = new THREE.Group();
const SHIP_SCALE = 1.55;
const hull = new THREE.Mesh(
  new THREE.CylinderGeometry(0.55, 0.7, 1.6, 20),
  new THREE.MeshStandardMaterial({ color: 0xf2e9e4, roughness: 0.4, metalness: 0.15 })
);
ship.add(hull);
const antenna = new THREE.Group();
const mast = new THREE.Mesh(
  new THREE.CylinderGeometry(0.035, 0.035, 0.6, 8),
  new THREE.MeshStandardMaterial({ color: 0xe07a5f, roughness: 0.5 })
);
const beacon = new THREE.Mesh(
  new THREE.SphereGeometry(0.09, 12, 8),
  new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0x8a5a00, roughness: 0.3 })
);
beacon.position.y = 0.33;
antenna.add(mast, beacon);
antenna.position.set(0.55, 1.15, 0);
antenna.rotation.z = -0.25;
ship.add(antenna);
for (let i = 0; i < 3; i++) {
  const fin = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.55, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xe07a5f, roughness: 0.5 })
  );
  const a = (i / 3) * Math.PI * 2;
  fin.position.set(Math.cos(a) * 0.62, -0.72, Math.sin(a) * 0.62);
  fin.lookAt(0, -0.72, 0);
  ship.add(fin);
}
const dome = new THREE.Mesh(
  new THREE.SphereGeometry(0.78, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.9),
  new THREE.MeshPhongMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.22, shininess: 90 })
);
dome.position.y = 0.95;
ship.add(dome);
const collar = new THREE.Mesh(
  new THREE.TorusGeometry(0.62, 0.07, 10, 28),
  new THREE.MeshStandardMaterial({ color: 0xe07a5f, roughness: 0.45 })
);
collar.rotation.x = Math.PI / 2;
collar.position.y = 0.82;
ship.add(collar);
const thrustLight = new THREE.PointLight(0xffa552, 0, 7);
thrustLight.position.y = -1.2;
ship.add(thrustLight);
scene.add(ship);

// Bunny rides in the dome (normalized on load; box placeholder until then).
const bunnySeat = new THREE.Group();
bunnySeat.position.y = 0.78;
ship.add(bunnySeat);
new GLTFLoader().parse(base64ToArrayBuffer(BUNNY_GLB_BASE64), '', (gltf) => {
  const bunny = gltf.scene;
  const box = new THREE.Box3().setFromObject(bunny);
  const size = box.getSize(new THREE.Vector3());
  const scale = 1.25 / Math.max(size.x, size.y, size.z);
  bunny.scale.setScalar(scale);
  box.setFromObject(bunny);
  const center = box.getCenter(new THREE.Vector3());
  bunny.position.sub(center).add(new THREE.Vector3(0, 0.42, 0));
  bunny.rotation.y = -Math.PI * 0.28; // three-quarter charm angle, toward camera
  bunnySeat.add(bunny);
});

// ── Exhaust particles (pooled) ───────────────────────────────────────────
const PUFF_N = 120;
const puffGeo = new THREE.BufferGeometry();
puffGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PUFF_N * 3), 3));
const puffMat = new THREE.PointsMaterial({ color: 0xffb37a, size: 0.34, transparent: true, opacity: 0.85 });
const puffPoints = new THREE.Points(puffGeo, puffMat);
scene.add(puffPoints);
const puffs = Array.from({ length: PUFF_N }, () => ({ life: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3() }));
let puffCursor = 0;
function spawnPuff(origin, dir, spread, speed, life) {
  const p = puffs[puffCursor = (puffCursor + 1) % PUFF_N];
  p.life = life;
  p.pos.copy(origin);
  p.vel.copy(dir).multiplyScalar(speed)
    .add(new THREE.Vector3((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread));
}

// Drift trail: faint breadcrumbs make the arc readable.
const TRAIL_N = 48;
const trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL_N * 3).fill(-999), 3));
const trailPts = new THREE.Points(trailGeo, new THREE.PointsMaterial({ color: 0x9fb8d8, size: 0.16, transparent: true, opacity: 0.5 }));
scene.add(trailPts);
let trailCursor = 0, trailTimer = 0;

// ── Audio: foundry pack, unlocked on first gesture ───────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audio = { ctx: null, buffers: {}, music: null, musicGain: null, thrustSrc: null, ready: false };
const SFX_KEYS = { thrust: 'movement', tap: 'interaction', danger: 'danger', land: 'impact', star: 'reveal', carrot: 'payoff' };
async function unlockAudio() {
  if (audio.ctx) return;
  audio.ctx = new AudioCtx();
  await audio.ctx.resume();
  const entries = await Promise.all(Object.entries(SFX_KEYS).map(async ([k, name]) => {
    const buf = await audio.ctx.decodeAudioData(base64ToArrayBuffer(SFX_BASE64[name]));
    return [k, buf];
  }));
  for (const [k, b] of entries) audio.buffers[k] = b;
  // music rides a native <audio> element (file://-safe), gained via WebAudio
  const el = new Audio('audio/music_loop.wav');
  el.loop = true;
  audio.musicGain = audio.ctx.createGain();
  audio.musicGain.gain.value = 0.16;
  audio.musicGain.connect(audio.ctx.destination);
  try {
    const node = audio.ctx.createMediaElementSource(el);
    node.connect(audio.musicGain);
  } catch (e) { el.volume = 0.16; }
  el.play().catch(() => {});
  audio.music = el;
  audio.ready = true;
}
function playSfx(name, gain = 0.5, rate = 1) {
  if (!audio.ready) return;
  const src = audio.ctx.createBufferSource();
  src.buffer = audio.buffers[name];
  src.playbackRate.value = rate;
  const g = audio.ctx.createGain();
  g.gain.value = gain;
  src.connect(g);
  g.connect(audio.ctx.destination);
  src.start();
}
function startThrustSound() {
  if (!audio.ready || audio.thrustSrc) return;
  const src = audio.ctx.createBufferSource();
  src.buffer = audio.buffers.thrust;
  src.loop = true;
  const g = audio.ctx.createGain();
  g.gain.value = 0.4;
  src.connect(g);
  g.connect(audio.ctx.destination);
  src.start();
  audio.thrustSrc = { src, g };
}
function stopThrustSound() {
  if (!audio.thrustSrc) return;
  const { src, g } = audio.thrustSrc;
  g.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.05);
  setTimeout(() => src.stop(), 200);
  audio.thrustSrc = null;
}

// ── Game state ───────────────────────────────────────────────────────────
const S = {
  mode: 'title',            // title | fly | won
  pos: new THREE.Vector3(PLANETS[0].x, PLANETS[0].y + PLANETS[0].r + 1.7, 0),
  vel: new THREE.Vector3(),
  holding: false,
  landedOn: 0,              // planet index or -1 in flight
  facing: new THREE.Vector3(0, 1, 0),
  stars: 0,
  squash: 0,                // landing squash animation 0..1
  wonAt: 0,
  shake: 0,
  dangerCooldown: 0,
};

function nearestPlanet() {
  let best = null, bestD = Infinity;
  for (const p of PLANETS) {
    const d = S.pos.distanceTo(p.mesh.position) - p.r;
    if (d < bestD) { bestD = d; best = p; }
  }
  return { p: best, surfaceDist: bestD };
}

function land(p) {
  S.landedOn = PLANETS.indexOf(p);
  S.vel.set(0, 0, 0);
  const out = S.pos.clone().sub(p.mesh.position).normalize();
  S.pos.copy(p.mesh.position).addScaledVector(out, p.r + 1.6);
  S.facing.copy(out);
  S.squash = 1;
  S.shake = Math.min(0.35, S.shake + 0.25);
  playSfx('land', 0.55);
  for (let i = 0; i < 14; i++) spawnPuff(S.pos.clone().addScaledVector(out, -0.9), out, 2.2, 1.2, 0.5);
  if (p.goal && S.mode === 'fly') win();
}

function win() {
  S.mode = 'won';
  S.wonAt = performance.now();
  playSfx('carrot', 0.8);
  if (audio.musicGain) audio.musicGain.gain.setTargetAtTime(0.3, audio.ctx.currentTime, 1.5);
  titleEl.textContent = 'THE CARROT MOON';
  subtitleEl.textContent = `${S.stars} of ${pickups.length} stars gathered · press to fly again`;
  titleEl.classList.remove('faded');
  subtitleEl.classList.remove('faded');
  for (let i = 0; i < 40; i++) {
    const dir = new THREE.Vector3((Math.random() - 0.5), Math.random(), (Math.random() - 0.5)).normalize();
    spawnPuff(S.pos.clone(), dir, 1.5, 2.5, 1.4);
  }
}

function reset() {
  S.mode = 'fly';
  S.stars = 0;
  for (const pk of pickups) { pk.taken = false; pk.mesh.visible = true; }
  const home = PLANETS[0];
  S.pos.set(home.x, home.y + home.r + 1.7, 0);
  S.vel.set(0, 0, 0);
  S.landedOn = 0;
  S.facing.set(0, 1, 0);
  titleEl.textContent = 'BUNNY ONE';
  subtitleEl.textContent = 'hold to burn · release to drift · reach the carrot moon';
  if (audio.musicGain) audio.musicGain.gain.setTargetAtTime(0.16, audio.ctx.currentTime, 0.5);
  updateCarrots();
}

function updateCarrots() {
  carrotsEl.style.opacity = 1;
  carrotsEl.textContent = '★ ' + S.stars + ' / ' + pickups.length;
}

// ── Input: one verb ──────────────────────────────────────────────────────
function press() {
  unlockAudio();
  if (S.mode === 'title') {
    S.mode = 'fly';
    titleEl.classList.add('faded');
    subtitleEl.classList.add('faded');
    updateCarrots();
  } else if (S.mode === 'won') {
    if (performance.now() - S.wonAt > 900) { reset(); return; }
    return;
  }
  S.holding = true;
  playSfx('tap', 0.25, 1.2);
  startThrustSound();
}
function release() {
  S.holding = false;
  stopThrustSound();
}
window.addEventListener('pointerdown', press);
window.addEventListener('pointerup', release);
window.addEventListener('pointercancel', release);
window.addEventListener('keydown', (e) => { if (e.code === 'Space' && !e.repeat) press(); });
window.addEventListener('keyup', (e) => { if (e.code === 'Space') release(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });

// ── Simulation ───────────────────────────────────────────────────────────
const G = 21;
const THRUST = 16;
const LAND_SPEED = 7.5;
const DRAG = 0.9965;          // gentle sky: space slowly forgives
const CAPTURE_DRAG = 0.988;   // planets reach out and steady you
const tmp = new THREE.Vector3();

function step(dt) {
  if (S.mode === 'title') return;
  if (S.mode === 'won') {
    S.squash = Math.max(0, S.squash - dt * 2);
    return;
  }

  const { p: near, surfaceDist } = nearestPlanet();

  if (S.landedOn >= 0) {
    const planet = PLANETS[S.landedOn];
    // ride the planet's slow rotation: your launch direction sweeps like a
    // clock hand — timing IS aiming, and nothing ever sits still
    const cur = S.pos.clone().sub(planet.mesh.position);
    const ang = Math.atan2(cur.y, cur.x) + 0.42 * dt;
    const rad = cur.length();
    S.pos.set(planet.mesh.position.x + Math.cos(ang) * rad,
              planet.mesh.position.y + Math.sin(ang) * rad, 0);
    const out = S.pos.clone().sub(planet.mesh.position).normalize();
    S.facing.lerp(out, 0.35).normalize();
    if (S.holding) {
      // takeoff: a committed shove, then continuous burn takes over
      S.vel.copy(out).multiplyScalar(9);
      S.landedOn = -1;
      S.shake = Math.min(0.3, S.shake + 0.12);
    }
  } else {
    // gravity from every planet, inverse-square with clamped near-field
    for (const p of PLANETS) {
      tmp.copy(p.mesh.position).sub(S.pos);
      const d2 = Math.max(tmp.lengthSq(), 4);
      const g = (G * p.r) / d2;
      S.vel.addScaledVector(tmp.normalize(), g * dt);
    }
    if (S.holding) {
      S.vel.addScaledVector(S.facing, THRUST * dt);
      if (S.vel.length() > 19) S.vel.setLength(19);
      const back = S.facing.clone().negate();
      spawnPuff(S.pos.clone().addScaledVector(back, 1.1), back, 1.4, 3.5, 0.45);
      spawnPuff(S.pos.clone().addScaledVector(back, 1.1), back, 1.4, 2.5, 0.35);
    }
    // face velocity when moving; drift keeps last facing
    if (S.vel.lengthSq() > 0.5) S.facing.lerp(tmp.copy(S.vel).normalize(), 0.12).normalize();

    S.vel.multiplyScalar(surfaceDist < near.r * 1.15 ? CAPTURE_DRAG : DRAG);
    S.pos.addScaledVector(S.vel, dt);

    // soft world boundary: an invisible hand guides you home
    const bx = 26, by = 14;
    let outOfBounds = false;
    if (Math.abs(S.pos.x - 2) > bx) { S.vel.x -= (S.pos.x - 2) * 0.02; outOfBounds = true; }
    if (Math.abs(S.pos.y) > by) { S.vel.y -= S.pos.y * 0.03; outOfBounds = true; }
    if (outOfBounds && S.dangerCooldown <= 0) { playSfx('danger', 0.3); S.dangerCooldown = 1.6; }

    // landing / bounce
    if (surfaceDist < 1.05) {
      const speed = S.vel.length();
      if (speed <= LAND_SPEED) {
        land(near);
      } else {
        // gentle physics comedy: bounce off, keep flying
        const n = S.pos.clone().sub(near.mesh.position).normalize();
        const vn = n.multiplyScalar(S.vel.dot(n) * -1.55);
        S.vel.add(vn).multiplyScalar(0.72);
        S.pos.copy(near.mesh.position).addScaledVector(S.pos.clone().sub(near.mesh.position).normalize(), near.r + 1.1);
        S.shake = Math.min(0.4, S.shake + 0.2);
        playSfx('danger', 0.35, 0.9);
        for (let i = 0; i < 10; i++) spawnPuff(S.pos.clone(), S.pos.clone().sub(near.mesh.position).normalize(), 2.5, 1.5, 0.4);
      }
    }

    // drift breadcrumbs
    trailTimer -= dt;
    if (trailTimer <= 0) {
      trailTimer = 0.12;
      const tp = trailGeo.attributes.position.array;
      tp[trailCursor * 3] = S.pos.x;
      tp[trailCursor * 3 + 1] = S.pos.y;
      tp[trailCursor * 3 + 2] = 0;
      trailCursor = (trailCursor + 1) % TRAIL_N;
      trailGeo.attributes.position.needsUpdate = true;
    }

    // pickups
    for (const pk of pickups) {
      if (!pk.taken && S.pos.distanceTo(pk.mesh.position) < 1.15) {
        pk.taken = true;
        pk.mesh.visible = false;
        S.stars++;
        playSfx('star', 0.5, 1 + S.stars * 0.06);
        updateCarrots();
        for (let i = 0; i < 12; i++) {
          const dir = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5)).normalize();
          spawnPuff(pk.mesh.position.clone(), dir, 0.5, 2, 0.6);
        }
      }
    }
  }

  S.squash = Math.max(0, S.squash - dt * 2.4);
  S.dangerCooldown -= dt;
}

// ── Render loop (fixed timestep, interpolation-light) ────────────────────
let last = performance.now();
let acc = 0;
const DT = 1 / 120;

function frame(now) {
  window.__bunny = S;
  window.__bunnyAudio = audio;
  // Headless sim hook: advance the simulation synchronously, independent
  // of rAF/tab state. actions = [[holdSeconds, driftSeconds], ...].
  // Lets critics and bench probes measure feel without real time.
  window.__bunnySim = (actions) => {
    const trace = [];
    for (const [holdS, driftS] of actions) {
      S.holding = true;
      for (let i = 0; i < Math.round(holdS / DT); i++) step(DT);
      S.holding = false;
      for (let i = 0; i < Math.round(driftS / DT); i++) step(DT);
      trace.push({ x: +S.pos.x.toFixed(1), y: +S.pos.y.toFixed(1), v: +S.vel.length().toFixed(1), landed: S.landedOn, stars: S.stars, mode: S.mode });
      if (S.mode === 'won') break;
    }
    return trace;
  };
requestAnimationFrame(frame);
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  while (acc >= DT) { step(DT); acc -= DT; }
  const t = now / 1000;

  // ship transform: position, orientation from facing, squash & wobble
  ship.position.copy(S.pos);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), S.facing);
  ship.quaternion.slerp(q, 0.25);
  const sq = 1 + S.squash * 0.28;
  ship.scale.set(SHIP_SCALE * sq, SHIP_SCALE / sq, SHIP_SCALE * sq);
  if (S.mode === 'won') ship.rotation.z += Math.sin(t * 2) * 0.001;

  thrustLight.intensity = S.holding && S.landedOn < 0 ? 2.2 + Math.sin(t * 40) * 0.8 : 0;

  // idle ear-wiggle charm on title screen
  if (S.mode === 'title') {
    ship.position.y = S.pos.y + Math.sin(t * 1.6) * 0.12;
    bunnySeat.rotation.z = Math.sin(t * 2.2) * 0.06;
  } else {
    bunnySeat.rotation.z = THREE.MathUtils.lerp(bunnySeat.rotation.z, -S.vel.x * 0.01, 0.1);
  }

  // pickups twinkle
  for (const pk of pickups) {
    if (pk.taken) continue;
    pk.mesh.rotation.y = t * 1.4 + pk.phase;
    const s = 1 + Math.sin(t * 3 + pk.phase) * 0.18;
    pk.mesh.scale.setScalar(s);
  }

  // carrot moon beckons
  const goal = PLANETS[3];
  goal.carrot.rotation.y = Math.sin(t * 0.8) * 0.15;
  if (S.mode === 'won') goal.carrot.rotation.y = t * 1.2;

  // planets breathe very slightly
  for (let i = 0; i < planetMeshes.length; i++) {
    planetMeshes[i].rotation.y = t * 0.05 * (i % 2 ? 1 : -1);
  }

  // starfield twinkle
  starsFar.opacity = 0.75 + Math.sin(t * 0.9) * 0.15;
  starsNear.opacity = 0.8 + Math.sin(t * 1.3 + 1) * 0.2;

  // particles
  const pp = puffGeo.attributes.position.array;
  for (let i = 0; i < PUFF_N; i++) {
    const p = puffs[i];
    if (p.life > 0) {
      p.life -= DT * 2;
      p.pos.addScaledVector(p.vel, DT * 2);
      pp[i * 3] = p.pos.x; pp[i * 3 + 1] = p.pos.y; pp[i * 3 + 2] = p.pos.z;
    } else {
      pp[i * 3 + 1] = -999;
    }
  }
  puffGeo.attributes.position.needsUpdate = true;

  // camera: framed system, gentle lean toward the bunny, decaying shake
  S.shake = Math.max(0, S.shake - 0.016);
  if (INSPECT) {
    camera.position.set(S.pos.x + 1.5, S.pos.y + 1.2, 7);
    camera.lookAt(S.pos.x, S.pos.y + 0.6, 0);
  } else {
    const lean = tmp.copy(S.pos).multiplyScalar(0.3);
    camera.position.x = CAM_HOME.x + lean.x * 0.4 + (Math.random() - 0.5) * S.shake;
    camera.position.y = CAM_HOME.y + lean.y * 0.3 + (Math.random() - 0.5) * S.shake;
    camera.position.z = camDist;
    camera.lookAt(lean.x, lean.y, 0);
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
