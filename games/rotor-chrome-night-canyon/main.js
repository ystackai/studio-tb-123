// main.js — Rotor Chrome Night Canyon
import * as THREE from 'three';
import { createRotorcraftVisual } from './Rotorcraft.js';
import { createCanyonWorld } from './CanyonWorld.js';
import { AudioManager } from './AudioManager.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ===== Config =====
const CANON_LENGTH = 500;
const CANON_WIDTH = 28;
const CANON_WALL = 38;
const GATE_COUNT = 5;
const PYLON_COUNT = 4;
const RC_SCALE = 2.2;
const BASE_SPEED = 26;
const BOOST_SPEED = 48;

// ===== State =====
let scene, camera, renderer, clock;
let rc, rcVis;
let gates = [], pylons = [];
let audio = new AudioManager();
let started = false, ended = false;
let score = 0, passedGates = 0, collectedStems = 0;
let keys = {};
let stemLights = [];
let foundryLoaded = { friendly: false, unknown: false };
let friendlyGLB = null, unknownGLB = null;
let authoredRotorcraftLoaded = false;
let finalHangar = null, finalBloom = null, debriefTimer = null;
let finaleActive = false, finaleTime = 0, finaleCamOrigin = null, finaleCamLook = null;

// ===== DOM =====
const $overlay = document.getElementById('overlay');
const $start = document.getElementById('startBtn');
const $restart = document.getElementById('restartBtn');
const $hudScore = document.getElementById('hudScore');
const $hudStems = document.getElementById('hudStems');
const $hudGates = document.getElementById('hudGates');
const $debrief = document.getElementById('debrief');
const $debTitle = document.getElementById('debTitle');
const $debScore = document.getElementById('debScore');
const $debStems = document.getElementById('debStems');
const $debGates = document.getElementById('debGates');

// ===== Init =====
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03050b);
  clock = new THREE.Clock();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.5, 900);
  camera.position.set(3, 7, -10);
  camera.lookAt(0, 5, 18);

   // Canyon
  const cw = createCanyonWorld({
    length: CANON_LENGTH, width: CANON_WIDTH, wallHeight: CANON_WALL
   });
  scene.add(cw.group);
  scene.fog = cw.fog;

   // Rotorcraft
  rcVis = createRotorcraftVisual({ scale: RC_SCALE });
  rc = {
    mesh: rcVis.mesh,
    pos: new THREE.Vector3(0, 5, 0),
    yaw: 0, pitch: 0, roll: 0,
    speed: BASE_SPEED, boosting: false,
    mainRotor: rcVis.mainRotor, tailRotor: rcVis.tailRotor
   };
  rc.mesh.position.copy(rc.pos);
  scene.add(rc.mesh);
  addCraftKey(rc.mesh);
  renderer.domElement.dataset.rotorcraftAsset = 'procedural-fallback';
  loadRotorcraftHero();

   // Gates & pylons
  spawnGates();
  spawnPylons();
  createFinalHangar();

   // Stem light layers (one per pylon)
  const colors = [0x44ffaa, 0xff66aa, 0x4488ff, 0xffaa44];
  for (let i = 0; i < 4; i++) {
    const l = new THREE.PointLight(colors[i], 0, 90);
    l.position.set(0, 14, 80 + i * 110);
    scene.add(l);
    stemLights.push(l);
  }
  hudUpdate();

   // Stem slot UI
  const stemSlots = document.getElementById('stemSlots');
  for (let i = 0; i < 4; i++) {
    const s = document.createElement('div');
    s.className = 'stem-slot';
    stemSlots.appendChild(s);
   }

   // Events
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    });
  addEventListener('keydown', e => { keys[e.code] = true; e.preventDefault(); });
  addEventListener('keyup', e => { keys[e.code] = false; });
  $start.addEventListener('click', startGame);
  $restart.addEventListener('click', restartGame);

   // Load foundry GLBs
  loadFoundryGLBs();

   // Loop
  animate();
}

// ===== Gates =====
function spawnGates() {
  const sp = CANON_LENGTH / (GATE_COUNT + 1);
  for (let i = 0; i < GATE_COUNT; i++) {
    const z = sp * (i + 1);
    const gate = makeGate(z, i);
    gates.push(gate);
    }
}

function makeGate(z, idx) {
  const g = new THREE.Group();
   // Outer ring (procedural, always visible)
  const ringM = new THREE.MeshStandardMaterial({
    color: 0x3388cc, emissive: 0x3388cc, emissiveIntensity: 0.9,
    transparent: true, opacity: 0.85, roughness: 0.2, metalness: 0.5
    });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.4, 10, 32), ringM);
  ring.position.y = 7;
  g.add(ring);

   // Inner ring
  const iRing = new THREE.Mesh(
    new THREE.TorusGeometry(3.8, 0.18, 8, 24),
    new THREE.MeshStandardMaterial({
      color: 0x77bbff, emissive: 0x77bbff, emissiveIntensity: 0.6,
      transparent: true, opacity: 0.5, roughness: 0.1
      })
   );
  iRing.position.y = 7;
  g.add(iRing);

   // Pillars
  const pMat = new THREE.MeshStandardMaterial({
    color: 0x1a2233, emissive: 0x112244, emissiveIntensity: 0.3,
    roughness: 0.8, metalness: 0.4
    });
  for (const side of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 15, 8), pMat);
    p.position.set(side * 6.5, 7.5, 0);
    g.add(p);
    const b = new THREE.PointLight(0x44aaff, 2, 18);
    b.position.set(side * 6.5, 15.5, 0);
    g.add(b);
    }

   // Foundry GLB placeholder — will be replaced once loaded
  g.userData.foundryHolder = new THREE.Group();
  g.userData.foundryHolder.position.set(0, 7, 0);
  g.add(g.userData.foundryHolder);

   // Gate beacon light
  const beacon = new THREE.PointLight(0x44ccff, 3, 30);
  beacon.position.set(0, 2, 0);
  g.add(beacon);

  g.position.set(0, 0, z);
  scene.add(g);

  return { group: g, ring, iRing, beacon, z, passed: false, phase: idx * 0.6 };
}

// ===== Pylons =====
function spawnPylons() {
  const sp = CANON_LENGTH / (PYLON_COUNT + 1);
  for (let i = 0; i < PYLON_COUNT; i++) {
    const z = sp * (i + 1) + 20;
    const x = (Math.sin(i * 1.7) * 5);
    const py = makePylon(x, z, i);
    pylons.push(py);
    }
}

function makePylon(x, z, idx) {
  const g = new THREE.Group();
   // Pole
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.2, 7, 6),
    new THREE.MeshStandardMaterial({
      color: 0x5533aa, emissive: 0x3322aa, emissiveIntensity: 0.5,
      roughness: 0.3, metalness: 0.6
      })
   );
  g.add(pole);

   // Antenna sphere
  const antMat = new THREE.MeshStandardMaterial({
    color: 0xaa66ff, emissive: 0xaa66ff, emissiveIntensity: 1.5,
    roughness: 0.1, metalness: 0
    });
  const ant = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), antMat);
  ant.position.y = 3.8;
  g.add(ant);

   // Dish rings
  for (let r = 0; r < 3; r++) {
    const d = new THREE.Mesh(
      new THREE.TorusGeometry(0.7 + r * 0.25, 0.05, 6, 16),
      new THREE.MeshStandardMaterial({
        color: 0x8866cc, emissive: 0x6644aa, emissiveIntensity: 0.4,
        roughness: 0.3, metalness: 0.5
        })
      );
    d.position.y = 1.8 + r * 1.4;
    d.rotation.x = Math.PI / 2;
    g.add(d);
    }

   // Foundry GLB placeholder
  g.userData.foundryHolder = new THREE.Group();
  g.userData.foundryHolder.position.set(0, 2.5, 0);
  g.add(g.userData.foundryHolder);

   // Beacon
  const beacon = new THREE.PointLight(0xaa66ff, 3, 25);
  beacon.position.y = 4.5;
  g.add(beacon);

  g.position.set(x, 0, z);
  scene.add(g);

  return { group: g, ant, beacon, z, x, collected: false, idx, phase: idx * 0.7 };
}

// ===== Mirrored hangar finale =====
function createFinalHangar() {
  finalHangar = new THREE.Group();
  finalHangar.position.z = CANON_LENGTH - 20;

  const chrome = new THREE.MeshStandardMaterial({
    color: 0xb9d8ee, emissive: 0x244a66, emissiveIntensity: 0.35,
    roughness: 0.12, metalness: 0.95
  });
  const mirror = new THREE.MeshStandardMaterial({
    color: 0x172536, emissive: 0x07111f, emissiveIntensity: 0.3,
    roughness: 0.08, metalness: 1
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(CANON_WIDTH * 1.25, 52), mirror);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.8, 22);
  finalHangar.add(floor);

  for (const z of [4, 13, 22, 31, 40]) {
    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 18, 0.55), chrome);
      pillar.position.set(side * 13.5, 8, z);
      finalHangar.add(pillar);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(27.5, 0.55, 0.55), chrome);
    beam.position.set(0, 17, z);
    finalHangar.add(beam);
  }

  finalBloom = new THREE.Group();
  finalBloom.position.set(0, 8, 34);
  const bloomColors = [0x74d8ff, 0xff72c6, 0xffd36b];
  bloomColors.forEach((color, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.8 + index * 2.1, 0.16, 12, 64),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.4, roughness: 0.18 })
    );
    ring.position.z = index * 0.5;
    finalBloom.add(ring);
  });
  const light = new THREE.PointLight(0xc8e9ff, 0, 65);
  finalBloom.add(light);
  finalBloom.userData.light = light;
  finalBloom.visible = false;
  finalHangar.add(finalBloom);
  scene.add(finalHangar);
}

function triggerFinale() {
  finaleActive = true;
  finaleTime = 0;
  finaleCamOrigin = camera.position.clone();
  finaleCamLook = camera.userData.lookTarget || new THREE.Vector3(rc.pos.x, rc.pos.y + 0.6, rc.pos.z + 25);
  finalBloom.visible = true;
  finalBloom.userData.light.intensity = 28;
  scene.fog.density = 0.001;
  renderer.toneMappingExposure = 2.2;

  // Play a synchronized musical chord — one note per collected stem layer
  if (audio.ctx && audio.musicGain) {
    const now = audio.ctx.currentTime;
    const chord = [261.63, 329.63, 392.00, 523.25]; // C4 E4 G4 C5
    chord.forEach((freq, i) => {
      if (i >= collectedStems) return;
      const osc = audio.ctx.createOscillator();
      const g = audio.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      g.gain.setValueAtTime(0, now + i * 0.12);
      g.gain.linearRampToValueAtTime(0.28, now + i * 0.12 + 0.06);
      g.gain.setValueAtTime(0.28, now + i * 0.12 + 1.2);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 3.2);
      osc.connect(g).connect(audio.musicGain);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 3.4);
    });
    // Sub bass layer
    const sub = audio.ctx.createOscillator();
    const subG = audio.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(55, now);
    subG.gain.setValueAtTime(0, now);
    subG.gain.linearRampToValueAtTime(0.35, now + 0.15);
    subG.gain.setValueAtTime(0.35, now + 1.5);
    subG.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
    sub.connect(subG).connect(audio.musicGain);
    sub.start(now);
    sub.stop(now + 3.7);
  }
}

// Animate the finale sequence — camera arc, bloom pulse, ring rotation
function updateFinale(dt) {
  if (!finaleActive) return;
  finaleTime += dt;

  // Bloom pulse — rings throb with the chord
  const pulse = 1.0 + 0.35 * Math.sin(finaleTime * 2.8);
  finalBloom.children.forEach((child, i) => {
    if (child.isMesh) {
      const s = (1.0 + 0.18 * Math.sin(finaleTime * 2.8 + i * 0.9)) * pulse;
      child.scale.set(s, s, s);
      // Rotate each ring at different rates
      child.rotation.z += dt * (0.25 + i * 0.12);
      child.rotation.x = Math.sin(finaleTime * 0.6 + i * 1.1) * 0.15;
      // Pulse emissive intensity
      if (child.material) {
        child.material.emissiveIntensity = 2.4 + 1.8 * Math.sin(finaleTime * 2.8 + i * 0.5);
      }
    }
  });

  // Bloom light pulse
  if (finalBloom.userData.light) {
    finalBloom.userData.light.intensity = 28 + 12 * Math.sin(finaleTime * 2.8);
  }

  // Camera arc around the bloom — cinematic shoulder angle
  const hangarWorldZ = finalHangar.position.z;
  const bloomWorld = new THREE.Vector3(0, 8, hangarWorldZ + 34);
  const arcT = Math.min(finaleTime / 4.0, 1.0);
  const angle = arcT * Math.PI * 0.6;
  const radius = 28 * (1.0 - arcT * 0.3);
  const camX = Math.sin(angle) * radius;
  const camY = 4 + 6 * (1.0 - arcT * 0.2);
  const camZ = bloomWorld.z - Math.cos(angle) * radius;
  camera.position.lerp(new THREE.Vector3(camX, camY, camZ), dt * 1.8);
  camera.lookAt(bloomWorld);

  // Rotorcraft idle in the hangar — gentle hover
  rc.pos.z += Math.sin(finaleTime * 0.8) * dt * 0.3;
  rc.pos.x += Math.sin(finaleTime * 0.5) * dt * 0.15;
  rc.mesh.position.copy(rc.pos);
  rc.mesh.rotation.set(0, finaleTime * 0.2, 0, 'YXZ');

  // Keep rotors spinning
  if (rc.mainRotor) rc.mainRotor.rotateY(dt * 28);
  if (rc.tailRotor) rc.tailRotor.rotateY(dt * 45);
}

function addCraftKey(mesh) {
  const craftKey = new THREE.PointLight(0xc6e8ff, 12, 30);
  craftKey.position.set(2.5, 4, -3);
  mesh.add(craftKey);
}

function loadRotorcraftHero() {
  const loader = new GLTFLoader();
  const assetPath = 'assets/generated/rotorcraft-hero-seed/rotorcraft_hero.glb';

  loader.load(
    assetPath,
    (gltf) => {
      const hero = gltf.scene;
      const mainRotor = hero.getObjectByName('MainRotor');
      const tailRotor = hero.getObjectByName('TailRotor');
      if (!mainRotor || !tailRotor) {
        console.warn('authored rotorcraft is missing required rotor nodes');
        return;
      }

      hero.scale.setScalar(1.1);
      hero.position.copy(rc.pos);
      hero.rotation.copy(rc.mesh.rotation);
      addCraftKey(hero);
      scene.add(hero);
      scene.remove(rc.mesh);

      rc.mesh = hero;
      rc.mainRotor = mainRotor;
      rc.tailRotor = tailRotor;
      authoredRotorcraftLoaded = true;
      renderer.domElement.dataset.rotorcraftAsset = 'rotorcraft_hero.glb';
      renderer.domElement.dataset.rotorcraftNodes = 'MainRotor,TailRotor';
    },
    undefined,
    (error) => console.warn('authored rotorcraft failed; keeping procedural fallback', error)
  );
}

// ===== Foundry GLB Loading =====
function loadFoundryGLBs() {
  const loader = new GLTFLoader();
  const base = 'assets/generated/';

   // sonar_friendly.glb → radar gates
  loader.load(
    base + 'sonar_friendly.glb',
     (gltf) => {
      friendlyGLB = gltf.scene;
      foundryLoaded.friendly = true;
      gates.forEach(g => {
        const m = gltf.scene.clone();
        m.scale.setScalar(5);
        g.group.userData.foundryHolder.add(m);
        m.position.set(0, 0, 0);
       });
     },
    undefined,
     (e) => console.warn('friendly GLB failed', e)
    );

   // sonar_unknown.glb → signal pylons
  loader.load(
    base + 'sonar_unknown.glb',
     (gltf) => {
      unknownGLB = gltf.scene;
      foundryLoaded.unknown = true;
      pylons.forEach(p => {
        const m = gltf.scene.clone();
        m.scale.setScalar(6);
        p.group.userData.foundryHolder.add(m);
        m.position.set(0, 0, 0);
       });
     },
    undefined,
     (e) => console.warn('unknown GLB failed', e)
    );
}

// ===== Game State =====
async function startGame() {
  $start.disabled = true;
  $start.textContent = 'TUNING SIGNAL...';
  await audio.init();
  started = true;
  $overlay.classList.add('hidden');
  await loadAudio();
  audio.startMusic();
  $start.textContent = 'LAUNCH';
  $start.disabled = false;
}

function restartGame() {
  if (debriefTimer) clearTimeout(debriefTimer);
  ended = false;
  $debrief.classList.remove('show');
  score = 0; passedGates = 0; collectedStems = 0;
  rc.pos.set(0, 5, 0);
  rc.yaw = 0; rc.pitch = 0; rc.roll = 0; rc.speed = BASE_SPEED;
  gates.forEach(g => { g.passed = false; g.ring.material.color.set(0x3388cc); g.ring.material.emissive.set(0x3388cc); });
  pylons.forEach(p => { p.collected = false; p.group.visible = true; });
  stemLights.forEach(l => l.intensity = 0);
  document.querySelectorAll('.stem-slot').forEach(s => s.classList.remove('active'));
  audio.resetStems();
  scene.fog.density = 0.008;
  renderer.toneMappingExposure = 1.5;
  finalBloom.visible = false;
  finalBloom.userData.light.intensity = 0;
  finaleActive = false;
  finaleTime = 0;
  hudUpdate();
  audio.startMusic();
}

async function loadAudio() {
  const b = 'assets/generated/';
  const ok = await audio.loadMusic(b + 'foundry_music_loop.wav');
  if (!ok) console.warn('using synth fallback for music');
  const map = {
    movement: b + 'sfx_movement.wav',
    gate: b + 'sfx_interaction.wav',
    pickup: b + 'sfx_reveal.wav',
    danger: b + 'sfx_danger.wav',
    impact: b + 'sfx_impact.wav',
    reveal: b + 'reveal_sting.wav'
   };
  for (const [n, p] of Object.entries(map)) await audio.loadSFX(n, p);
}

// ===== Input =====
function getIn() {
  const u = Number(Boolean(keys['ArrowUp'] || keys['KeyW']));
  const d = Number(Boolean(keys['ArrowDown'] || keys['KeyS']));
  const l = Number(Boolean(keys['ArrowLeft'] || keys['KeyA']));
  const r = Number(Boolean(keys['ArrowRight'] || keys['KeyD']));
  return { u, d, l, r, boost: Boolean(keys['Space']) };
}

// ===== HUD =====
function hudUpdate() {
  $hudScore.textContent = `SCORE ${score}`;
  $hudStems.textContent = `STEMS ${collectedStems}/${PYLON_COUNT}`;
  $hudGates.textContent = `GATES ${passedGates}/${GATE_COUNT}`;
  document.querySelectorAll('.stem-slot').forEach((s, i) => {
    s.classList.toggle('active', i < collectedStems);
   });
}

// ===== Game End =====
function endGame(won) {
  ended = true;
  audio.playSFX(won ? 'reveal' : 'danger');
  if (won) triggerFinale();
  $debTitle.textContent = won ? 'SIGNAL ACQUIRED' : 'SIGNAL INCOMPLETE';
  $debScore.textContent = `Score: ${score}`;
  $debStems.textContent = `Stems: ${collectedStems}/${PYLON_COUNT}`;
  $debGates.textContent = `Gates: ${passedGates}/${GATE_COUNT}`;
  debriefTimer = setTimeout(() => $debrief.classList.add('show'), won ? 1400 : 250);
}

// ===== Main Loop =====
function animate() {
  requestAnimationFrame(animate);
  if (!started) { renderer.render(scene, camera); return; }

  const dt = Math.min(clock.getDelta(), 0.05);

  if (ended) {
    if (finaleActive) {
      updateFinale(dt);
     }
    renderer.render(scene, camera);
    return;
   }
  const inp = getIn();

   // Speed
  const tgtSpeed = inp.boost ? BOOST_SPEED : BASE_SPEED;
  rc.speed += (tgtSpeed - rc.speed) * dt * 4;

   // Movement
  const previousZ = rc.pos.z;
  const dx = (inp.r - inp.l) * 16 * dt;
  const dy = (inp.u - inp.d) * 12 * dt;
  const dz = rc.speed * dt;
  rc.pos.x += dx;
  rc.pos.y += dy;
  rc.pos.z += dz;

   // Clamp
  rc.pos.x = Math.max(-CANON_WIDTH/2 + 2, Math.min(CANON_WIDTH/2 - 2, rc.pos.x));
  rc.pos.y = Math.max(1.5, Math.min(CANON_WALL - 3, rc.pos.y));

   // Banking
  const tgtRoll = -(inp.r - inp.l) * 0.35;
  const tgtPitch = (inp.d - inp.u) * 0.18;
  rc.roll += (tgtRoll - rc.roll) * dt * 6;
  rc.pitch += (tgtPitch - rc.pitch) * dt * 6;

   // Mesh transform
  rc.mesh.position.copy(rc.pos);
  rc.mesh.rotation.set(rc.pitch, 0, rc.roll, 'YXZ');

   // Rotor animation
  if (rc.mainRotor) {
    if (authoredRotorcraftLoaded) rc.mainRotor.rotateY(dt * 28);
    else rc.mainRotor.rotation.y += dt * 28;
  }
  if (rc.tailRotor) {
    if (authoredRotorcraftLoaded) rc.tailRotor.rotateY(dt * 45);
    else rc.tailRotor.rotation.x += dt * 45;
  }

   // Camera — chase cam with smooth follow
  const camBack = 7 + (inp.boost ? 2 : 0);
  const camUp = 2;
  const camTarget = new THREE.Vector3(rc.pos.x, rc.pos.y + camUp, rc.pos.z - camBack);
  camera.position.lerp(camTarget, dt * 3.5);
  const lookFwd = new THREE.Vector3(rc.pos.x, rc.pos.y + 0.6, rc.pos.z + 25);
  camera.lookAt(lookFwd);

   // Gate checks
  for (const gate of gates) {
    if (gate.passed) continue;
    const gateRadius = Math.hypot(rc.pos.x, rc.pos.y - 7);
    if (previousZ <= gate.z && rc.pos.z >= gate.z && gateRadius < 5.1) {
      gate.passed = true;
      score += 100;
      passedGates++;
      audio.playSFX('gate');
       // Visual: turn green
      gate.ring.material.color.set(0x44ff88);
      gate.ring.material.emissive.set(0x44ff88);
      gate.iRing.material.color.set(0x88ffbb);
      gate.iRing.material.emissive.set(0x88ffbb);
      hudUpdate();
      }
    // Spin inner ring
    gate.phase += dt * 1.5;
    gate.iRing.rotation.z = gate.phase;
   }

   // Pylon checks
  for (const py of pylons) {
    if (py.collected) continue;
    const crossesPylon = previousZ <= py.z && rc.pos.z >= py.z;
    const aligned = Math.abs(rc.pos.x - py.x) < 6 && Math.abs(rc.pos.y - 3) < 5;
    if (crossesPylon && aligned) {
      py.collected = true;
      py.group.visible = false;
      score += 250;
      collectedStems++;
      audio.playSFX('pickup');
      audio.addStem();
       // Activate canyon light
      if (stemLights[collectedStems - 1]) {
        stemLights[collectedStems - 1].intensity = 4;
        }
       // Brighten scene
      renderer.toneMappingExposure = 1.5 + collectedStems * 0.14;
       // Reduce fog
      scene.fog.density = Math.max(0.002, 0.008 - collectedStems * 0.0015);
      hudUpdate();
      }
     // Animate pylon
    py.phase += dt * 2;
    py.ant.position.y = 3.8 + Math.sin(py.phase) * 0.3;
    py.group.rotation.y += dt * 1.2;
   }

   // The chord bloom is earned only when the run actually assembled a signal.
  if (rc.pos.z >= CANON_LENGTH - 20) {
    endGame(passedGates >= 3 && collectedStems >= 2);
  }

   // Rotor SFX (periodic)
  if (Math.random() < dt * 0.3) audio.playSFX('movement', 0.1);

  renderer.render(scene, camera);
  window.__rotorChromeState = {
    position: { x: rc.pos.x, y: rc.pos.y, z: rc.pos.z },
    score, passedGates, collectedStems, audioStems: audio.activeStems, ended,
    foundryLoaded: { ...foundryLoaded }
  };
}

// ===== Go =====
init();
