// CanyonWorld.js — moonlit slot canyon with walls, ground, and atmosphere
import * as THREE from 'three';

export function createCanyonWorld({
  length = 500,
  width = 30,
  wallHeight = 40,
  segments = 80,
  roughness = 3,
  color = 0x18243a,
  emissive = 0x153654
}) {
  const group = new THREE.Group();
  const halfW = width / 2;
   // Ground plane follows the flight path on +Z.
  const groundGeo = new THREE.PlaneGeometry(width, length, 8, segments);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x091426, emissive: 0x030915, emissiveIntensity: 0.35,
    roughness: 0.82, metalness: 0.25
   });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -1, length / 2);
  group.add(ground);

   // Canyon walls (left and right, deformed with noise)
  for (const side of [-1, 1]) {
    const wallGeo = new THREE.PlaneGeometry(length, wallHeight, segments, 8);
    const wPos = wallGeo.attributes.position;
    for (let i = 0; i < wPos.count; i++) {
      const x = wPos.getX(i);
      const y = wPos.getY(i);
      // Add irregularity to simulate canyon rock
      const noise = Math.sin(x * 0.05) * roughness +
        Math.sin(x * 0.12 + y * 0.3) * roughness * 0.5 +
        Math.cos(x * 0.02) * roughness * 0.8;
      // Narrow canyon near the path, wider at edges
      const depthOffset = side * (1 + Math.sin(x * 0.03) * 2);
      wPos.setZ(i, noise + depthOffset * 0.5);
     }
    wPos.needsUpdate = true;
    wallGeo.computeVertexNormals();

    const wallMat = new THREE.MeshStandardMaterial({
      color, roughness: 0.9, metalness: 0.2,
      emissive, emissiveIntensity: 0.22,
      side: THREE.DoubleSide
     });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(side * halfW, wallHeight / 2 - 1, length / 2);
    wall.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    group.add(wall);
   }

   // Overhead rock ceiling (partial — gives tunnel/canyon feel)
  const ceilGeo = new THREE.PlaneGeometry(width * 0.8, length, 6, segments);
  const cPos = ceilGeo.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    const y = cPos.getY(i);
    cPos.setZ(i, cPos.getZ(i) + Math.sin(y * 0.04) * 2);
   }
  cPos.needsUpdate = true;
  ceilGeo.computeVertexNormals();
  const ceilMat = new THREE.MeshStandardMaterial({
    color: 0x101a2c, emissive: 0x071426, emissiveIntensity: 0.18,
    roughness: 0.9, metalness: 0.2,
    side: THREE.DoubleSide
   });
  const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, wallHeight * 0.7, length / 2);
  group.add(ceiling);

   // Fog for depth
  const fog = new THREE.FogExp2(0x050810, 0.008);

   // Moon light (cool key from above-left)
  const moonLight = new THREE.DirectionalLight(0xdceaff, 1.8);
  moonLight.position.set(10, 30, -10);
  group.add(moonLight);

   // Rim light (warm from behind)
  const rimLight = new THREE.DirectionalLight(0xffd4b8, 0.55);
  rimLight.position.set(-5, 10, 20);
  group.add(rimLight);

   // Ambient
  const ambient = new THREE.AmbientLight(0x263b5c, 0.7);
  group.add(ambient);

   // Hemisphere light for sky/ground bounce
  const hemi = new THREE.HemisphereLight(0x41658c, 0x07101d, 0.75);
  group.add(hemi);

  return { group, fog, wallHeight };
}
