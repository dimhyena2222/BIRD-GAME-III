/**
 * ═══════════════════════════════════════════════════════
 *  BIRD GAME 3 — Flight Physics ("The Vector-Vortex")
 *
 *  Newtonian Momentum system. Every bird is a rigid body
 *  influenced by: Thrust, Lift, Drag, and Gravity.
 * ═══════════════════════════════════════════════════════
 */

import * as CANNON from 'cannon-es';
import {
  GRAVITY,
  AIR_DENSITY,
  FLAP_IMPULSE_BASE,
  FLAP_COOLDOWN,
  GLIDE_LIFT_COEFFICIENT,
  TUCK_DRAG_MULTIPLIER,
  FLARE_DRAG_MULTIPLIER,
  TURBULENCE_SPEED_THRESHOLD,
  TURBULENCE_DRAG_BONUS,
  TERMINAL_VELOCITY,
  STAMINA_PER_FLAP,
} from './constants.js';

/**
 * Wing states for drag manipulation
 */
export const WingState = {
  NORMAL: 'normal',
  TUCKED: 'tucked',   // reduced drag, higher terminal velocity
  FLARED: 'flared',   // airbrake, massive drag
};

/**
 * FlightController — attaches to a CANNON.Body and applies
 * the four-force flight model each physics tick.
 */
export class FlightController {
  /**
   * @param {CANNON.Body} body         — the bird's rigid body
   * @param {object}      speciesData  — from species.js
   */
  constructor(body, speciesData) {
    this.body = body;
    this.species = speciesData;

    // State
    this.wingState = WingState.NORMAL;
    this.stamina = speciesData.maxStamina;
    this.structuralIntegrity = speciesData.structuralIntegrity;
    this.maxIntegrity = speciesData.structuralIntegrity;
    this.isRagdoll = false;
    this.ragdollTimer = 0;
    this.flapCooldownTimer = 0;
    this.isInWater = false;
    this.isInThermal = false;
    this.isInDowndraft = false;

    // Facing direction (unit vector, updated from body quaternion)
    this._facing = new CANNON.Vec3(0, 0, -1);
    this._velocity = new CANNON.Vec3();
  }

  /** Current speed in world-units/s */
  get speed() {
    return this.body.velocity.length();
  }

  /** Current speed converted to "mph" for HUD display */
  get speedMph() {
    return this.speed * 2.237; // rough m/s → mph
  }

  /** Current altitude (Y position) */
  get altitude() {
    return this.body.position.y;
  }

  /** Integrity as a 0–1 fraction */
  get integrityFraction() {
    return Math.max(0, this.structuralIntegrity / this.maxIntegrity);
  }

  /** Stamina as a 0–1 fraction */
  get staminaFraction() {
    return Math.max(0, this.stamina / this.species.maxStamina);
  }

  // ─── Per-Frame Update ───────────────────────────────

  /**
   * Called every physics step.
   * @param {number} dt — delta time in seconds
   * @param {object} input — { flap, tuck, flare, pitch, yaw }
   */
  update(dt, input) {
    if (this.isRagdoll) {
      this.ragdollTimer -= dt;
      if (this.ragdollTimer <= 0) {
        this.isRagdoll = false;
      }
      return; // no control during ragdoll
    }

    this.flapCooldownTimer = Math.max(0, this.flapCooldownTimer - dt);

    // Update facing from body quaternion
    const quat = this.body.quaternion;
    this._facing.set(0, 0, -1);
    quat.vmult(this._facing, this._facing);

    // Update wing state
    if (input.tuck) {
      this.wingState = WingState.TUCKED;
    } else if (input.flare) {
      this.wingState = WingState.FLARED;
    } else {
      this.wingState = WingState.NORMAL;
    }

    this._applyThrust(dt, input);
    this._applyLift(dt);
    this._applyDrag(dt);
    this._applyRotation(dt, input);
    this._regenStamina(dt);
    this._clampVelocity();
  }

  // ─── 1. THRUST (Flapping) ──────────────────────────

  _applyThrust(dt, input) {
    if (!input.flap) return;
    if (this.flapCooldownTimer > 0) return;
    if (this.stamina < STAMINA_PER_FLAP) return;

    this.stamina -= STAMINA_PER_FLAP;
    this.flapCooldownTimer = FLAP_COOLDOWN;

    const impulse = this._facing.scale(
      FLAP_IMPULSE_BASE * (this.species.maxThrust / 50) // normalized to pigeon
    );
    this.body.applyImpulse(impulse);
  }

  // ─── 2. LIFT (Glide) ──────────────────────────────

  _applyLift(dt) {
    // Lift ∝ v² × wingArea × CL × 0.5 × airDensity
    const hSpeed = Math.sqrt(
      this.body.velocity.x ** 2 + this.body.velocity.z ** 2
    );
    const liftMagnitude =
      0.5 *
      AIR_DENSITY *
      hSpeed ** 2 *
      this.species.wingArea *
      GLIDE_LIFT_COEFFICIENT;

    // Negative lift for the Dodo — gravity wins harder
    const liftSign = this.species.negativeLift ? -0.3 : 1;

    const liftForce = new CANNON.Vec3(0, liftMagnitude * liftSign * dt, 0);
    this.body.applyForce(liftForce);
  }

  // ─── 3. DRAG (Air Resistance) ─────────────────────

  _applyDrag(dt) {
    const v = this.body.velocity;
    const speed = v.length();
    if (speed < 0.01) return;

    let Cd = this.species.dragCoefficient;

    // Wing state modifiers
    if (this.wingState === WingState.TUCKED) {
      Cd *= TUCK_DRAG_MULTIPLIER;
    } else if (this.wingState === WingState.FLARED) {
      Cd *= FLARE_DRAG_MULTIPLIER;
    }

    // Turbulence: high speed + flapping while diving
    if (speed * 2.237 > TURBULENCE_SPEED_THRESHOLD && this.body.velocity.y < -5) {
      Cd += TURBULENCE_DRAG_BONUS;
    }

    // Drag = 0.5 * ρ * v² * Cd * A (simplified)
    const dragMagnitude = 0.5 * AIR_DENSITY * speed * speed * Cd;

    // Apply opposing velocity direction
    const dragForce = v.unit();
    dragForce.scale(-dragMagnitude * dt, dragForce);
    this.body.applyForce(dragForce);
  }

  // ─── 4. ROTATION / STEERING ───────────────────────

  _applyRotation(dt, input) {
    const pitchRate = 2.5; // rad/s
    const yawRate = 2.0;
    const rollRate = 1.5;

    // Pitch (mouse Y / W-S)
    if (input.pitch) {
      const pitchQuat = new CANNON.Quaternion();
      pitchQuat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), input.pitch * pitchRate * dt);
      this.body.quaternion = this.body.quaternion.mult(pitchQuat);
    }

    // Yaw (mouse X / A-D)
    if (input.yaw) {
      const yawQuat = new CANNON.Quaternion();
      yawQuat.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -input.yaw * yawRate * dt);
      this.body.quaternion = this.body.quaternion.mult(yawQuat);
    }
  }

  // ─── Stamina Regen ────────────────────────────────

  _regenStamina(dt) {
    if (this.wingState === WingState.NORMAL || this.wingState === WingState.FLARED) {
      this.stamina = Math.min(
        this.species.maxStamina,
        this.stamina + this.species.staminaRegen * 5 * dt
      );
    }
  }

  // ─── Speed Clamp ──────────────────────────────────

  _clampVelocity() {
    const maxSpeed = TERMINAL_VELOCITY / 2.237; // convert mph to m/s
    if (this.body.velocity.length() > maxSpeed) {
      this.body.velocity.normalize();
      this.body.velocity.scale(maxSpeed, this.body.velocity);
    }
  }

  // ─── Combat Interface ─────────────────────────────

  /**
   * Enter ragdoll state
   * @param {number} duration — seconds
   */
  enterRagdoll(duration) {
    const recoveryMult = this.species.ability?.ragdollRecoveryMultiplier ?? 1.0;
    this.isRagdoll = true;
    this.ragdollTimer = duration * recoveryMult;
  }

  /**
   * Apply structural damage
   * @param {number} amount
   */
  takeDamage(amount) {
    this.structuralIntegrity = Math.max(0, this.structuralIntegrity - amount);
  }
}
