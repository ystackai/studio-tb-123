// Rotorcraft.js — low-poly stealth rotorcraft visual
import * as THREE from 'three';

export function createRotorcraftVisual({
  scale = 1,
  bodyColor = 0x263a52,
  accentColor = 0x4c7396,
  rotorColor = 0x86a9c1,
  glowColor = 0x4ecbff,
  emissiveIntensity = 0.95
}) {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor, roughness: 0.45, metalness: 0.7,
    emissive: accentColor, emissiveIntensity: 0.15
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor, roughness: 0.35, metalness: 0.6,
    emissive: glowColor, emissiveIntensity: emissiveIntensity * 0.3
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: glowColor, emissive: glowColor, emissiveIntensity: emissiveIntensity,
    roughness: 0.1, metalness: 0
  });
  const rotorMat = new THREE.MeshStandardMaterial({
    color: rotorColor, roughness: 0.6, metalness: 0.3,
    emissive: glowColor, emissiveIntensity: 0.1, side: THREE.DoubleSide
  });

  // Fuselage — stealth faceted shape
  const fuselageGeo = new THREE.BoxGeometry(0.3, 0.35, 1.4, 1, 1, 3);
  // Deform to make it more helicopter-like: taper nose, widen middle
  const pos = fuselageGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // Taper nose (positive Z)
    if (z > 0.3) {
      const t = (z - 0.3) / 0.4;
      x *= 1 - t * 0.4;
      y *= 1 - t * 0.3;
    }
    // Widen middle slightly
    if (z > -0.3 && z < 0.2) {
      x *= 1.15;
    }
    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;
  fuselageGeo.computeVertexNormals();
  const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
  group.add(fuselage);

  // Cockpit canopy
  const canopyGeo = new THREE.BoxGeometry(0.25, 0.15, 0.4);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x397ba2, emissive: 0x0b3d5c, emissiveIntensity: 0.45,
    roughness: 0.1, metalness: 0.8,
    transparent: true, opacity: 0.7
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 0.18, 0.35);
  group.add(canopy);

  // Nose light
  const noseLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, 0.06),
    new THREE.MeshStandardMaterial({ color: glowColor, emissive: glowColor, emissiveIntensity: 1.2 })
  );
  noseLight.position.set(0, -0.02, 0.7);
  group.add(noseLight);

  // Tail boom
  const tailGeo = new THREE.BoxGeometry(0.1, 0.12, 0.9, 1, 1, 2);
  const tPos = tailGeo.attributes.position;
  for (let i = 0; i < tPos.count; i++) {
    let z = tPos.getZ(i);
    if (z < -0.3) {
      tPos.setY(i, tPos.getY(i) + Math.abs(z + 0.3) * 0.3);
    }
  }
  tPos.needsUpdate = true;
  tailGeo.computeVertexNormals();
  const tail = new THREE.Mesh(tailGeo, bodyMat);
  tail.position.set(0, 0, -1.1);
  group.add(tail);

  // Tail rotor (vertical)
  const tailRotorGroup = new THREE.Group();
  const bladeGeo = new THREE.BoxGeometry(0.6, 0.03, 0.03);
  const blade1 = new THREE.Mesh(bladeGeo, rotorMat);
  const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.6, 0.03), rotorMat);
  tailRotorGroup.add(blade1, blade2);
  tailRotorGroup.position.set(0.2, 0.15, -1.5);
  tailRotorGroup.rotation.z = Math.PI / 2;
  group.add(tailRotorGroup);
  group.userData.tailRotor = tailRotorGroup;

  // Main rotor mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6), bodyMat);
  mast.position.set(0, 0.25, 0);
  group.add(mast);

  // Main rotor
  const mainRotorGroup = new THREE.Group();
  const mainBlade1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.04, 0.12), rotorMat);
  const mainBlade2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 3.2), rotorMat);
  mainRotorGroup.add(mainBlade1, mainBlade2);
  mainRotorGroup.position.set(0, 0.38, 0);
  group.add(mainRotorGroup);
  group.userData.mainRotor = mainRotorGroup;

  // Skids
  const skidMat = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.7, metalness: 0.5 });
  for (const side of [-1, 1]) {
    const skidArm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.8), skidMat);
    skidArm.position.set(side * 0.25, -0.22, 0);
    group.add(skidArm);
    const skidRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 1.1), skidMat);
    skidRail.position.set(side * 0.32, -0.27, 0);
    group.add(skidRail);
  }

  // Engine glow vents
  for (const side of [-1, 1]) {
    const vent = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.15),
      glowMat.clone()
    );
    vent.position.set(side * 0.18, 0.0, -0.5);
    group.add(vent);
  }

  // Navigation lights
  const navLightL = new THREE.PointLight(0x44ff88, 0.5, 4);
  navLightL.position.set(-0.35, -0.27, 0);
  group.add(navLightL);
  const navLightR = new THREE.PointLight(0xff4444, 0.5, 4);
  navLightR.position.set(0.35, -0.27, 0);
  group.add(navLightR);

  group.scale.setScalar(scale);
  return { mesh: group, mainRotor: group.userData.mainRotor, tailRotor: group.userData.tailRotor };
}
