/**
 * ═══════════════════════════════════════════════════════
 *  BIRD GAME 3 — Environment Zones
 *  Thermals, Downdrafts, Water, Wind Tunnels, Hose.
 *  Each zone is an AABB trigger that applies forces
 *  to birds inside it.
 * ═══════════════════════════════════════════════════════
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {
  THERMAL_LIFT_FORCE,
  DOWNDRAFT_FORCE,
  WATER_DRAG_MULTIPLIER,
  WATER_OXYGEN_DRAIN,
  WIND_TUNNEL_SPEED_BOOST,
  HOSE_PHYSICS_WALL_FORCE,
} from './constants.js';

/**
 * @typedef {Object} Zone
 * @property {'thermal'|'downdraft'|'water'|'windTunnel'|'hose'} type
 * @property {THREE.Box3} bounds
 * @property {THREE.Vector3} [direction] — for directional zones (hose, wind tunnel)
 * @property {boolean} [active] — for togglable zones (hose)
 */

export class EnvironmentZones {
  constructor() {
    /** @type {Zone[]} */
    this.zones = [];
    /** @type {THREE.Mesh[]} */
    this.debugMeshes = []; // for visual debugging
  }

  /**
   * Add a thermal (rising air over BBQ / asphalt)
   */
  addThermal(position, size) {
    this.zones.push({
      type: 'thermal',
      bounds: new THREE.Box3(
        new THREE.Vector3(position.x - size.x / 2, position.y, position.z - size.z / 2),
        new THREE.Vector3(position.x + size.x / 2, position.y + size.y, position.z + size.z / 2),
      ),
    });
  }

  /**
   * Add a downdraft (AC exhaust, roof edges)
   */
  addDowndraft(position, size) {
    this.zones.push({
      type: 'downdraft',
      bounds: new THREE.Box3(
        new THREE.Vector3(position.x - size.x / 2, position.y - size.y, position.z - size.z / 2),
        new THREE.Vector3(position.x + size.x / 2, position.y, position.z + size.z / 2),
      ),
    });
  }

  /**
   * Add a water zone (the inflatable pool)
   */
  addWater(position, size) {
    this.zones.push({
      type: 'water',
      bounds: new THREE.Box3(
        new THREE.Vector3(position.x - size.x / 2, position.y, position.z - size.z / 2),
        new THREE.Vector3(position.x + size.x / 2, position.y + size.y, position.z + size.z / 2),
      ),
    });
  }

  /**
   * Add a wind tunnel (porch floorboard cracks)
   */
  addWindTunnel(position, size, direction) {
    this.zones.push({
      type: 'windTunnel',
      bounds: new THREE.Box3(
        new THREE.Vector3(position.x - size.x / 2, position.y - size.y / 2, position.z - size.z / 2),
        new THREE.Vector3(position.x + size.x / 2, position.y + size.y / 2, position.z + size.z / 2),
      ),
      direction: direction.clone().normalize(),
    });
  }

  /**
   * Add a garden hose stream
   */
  addHoseStream(position, size, direction, active = false) {
    this.zones.push({
      type: 'hose',
      bounds: new THREE.Box3(
        new THREE.Vector3(position.x - size.x / 2, position.y - size.y / 2, position.z - size.z / 2),
        new THREE.Vector3(position.x + size.x / 2, position.y + size.y / 2, position.z + size.z / 2),
      ),
      direction: direction.clone().normalize(),
      active,
    });
  }

  /**
   * Apply zone forces to a bird body each physics tick.
   * @param {CANNON.Body} body
   * @param {import('./flight.js').FlightController} ctrl
   * @param {number} dt
   */
  applyZoneEffects(body, ctrl, dt) {
    const pos = new THREE.Vector3(body.position.x, body.position.y, body.position.z);

    ctrl.isInWater = false;
    ctrl.isInThermal = false;
    ctrl.isInDowndraft = false;

    for (const zone of this.zones) {
      if (!zone.bounds.containsPoint(pos)) continue;

      switch (zone.type) {
        case 'thermal': {
          ctrl.isInThermal = true;
          // Albatross Dynamic Soaring: amplified lift
          const mult = ctrl.species.ability?.windZoneLiftMultiplier ?? 1;
          const force = mult === Infinity
            ? THERMAL_LIFT_FORCE * 3
            : THERMAL_LIFT_FORCE * mult;
          body.applyForce(new CANNON.Vec3(0, force, 0));
          break;
        }

        case 'downdraft': {
          ctrl.isInDowndraft = true;
          // Dodo is too heavy for screech knockback but NOT immune to downdrafts
          body.applyForce(new CANNON.Vec3(0, DOWNDRAFT_FORCE, 0));
          break;
        }

        case 'water': {
          ctrl.isInWater = true;
          // Massive drag stop
          const v = body.velocity;
          const dragForce = v.scale(-WATER_DRAG_MULTIPLIER);
          body.applyForce(dragForce);
          // Drain stamina as oxygen
          ctrl.stamina -= WATER_OXYGEN_DRAIN * dt;
          break;
        }

        case 'windTunnel': {
          // Boost in the tunnel direction
          const boost = new CANNON.Vec3(
            zone.direction.x * WIND_TUNNEL_SPEED_BOOST * ctrl.species.mass,
            zone.direction.y * WIND_TUNNEL_SPEED_BOOST * ctrl.species.mass,
            zone.direction.z * WIND_TUNNEL_SPEED_BOOST * ctrl.species.mass,
          );
          body.applyForce(boost);
          break;
        }

        case 'hose': {
          if (!zone.active) break; // dry hose = flyable pipe
          const hoseForce = new CANNON.Vec3(
            zone.direction.x * HOSE_PHYSICS_WALL_FORCE * ctrl.species.mass,
            zone.direction.y * HOSE_PHYSICS_WALL_FORCE * ctrl.species.mass,
            zone.direction.z * HOSE_PHYSICS_WALL_FORCE * ctrl.species.mass,
          );
          body.applyForce(hoseForce);
          break;
        }
      }
    }
  }
}
