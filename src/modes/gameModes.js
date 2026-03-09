/**
 * ═══════════════════════════════════════════════════════
 *  BIRD GAME 3 — Game Modes
 *
 *  1. "The Golden Egg" — Strategic CTF
 *  2. "Apex Predator" — King of the Speed
 *  3. "The Great Migration" — Checkpoint Racing
 * ═══════════════════════════════════════════════════════
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {
  GOLDEN_EGG_MASS,
  GOLDEN_EGG_CRACK_SPEED,
  APEX_PREDATOR_ZONE_RADIUS,
  APEX_PREDATOR_ZONE_SPEED,
  SLIPSTREAM_DRAG_REDUCTION,
  SLIPSTREAM_DISTANCE,
} from '../core/constants.js';

// ─── 1. THE GOLDEN EGG (CTF) ────────────────────────

export class GoldenEggMode {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.world = physicsWorld;
    this.carrier = null; // FlightController of current carrier
    this.eggBody = null;
    this.eggMesh = null;
    this.cracked = false;
    this.scores = new Map(); // teamId → score
  }

  init() {
    // Create the egg physics body
    this.eggBody = new CANNON.Body({
      mass: GOLDEN_EGG_MASS,
      shape: new CANNON.Sphere(0.8),
      position: new CANNON.Vec3(0, 5, 0),
    });
    this.world.world.addBody(this.eggBody);

    // Create the egg mesh
    const geo = new THREE.SphereGeometry(0.8, 16, 12);
    geo.scale(1, 1.3, 1); // egg-shaped
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0xffaa00,
      emissiveIntensity: 0.3,
    });
    this.eggMesh = new THREE.Mesh(geo, mat);
    this.eggMesh.castShadow = true;
    this.scene.add(this.eggMesh);
  }

  update(dt) {
    if (!this.eggBody) return;

    // Sync mesh to physics
    this.eggMesh.position.copy(this.eggBody.position);
    this.eggMesh.quaternion.copy(this.eggBody.quaternion);

    // If carried, weld egg to carrier
    if (this.carrier && !this.cracked) {
      const pos = this.carrier.body.position;
      this.eggBody.position.set(pos.x, pos.y - 1, pos.z);
      this.eggBody.velocity.copy(this.carrier.body.velocity);
    }
  }

  /**
   * Called when carrier hits a wall
   */
  checkCrack(impactSpeed) {
    if (impactSpeed > GOLDEN_EGG_CRACK_SPEED) {
      this.crack();
    }
  }

  crack() {
    this.cracked = true;
    this.carrier = null;
    // Reset egg to center
    this.eggBody.position.set(0, 5, 0);
    this.eggBody.velocity.set(0, 0, 0);
    this.eggMesh.material.color.setHex(0xaa8800); // dulled color
    // Re-enable after delay
    setTimeout(() => {
      this.cracked = false;
      this.eggMesh.material.color.setHex(0xffd700);
    }, 3000);
  }

  pickUp(flightController) {
    if (this.cracked) return;
    this.carrier = flightController;
  }
}

// ─── 2. APEX PREDATOR (King of the Speed) ───────────

export class ApexPredatorMode {
  constructor(scene) {
    this.scene = scene;
    this.zoneMesh = null;
    this.zoneCenter = new THREE.Vector3(0, 20, 0);
    this.zoneDirection = new THREE.Vector3(1, 0, 0);
    this.scores = new Map(); // bodyId → score
    this.elapsed = 0;
  }

  init() {
    // Create the moving zone sphere
    const geo = new THREE.SphereGeometry(APEX_PREDATOR_ZONE_RADIUS, 24, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffee00,
      transparent: true,
      opacity: 0.12,
      wireframe: true,
    });
    this.zoneMesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.zoneMesh);

    // Add a point light inside the zone
    const light = new THREE.PointLight(0xffee00, 0.8, APEX_PREDATOR_ZONE_RADIUS * 2);
    this.zoneMesh.add(light);
  }

  update(dt, birds) {
    this.elapsed += dt;

    // Move the zone in a figure-8 pattern
    const t = this.elapsed * 0.1;
    this.zoneCenter.set(
      Math.sin(t) * 40,
      20 + Math.sin(t * 2) * 8,
      Math.cos(t * 0.5) * 30,
    );
    this.zoneMesh.position.copy(this.zoneCenter);

    // Score: Time × Velocity² for birds inside the zone
    for (const [bodyId, ctrl] of birds) {
      const birdPos = new THREE.Vector3(
        ctrl.body.position.x,
        ctrl.body.position.y,
        ctrl.body.position.z,
      );
      const dist = birdPos.distanceTo(this.zoneCenter);

      if (dist <= APEX_PREDATOR_ZONE_RADIUS) {
        const v = ctrl.speed;
        const scoreInc = dt * v * v;
        const prev = this.scores.get(bodyId) ?? 0;
        this.scores.set(bodyId, prev + scoreInc);
      }
    }
  }
}

// ─── 3. THE GREAT MIGRATION (Checkpoint Racing) ─────

export class GreatMigrationMode {
  constructor(scene) {
    this.scene = scene;
    this.checkpoints = [];
    this.playerProgress = new Map(); // bodyId → next checkpoint index
    this.finishTimes = new Map();
  }

  init() {
    // Define checkpoint ring positions through the backyard
    const positions = [
      new THREE.Vector3(0, 15, -40),
      new THREE.Vector3(20, 20, -20),
      new THREE.Vector3(40, 10, 0),
      new THREE.Vector3(20, 25, 20),
      new THREE.Vector3(-10, 15, 40),
      new THREE.Vector3(-30, 20, 20),
      new THREE.Vector3(-40, 12, -10),
      new THREE.Vector3(-20, 18, -30),
      new THREE.Vector3(0, 25, -50), // finish line (elevated)
    ];

    for (let i = 0; i < positions.length; i++) {
      const ringGeo = new THREE.TorusGeometry(4, 0.3, 8, 24);
      const ringMat = new THREE.MeshStandardMaterial({
        color: i === positions.length - 1 ? 0xffd700 : 0x00ffaa, // gold for finish
        emissive: i === positions.length - 1 ? 0xffaa00 : 0x008855,
        emissiveIntensity: 0.5,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(positions[i]);
      // Random rotation to make it interesting
      ring.rotation.y = Math.random() * Math.PI;
      ring.rotation.x = (Math.random() - 0.5) * 0.5;
      this.scene.add(ring);

      this.checkpoints.push({
        mesh: ring,
        position: positions[i],
        radius: 5, // pass-through radius
      });
    }
  }

  /**
   * Check if any bird passed through their next checkpoint.
   * Also handles slipstream mechanic.
   */
  update(dt, birds) {
    for (const [bodyId, ctrl] of birds) {
      const nextIdx = this.playerProgress.get(bodyId) ?? 0;
      if (nextIdx >= this.checkpoints.length) continue; // finished

      const cp = this.checkpoints[nextIdx];
      const birdPos = new THREE.Vector3(
        ctrl.body.position.x,
        ctrl.body.position.y,
        ctrl.body.position.z,
      );

      if (birdPos.distanceTo(cp.position) < cp.radius) {
        this.playerProgress.set(bodyId, nextIdx + 1);

        // Flash the ring
        cp.mesh.material.emissiveIntensity = 2;
        setTimeout(() => {
          cp.mesh.material.emissiveIntensity = 0.5;
        }, 300);

        if (nextIdx + 1 >= this.checkpoints.length) {
          this.finishTimes.set(bodyId, performance.now());
        }
      }
    }

    // ─── Slipstream mechanic ───
    const birdEntries = [...birds.entries()];
    for (let i = 0; i < birdEntries.length; i++) {
      for (let j = i + 1; j < birdEntries.length; j++) {
        const [, ctrlA] = birdEntries[i];
        const [, ctrlB] = birdEntries[j];
        const posA = ctrlA.body.position;
        const posB = ctrlB.body.position;

        const dist = posA.distanceTo(posB);
        if (dist < SLIPSTREAM_DISTANCE && dist > 1) {
          // The bird behind gets reduced drag
          const dotA = ctrlA.body.velocity.dot(
            new CANNON.Vec3(posB.x - posA.x, posB.y - posA.y, posB.z - posA.z).unit()
          );
          const dotB = ctrlB.body.velocity.dot(
            new CANNON.Vec3(posA.x - posB.x, posA.y - posB.y, posA.z - posB.z).unit()
          );

          // Bird moving toward the other = "behind" them
          if (dotA > 0) ctrlA._slipstreamActive = true;
          if (dotB > 0) ctrlB._slipstreamActive = true;
        }
      }
    }
  }
}
