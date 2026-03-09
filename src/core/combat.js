/**
 * ═══════════════════════════════════════════════════════
 *  BIRD GAME 3 — Combat System ("The Collision Matrix")
 *
 *  Velocity-Delta damage, Kinetic Pecking, and Talon-Clutching.
 * ═══════════════════════════════════════════════════════
 */

import * as CANNON from 'cannon-es';
import {
  VELOCITY_DELTA_THRESHOLD,
  PECK_DASH_SPEED,
  PECK_COOLDOWN,
  PECK_PIERCE_VELOCITY,
  RAGDOLL_DURATION_BASE,
  DAMAGE_PER_DELTA_V,
  GRIP_BREAK_STAMINA_COST,
  STAMINA_GRIP_COST_PER_SEC,
  STAMINA_PECK_COST,
} from './constants.js';

/**
 * CombatSystem — manages bird-to-bird collisions, pecking, and clutching.
 */
export class CombatSystem {
  constructor(physicsWorld) {
    this.world = physicsWorld;
    this.clutches = []; // active { birdA, birdB, constraint, timer }
    this.peckCooldowns = new Map(); // birdId → remaining cooldown
  }

  /**
   * Called every physics tick
   * @param {number} dt
   * @param {Map<number, FlightController>} birds — bodyId → FlightController
   */
  update(dt, birds) {
    // Tick peck cooldowns
    for (const [id, cd] of this.peckCooldowns) {
      const remaining = cd - dt;
      if (remaining <= 0) this.peckCooldowns.delete(id);
      else this.peckCooldowns.set(id, remaining);
    }

    // Tick clutches
    for (let i = this.clutches.length - 1; i >= 0; i--) {
      const clutch = this.clutches[i];
      clutch.timer -= dt;

      // Drain stamina from both
      const ctrlA = birds.get(clutch.birdA.id);
      const ctrlB = birds.get(clutch.birdB.id);
      if (ctrlA) ctrlA.stamina -= STAMINA_GRIP_COST_PER_SEC * dt;
      if (ctrlB) ctrlB.stamina -= STAMINA_GRIP_COST_PER_SEC * dt;

      // Break condition
      if (clutch.timer <= 0 || (ctrlA && ctrlA.stamina <= 0) || (ctrlB && ctrlB.stamina <= 0)) {
        this.breakClutch(i);
      }
    }
  }

  // ─── Collision Handling ───────────────────────────

  /**
   * Process a collision between two bird bodies.
   * Called from the physics world contact event.
   *
   * @param {CANNON.Body} bodyA
   * @param {CANNON.Body} bodyB
   * @param {Map<number, FlightController>} birds
   */
  handleCollision(bodyA, bodyB, birds) {
    const ctrlA = birds.get(bodyA.id);
    const ctrlB = birds.get(bodyB.id);
    if (!ctrlA || !ctrlB) return; // one isn't a bird

    // Calculate Velocity Delta
    const relVel = new CANNON.Vec3();
    bodyA.velocity.vsub(bodyB.velocity, relVel);
    const deltaV = relVel.length();

    if (deltaV < VELOCITY_DELTA_THRESHOLD) return; // glancing blow

    // Determine "attacker" (higher kinetic energy = 0.5mv²)
    const keA = 0.5 * ctrlA.species.mass * bodyA.velocity.lengthSquared();
    const keB = 0.5 * ctrlB.species.mass * bodyB.velocity.lengthSquared();

    const [attacker, victim, attackCtrl, victimCtrl] =
      keA >= keB
        ? [bodyA, bodyB, ctrlA, ctrlB]
        : [bodyB, bodyA, ctrlB, ctrlA];

    // ─ Dodo Crushing Impact: instant kill from above ─
    if (attackCtrl.species.ability?.crushingImpact && attacker.velocity.y < -5) {
      victimCtrl.takeDamage(victimCtrl.maxIntegrity); // one-hit
      victimCtrl.enterRagdoll(RAGDOLL_DURATION_BASE * 2);
      return;
    }

    // ─ Standard damage ─
    const damage = deltaV * DAMAGE_PER_DELTA_V;
    victimCtrl.takeDamage(damage);
    victimCtrl.enterRagdoll(RAGDOLL_DURATION_BASE);

    // Knockback impulse on victim
    const knockDir = attacker.velocity.unit();
    const knockImpulse = knockDir.scale(deltaV * victimCtrl.species.mass * 0.3);
    victim.applyImpulse(knockImpulse);
  }

  // ─── Kinetic Pecking ──────────────────────────────

  /**
   * Execute a Peck action.
   * @param {FlightController} ctrl
   */
  peck(ctrl) {
    const body = ctrl.body;
    if (this.peckCooldowns.has(body.id)) return;
    if (ctrl.stamina < STAMINA_PECK_COST) return;
    if (ctrl.isRagdoll) return;

    ctrl.stamina -= STAMINA_PECK_COST;
    this.peckCooldowns.set(body.id, PECK_COOLDOWN);

    // Forward dash impulse
    const facing = new CANNON.Vec3(0, 0, -1);
    body.quaternion.vmult(facing, facing);

    const impulse = facing.scale(PECK_DASH_SPEED * ctrl.species.mass * 0.1);
    body.applyImpulse(impulse);

    // At high speed, peck "pierces" — ignores target mass resistance
    // (handled in collision resolution by flagging the peck state)
    ctrl._isPecking = true;
    ctrl._peckPiercing = ctrl.speedMph >= PECK_PIERCE_VELOCITY;

    // Clear peck state after a short window
    setTimeout(() => {
      ctrl._isPecking = false;
      ctrl._peckPiercing = false;
    }, 200);
  }

  // ─── Talon-Clutching ──────────────────────────────

  /**
   * Attempt to grip another bird (Talon-Clutch).
   * @param {CANNON.Body} bodyA
   * @param {CANNON.Body} bodyB
   * @param {Map<number, FlightController>} birds
   */
  initiateClutch(bodyA, bodyB, birds) {
    const ctrlA = birds.get(bodyA.id);
    const ctrlB = birds.get(bodyB.id);
    if (!ctrlA || !ctrlB) return;

    // Create a lock constraint (weld the two bodies)
    const constraint = new CANNON.LockConstraint(bodyA, bodyB);
    this.world.addConstraint(constraint);

    // Grip-Lock ability: opponents can't break for N seconds
    const lockDuration = ctrlA.species.ability?.gripLockDuration ?? 0;
    const baseDuration = 5; // default clutch max duration

    this.clutches.push({
      birdA: bodyA,
      birdB: bodyB,
      constraint,
      timer: baseDuration + lockDuration,
      lockTimer: lockDuration,
    });
  }

  /**
   * Break a clutch by index
   */
  breakClutch(index) {
    const clutch = this.clutches[index];
    if (!clutch) return;
    this.world.removeConstraint(clutch.constraint);
    this.clutches.splice(index, 1);
  }

  /**
   * Attempt to break free from a clutch (costs stamina).
   * @param {CANNON.Body} body
   * @param {Map<number, FlightController>} birds
   */
  attemptBreakFree(body, birds) {
    const ctrl = birds.get(body.id);
    if (!ctrl) return;

    const clutchIndex = this.clutches.findIndex(
      (c) => c.birdA.id === body.id || c.birdB.id === body.id
    );
    if (clutchIndex === -1) return;

    const clutch = this.clutches[clutchIndex];

    // Can't break during Grip-Lock window
    if (clutch.lockTimer > 0) return;

    if (ctrl.stamina >= GRIP_BREAK_STAMINA_COST) {
      ctrl.stamina -= GRIP_BREAK_STAMINA_COST;
      this.breakClutch(clutchIndex);
    }
  }
}
