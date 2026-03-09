/**
 * ═══════════════════════════════════════════════════════
 *  BIRD GAME 3 — Bird Mesh Factory
 *  Creates the Three.js visual representation of each bird.
 *  Implements "Plumage Health" — geometry peels away as
 *  structural integrity drops.
 * ═══════════════════════════════════════════════════════
 */

import * as THREE from 'three';
import {
  FEATHER_LOSS_THRESHOLD,
  WIREFRAME_THRESHOLD,
  MEAT_THRESHOLD,
} from '../core/constants.js';

/**
 * Create a bird mesh group for a given species.
 * Returns a THREE.Group with layers: feathers → wireframe → meat.
 *
 * @param {object} speciesData — from species.js
 * @returns {THREE.Group}
 */
export function createBirdMesh(speciesData) {
  const group = new THREE.Group();
  group.name = `bird_${speciesData.id}`;

  const scale = speciesData.hitboxScale;

  // ─── Body (ellipsoid) ─────────────────────────────
  const bodyGeo = new THREE.SphereGeometry(0.5 * scale, 12, 8);
  bodyGeo.scale(1, 0.7, 1.4); // elongated

  // Layer 1: Feathered exterior
  const featherMat = new THREE.MeshStandardMaterial({
    color: speciesData.color,
    roughness: 0.8,
    metalness: 0.0,
    flatShading: true,
  });
  const featherMesh = new THREE.Mesh(bodyGeo, featherMat);
  featherMesh.name = 'feathers';
  featherMesh.castShadow = true;
  group.add(featherMesh);

  // Layer 2: Wireframe (exposed when feathers peel)
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    wireframe: true,
    transparent: true,
    opacity: 0,
  });
  const wireMesh = new THREE.Mesh(bodyGeo.clone(), wireMat);
  wireMesh.name = 'wireframe';
  wireMesh.scale.setScalar(0.95);
  group.add(wireMesh);

  // Layer 3: "Meat" core (last resort visual)
  const meatMat = new THREE.MeshStandardMaterial({
    color: 0xcc2200,
    roughness: 1,
    metalness: 0,
    flatShading: true,
    transparent: true,
    opacity: 0,
  });
  const meatMesh = new THREE.Mesh(bodyGeo.clone(), meatMat);
  meatMesh.name = 'meat';
  meatMesh.scale.setScalar(0.85);
  group.add(meatMesh);

  // ─── Wings ────────────────────────────────────────
  const wingGeo = new THREE.PlaneGeometry(
    0.8 * scale * speciesData.wingArea,
    0.3 * scale,
    4, 2
  );
  const wingMat = new THREE.MeshStandardMaterial({
    color: speciesData.color,
    side: THREE.DoubleSide,
    flatShading: true,
    roughness: 0.9,
  });

  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.name = 'wingL';
  leftWing.position.set(-0.5 * scale, 0, 0);
  leftWing.rotation.z = 0.3;
  group.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.name = 'wingR';
  rightWing.position.set(0.5 * scale, 0, 0);
  rightWing.rotation.z = -0.3;
  group.add(rightWing);

  // ─── Beak ─────────────────────────────────────────
  const beakGeo = new THREE.ConeGeometry(0.08 * scale, 0.3 * scale, 4);
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, flatShading: true });
  const beak = new THREE.Mesh(beakGeo, beakMat);
  beak.name = 'beak';
  beak.position.set(0, 0, -0.7 * scale);
  beak.rotation.x = -Math.PI / 2;
  group.add(beak);

  // ─── Eyes (uncanny-valley style — slightly too large) ──
  const eyeGeo = new THREE.SphereGeometry(0.08 * scale, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.15 * scale, 0.15 * scale, -0.45 * scale);
  group.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.15 * scale, 0.15 * scale, -0.45 * scale);
  group.add(eyeR);

  return group;
}

/**
 * Update the bird mesh's visual layers based on structural integrity.
 *
 * @param {THREE.Group} group  — the bird mesh group
 * @param {number} integrityFraction — 0 to 1
 */
export function updatePlumageHealth(group, integrityFraction) {
  const feathers = group.getObjectByName('feathers');
  const wireframe = group.getObjectByName('wireframe');
  const meat = group.getObjectByName('meat');

  if (!feathers || !wireframe || !meat) return;

  if (integrityFraction > FEATHER_LOSS_THRESHOLD) {
    // Full feathers
    feathers.material.opacity = 1;
    feathers.material.transparent = false;
    wireframe.material.opacity = 0;
    meat.material.opacity = 0;
  } else if (integrityFraction > WIREFRAME_THRESHOLD) {
    // Feathers peeling — lerp transparency
    const t = (integrityFraction - WIREFRAME_THRESHOLD) / (FEATHER_LOSS_THRESHOLD - WIREFRAME_THRESHOLD);
    feathers.material.transparent = true;
    feathers.material.opacity = t;
    wireframe.material.opacity = 1 - t;
    meat.material.opacity = 0;
  } else if (integrityFraction > MEAT_THRESHOLD) {
    // Wireframe + meat emerging
    const t = (integrityFraction - MEAT_THRESHOLD) / (WIREFRAME_THRESHOLD - MEAT_THRESHOLD);
    feathers.material.opacity = 0;
    wireframe.material.opacity = t;
    meat.material.opacity = 1 - t;
  } else {
    // Nearly dead: vibrating featherless ragdoll
    feathers.material.opacity = 0;
    wireframe.material.opacity = 0.2;
    meat.material.opacity = 1;
    // Add vibration
    group.position.x += (Math.random() - 0.5) * 0.02;
    group.position.y += (Math.random() - 0.5) * 0.02;
  }
}
