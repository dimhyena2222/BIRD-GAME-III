/**
 * ═══════════════════════════════════════════════════════
 *  BIRD GAME 3 — Physics World Wrapper
 *  Sets up the Cannon-es physics world with gravity and
 *  broadphase. Manages the step loop and body registry.
 * ═══════════════════════════════════════════════════════
 */

import * as CANNON from 'cannon-es';
import { GRAVITY } from './constants.js';
import { CombatSystem } from './combat.js';

export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, GRAVITY, 0),
    });

    // Use SAPBroadphase for better performance with many bodies
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = false; // birds never sleep mid-flight
    this.world.solver.iterations = 10;

    // Materials
    this.birdMaterial = new CANNON.Material('bird');
    this.groundMaterial = new CANNON.Material('ground');
    this.waterMaterial = new CANNON.Material('water');

    // Contact materials
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.birdMaterial, this.groundMaterial, {
        friction: 0.4,
        restitution: 0.3,
      })
    );
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.birdMaterial, this.birdMaterial, {
        friction: 0.1,
        restitution: 0.6, // birds bounce off each other
      })
    );

    /** @type {Map<number, import('./flight.js').FlightController>} */
    this.birds = new Map();

    this.combat = new CombatSystem(this.world);

    // Wire up collision events
    this.world.addEventListener('beginContact', (event) => {
      this.combat.handleCollision(event.bodyA, event.bodyB, this.birds);
    });
  }

  /**
   * Register a bird body + flight controller
   */
  addBird(body, flightController) {
    body.material = this.birdMaterial;
    this.world.addBody(body);
    this.birds.set(body.id, flightController);
  }

  /**
   * Add a static body (ground, walls, etc.)
   */
  addStatic(body) {
    body.material = this.groundMaterial;
    this.world.addBody(body);
  }

  /**
   * Step the physics world forward
   * @param {number} dt — delta time in seconds
   */
  step(dt) {
    this.world.step(1 / 60, dt, 3);
    this.combat.update(dt, this.birds);
  }
}
