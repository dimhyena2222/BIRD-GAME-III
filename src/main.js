/**
 * ═══════════════════════════════════════════════════════════
 *  BIRD GAME 3 — MAIN ENTRY POINT
 *  "The Kinetic Economy"
 *
 *  A physics-first avian combat simulator in a Macro-Scale
 *  universe. Phonk aesthetic. Newtonian momentum.
 * ═══════════════════════════════════════════════════════════
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Core systems
import { PhysicsWorld } from './core/physicsWorld.js';
import { FlightController } from './core/flight.js';
import { InputManager } from './core/input.js';

// Data
import { getSpecies } from './data/species.js';

// World
import { buildWorld } from './world/backyard.js';

// Rendering
import { createBirdMesh, updatePlumageHealth } from './rendering/birdMesh.js';
import { VFXManager } from './rendering/vfx.js';

// Audio
import { PhonkSyncEngine } from './audio/phonkSync.js';

// UI
import { HUDManager } from './ui/hud.js';
import { MenuManager } from './ui/menu.js';

// Progression
import { NestProgression } from './progression/nest.js';

// ─── Three.js Scene Setup ───────────────────────────

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  500,
);
camera.position.set(0, 20, 30);

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Systems ────────────────────────────────────────

const physicsWorld = new PhysicsWorld();
const input = new InputManager(renderer.domElement);
const vfx = new VFXManager();
const audio = new PhonkSyncEngine();
const hud = new HUDManager();
const nest = new NestProgression();
nest.load();

// ─── World ──────────────────────────────────────────

const { zones } = buildWorld(scene, physicsWorld);

// ─── Player State ───────────────────────────────────

let playerBody = null;
let playerCtrl = null;
let playerMesh = null;
let isPlaying = false;

// Camera follow offset
const cameraOffset = new THREE.Vector3(0, 3, 8);
const cameraLookAhead = new THREE.Vector3(0, 0, -5);

// ─── Spawn Player ───────────────────────────────────

function spawnPlayer(speciesId) {
  const speciesData = getSpecies(speciesId);

  // Apply nest progression modifiers
  const mods = nest.getStatModifiers();
  const modifiedSpecies = { ...speciesData };
  modifiedSpecies.mass = Math.round(speciesData.mass * mods.massMultiplier);
  modifiedSpecies.dragCoefficient = speciesData.dragCoefficient * mods.dragMultiplier;
  modifiedSpecies.maxThrust = Math.round(speciesData.maxThrust * mods.thrustMultiplier);
  modifiedSpecies.structuralIntegrity = Math.round(
    speciesData.structuralIntegrity * mods.integrityMultiplier,
  );
  modifiedSpecies.maxStamina = speciesData.maxStamina + mods.staminaBonus;

  // Physics body
  const radius = 0.5 * speciesData.hitboxScale;
  playerBody = new CANNON.Body({
    mass: modifiedSpecies.mass,
    shape: new CANNON.Sphere(radius),
    position: new CANNON.Vec3(0, 20, 0),
    linearDamping: 0.01,
    angularDamping: 0.4,
  });

  // Flight controller
  playerCtrl = new FlightController(playerBody, modifiedSpecies);
  physicsWorld.addBird(playerBody, playerCtrl);

  // Visual mesh
  playerMesh = createBirdMesh(speciesData);
  scene.add(playerMesh);

  // Audio: set silent glide for Owl
  audio.silentGlide = speciesData.ability?.silentGlide ?? false;

  isPlaying = true;
  hud.show();
  input.requestPointerLock();
}

// ─── Menu ───────────────────────────────────────────

const menu = new MenuManager((speciesId) => {
  audio.init(); // must be triggered by user gesture
  spawnPlayer(speciesId);
});

// ─── Game Loop ──────────────────────────────────────

const clock = new THREE.Clock();

function gameLoop() {
  requestAnimationFrame(gameLoop);

  const dt = Math.min(clock.getDelta(), 0.05); // cap at 50ms

  if (isPlaying && playerCtrl) {
    // ─ Input ─
    const flightInput = input.getFlightInput();

    // Handle peck
    if (flightInput.peck) {
      physicsWorld.combat.peck(playerCtrl);
    }

    // Handle break free
    if (flightInput.breakFree) {
      physicsWorld.combat.attemptBreakFree(playerBody, physicsWorld.birds);
    }

    // Handle reverse thrust (Hummingbird ability)
    if (flightInput.reverseThrust && playerCtrl.species.ability?.reverseThrustMultiplier) {
      const rev = new CANNON.Vec3(0, 0, 1);
      playerBody.quaternion.vmult(rev, rev);
      rev.scale(playerCtrl.species.maxThrust * 0.3, rev);
      playerBody.applyImpulse(rev);
    }

    // ─ Flight Physics ─
    playerCtrl.update(dt, flightInput);

    // ─ Environment Zones ─
    zones.applyZoneEffects(playerBody, playerCtrl, dt);

    // ─ Physics Step ─
    physicsWorld.step(dt);

    // ─ Sync mesh to physics ─
    playerMesh.position.copy(playerBody.position);
    playerMesh.quaternion.copy(playerBody.quaternion);

    // ─ Plumage Health Visual ─
    updatePlumageHealth(playerMesh, playerCtrl.integrityFraction);

    // ─ Camera Follow ─
    const birdPos = new THREE.Vector3().copy(playerBody.position);
    const birdQuat = new THREE.Quaternion().copy(playerBody.quaternion);

    const offset = cameraOffset.clone().applyQuaternion(birdQuat);
    const targetCamPos = birdPos.clone().add(offset);
    camera.position.lerp(targetCamPos, 5 * dt);

    const lookAt = birdPos.clone().add(cameraLookAhead.clone().applyQuaternion(birdQuat));
    camera.lookAt(lookAt);

    // ─ HUD ─
    hud.update(playerCtrl);

    // ─ Audio ─
    audio.update(playerCtrl.speedMph);

    // ─ VFX ─
    vfx.update(playerCtrl.speedMph);

    // ─ Death check ─
    if (playerCtrl.structuralIntegrity <= 0) {
      handleDeath();
    }

    // ─ Out of bounds / fell off world ─
    if (playerBody.position.y < -10) {
      handleDeath();
    }
  }

  renderer.render(scene, camera);
}

function handleDeath() {
  isPlaying = false;
  hud.hide();
  input.exitPointerLock();

  // Award XP based on time survived (placeholder)
  nest.addXP(50);
  nest.save();

  // Clean up
  if (playerMesh) scene.remove(playerMesh);
  if (playerBody) physicsWorld.world.removeBody(playerBody);

  playerBody = null;
  playerCtrl = null;
  playerMesh = null;

  // Return to menu after a beat
  setTimeout(() => menu.show(), 1500);
}

// ─── ESC to return to menu ──────────────────────────

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && isPlaying) {
    handleDeath(); // for now, treat ESC as forfeit
  }
});

// ─── Start ──────────────────────────────────────────

gameLoop();

console.log(
  '%c🐦 BIRD GAME III — THE KINETIC ECONOMY 🐦',
  'color: #ff1a1a; font-size: 20px; font-weight: bold; text-shadow: 2px 2px #8b00ff;',
);
console.log(
  '%cPhysics-first. Phonk-sync. Featherless ragdolls.',
  'color: #888; font-style: italic;',
);
