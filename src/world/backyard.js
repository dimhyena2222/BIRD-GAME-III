/**
 * ═══════════════════════════════════════════════════════
 *  BIRD GAME 3 — World Builder ("The Giant's Backyard")
 *
 *  Constructs the 100:1 scale macro-world with:
 *    - The Porch (high ground with wind tunnels)
 *    - The Inflatable Pool (liquid hazard)
 *    - The Garden Hose
 *    - BBQ Grill (thermal source)
 *    - AC Unit (downdraft)
 *    - Ground plane, fences, shed, etc.
 * ═══════════════════════════════════════════════════════
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { WORLD_SCALE } from '../core/constants.js';
import { EnvironmentZones } from '../core/environment.js';

/**
 * Build the entire backyard world.
 * Returns { scene additions, physics bodies, environment zones }
 */
export function buildWorld(scene, physicsWorld) {
  const zones = new EnvironmentZones();

  // ─── Lighting ─────────────────────────────────────
  const ambientLight = new THREE.AmbientLight(0x445566, 0.6);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
  sunLight.position.set(50, 80, 30);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 200;
  sunLight.shadow.camera.left = -100;
  sunLight.shadow.camera.right = 100;
  sunLight.shadow.camera.top = 100;
  sunLight.shadow.camera.bottom = -100;
  scene.add(sunLight);

  // ─── Sky ──────────────────────────────────────────
  scene.background = new THREE.Color(0x1a0a2e); // dark purple-phonk sky
  scene.fog = new THREE.FogExp2(0x1a0a2e, 0.003);

  // ─── Ground Plane ─────────────────────────────────
  const groundGeo = new THREE.PlaneGeometry(300, 300);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x2d5a1e,
    roughness: 1,
    flatShading: true,
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
    quaternion: new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0),
  });
  physicsWorld.addStatic(groundBody);

  // ─── THE PORCH (High Ground) ──────────────────────
  const porchWidth = 60;
  const porchDepth = 20;
  const porchHeight = 8;

  const porchGeo = new THREE.BoxGeometry(porchWidth, porchHeight, porchDepth);
  const porchMat = new THREE.MeshStandardMaterial({
    color: 0x8b6b4a,
    roughness: 0.9,
    flatShading: true,
  });
  const porchMesh = new THREE.Mesh(porchGeo, porchMat);
  porchMesh.position.set(0, porchHeight / 2, -60);
  porchMesh.castShadow = true;
  porchMesh.receiveShadow = true;
  scene.add(porchMesh);

  const porchBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(porchWidth / 2, porchHeight / 2, porchDepth / 2)),
    position: new CANNON.Vec3(0, porchHeight / 2, -60),
  });
  physicsWorld.addStatic(porchBody);

  // Wind tunnels in the porch floorboard cracks
  zones.addWindTunnel(
    new THREE.Vector3(0, porchHeight + 0.5, -60),
    new THREE.Vector3(porchWidth, 1, 2),
    new THREE.Vector3(1, 0, 0), // blows along X axis
  );

  // ─── THE INFLATABLE POOL (Liquid Hazard) ──────────
  const poolRadius = 12;
  const poolHeight = 3;

  const poolGeo = new THREE.CylinderGeometry(poolRadius, poolRadius, poolHeight, 24);
  const poolMat = new THREE.MeshStandardMaterial({
    color: 0x1155cc,
    transparent: true,
    opacity: 0.6,
    roughness: 0.2,
    metalness: 0.1,
  });
  const poolMesh = new THREE.Mesh(poolGeo, poolMat);
  poolMesh.position.set(30, poolHeight / 2, 20);
  scene.add(poolMesh);

  const poolBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Cylinder(poolRadius, poolRadius, poolHeight, 12),
    position: new CANNON.Vec3(30, poolHeight / 2, 20),
  });
  physicsWorld.addStatic(poolBody);

  zones.addWater(
    new THREE.Vector3(30, poolHeight / 2, 20),
    new THREE.Vector3(poolRadius * 2, poolHeight, poolRadius * 2),
  );

  // ─── BBQ GRILL (Thermal Source) ───────────────────
  const grillGeo = new THREE.BoxGeometry(4, 5, 3);
  const grillMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.8,
    roughness: 0.3,
    flatShading: true,
  });
  const grillMesh = new THREE.Mesh(grillGeo, grillMat);
  grillMesh.position.set(-25, 2.5, -30);
  grillMesh.castShadow = true;
  scene.add(grillMesh);

  const grillBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(2, 2.5, 1.5)),
    position: new CANNON.Vec3(-25, 2.5, -30),
  });
  physicsWorld.addStatic(grillBody);

  // Thermal column above the grill
  zones.addThermal(
    new THREE.Vector3(-25, 5, -30),
    new THREE.Vector3(8, 40, 8),
  );

  // Thermal shimmer visual (particle placeholder)
  const shimmerGeo = new THREE.PlaneGeometry(8, 40);
  const shimmerMat = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
  });
  const shimmer = new THREE.Mesh(shimmerGeo, shimmerMat);
  shimmer.position.set(-25, 25, -30);
  scene.add(shimmer);

  // ─── AC UNIT (Downdraft) ──────────────────────────
  const acGeo = new THREE.BoxGeometry(6, 4, 4);
  const acMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    metalness: 0.6,
    roughness: 0.4,
    flatShading: true,
  });
  const acMesh = new THREE.Mesh(acGeo, acMat);
  acMesh.position.set(40, 2, -55);
  acMesh.castShadow = true;
  scene.add(acMesh);

  zones.addDowndraft(
    new THREE.Vector3(40, 15, -55),
    new THREE.Vector3(12, 15, 12),
  );

  // ─── GARDEN HOSE (winding along ground) ───────────
  const hosePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-40, 0.3, 10),
    new THREE.Vector3(-30, 0.3, 25),
    new THREE.Vector3(-15, 0.3, 15),
    new THREE.Vector3(-5, 0.3, 30),
    new THREE.Vector3(10, 0.3, 20),
  ]);
  const hoseGeo = new THREE.TubeGeometry(hosePath, 40, 1.2, 8, false);
  const hoseMat = new THREE.MeshStandardMaterial({
    color: 0x22aa44,
    roughness: 0.7,
    flatShading: true,
  });
  const hoseMesh = new THREE.Mesh(hoseGeo, hoseMat);
  scene.add(hoseMesh);

  // Hose stream zone (when active)
  zones.addHoseStream(
    new THREE.Vector3(10, 3, 20),
    new THREE.Vector3(4, 6, 4),
    new THREE.Vector3(0, 1, 0), // shoots upward
    false, // starts inactive
  );

  // ─── FENCE (arena boundary) ───────────────────────
  const fenceHeight = 15;
  const fencePositions = [
    { pos: [0, fenceHeight / 2, 80], size: [150, fenceHeight, 0.5] },    // back
    { pos: [0, fenceHeight / 2, -80], size: [150, fenceHeight, 0.5] },   // front
    { pos: [75, fenceHeight / 2, 0], size: [0.5, fenceHeight, 160] },    // right
    { pos: [-75, fenceHeight / 2, 0], size: [0.5, fenceHeight, 160] },   // left
  ];

  const fenceMat = new THREE.MeshStandardMaterial({
    color: 0x654321,
    roughness: 1,
    flatShading: true,
  });

  for (const f of fencePositions) {
    const geo = new THREE.BoxGeometry(...f.size);
    const mesh = new THREE.Mesh(geo, fenceMat);
    mesh.position.set(...f.pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(f.size[0] / 2, f.size[1] / 2, f.size[2] / 2)),
      position: new CANNON.Vec3(...f.pos),
    });
    physicsWorld.addStatic(body);
  }

  // ─── BLACK ASPHALT PATCH (thermal source) ─────────
  const asphaltGeo = new THREE.PlaneGeometry(20, 20);
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.6,
  });
  const asphaltMesh = new THREE.Mesh(asphaltGeo, asphaltMat);
  asphaltMesh.rotation.x = -Math.PI / 2;
  asphaltMesh.position.set(-40, 0.05, 40);
  scene.add(asphaltMesh);

  zones.addThermal(
    new THREE.Vector3(-40, 0, 40),
    new THREE.Vector3(20, 30, 20),
  );

  return { zones };
}
