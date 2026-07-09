// CanyonWorld.js — moonlit slot canyon with walls, ground, and atmosphere
import * as THREE from 'three';

export function createCanyonWorld({
  length = 500,
  width = 30,
  wallHeight = 40,
  segments = 80,
  roughness = 3,
  color = 0x0a0e18,
  emissive = 0x112233
}) {
  const group = new THREE.Group();
  const halfW = width / 2;
  const segLen = length / segments;

   // Ground plane
  const groundGeo = new THREE.PlaneGeometry(length * 2, width);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x050810, roughness: 0.95, metalness: 0.1
   });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(length / 2, -1, 0);
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
      emissive, emissiveIntensity: 0.08,
      side: THREE.DoubleSide
     });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(length / 2, wallHeight / 2 - 1, side * halfW);
    wall.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    group.add(wall);
   }

   // Overhead rock ceiling (partial — gives tunnel/canyon feel)
  const ceilGeo = new THREE.PlaneGeometry(length, width * 0.8, segments, 6);
  const cPos = ceilGeo.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    const x = cPos.getX(i);
    cPos.setZ(i, cPos.getZ(i) + Math.sin(x * 0.04) * 2);
   }
  cPos.needsUpdate = true;
  ceilGeo.computeVertexNormals();
  const ceilMat = new THREE.MeshStandardMaterial({
    color: 0x080c14, roughness: 0.95, metalness: 0.15,
    side: THREE.DoubleSide
   });
  const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(length / 2, wallHeight * 0.7, 0);
  group.add(ceiling);

   // Fog for depth
  const fog = new THREE.FogExp2(0x050810, 0.008);

   // Moon light (cool key from above-left)
  const moonLight = new THREE.DirectionalLight(0xccddff, 0.7);
  moonLight.position.set(10, 30, -10);
  group.add(moonLight);

   // Rim light (warm from behind)
  const rimLight = new THREE.DirectionalLight(0xffccaa, 0.15);
  rimLight.position.set(-5, 10, 20);
  group.add(rimLight);

   // Ambient
  const ambient = new THREE.AmbientLight(0x111828, 0.3);
  group.add(ambient);

   // Hemisphere light for sky/ground bounce
  const hemi = new THREE.HemisphereLight(0x1a2a44, 0x050810, 0.2);
  group.add(hemi);

  return { group, fog, wallHeight };
}
