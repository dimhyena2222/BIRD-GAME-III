/**
 * ═══════════════════════════════════════════════════════
 *  BIRD GAME 3 — VFX Manager
 *  Handles chromatic aberration, tunnel vision, feather
 *  particle bursts, and thermal shimmer.
 * ═══════════════════════════════════════════════════════
 */

import {
  CHROMATIC_ABERRATION_SPEED,
  TUNNEL_VISION_SPEED,
} from '../core/constants.js';

export class VFXManager {
  constructor() {
    this.overlay = document.getElementById('vfx-overlay');
  }

  /**
   * Update visual effects based on player state
   * @param {number} speedMph
   */
  update(speedMph) {
    // Tunnel vision + chromatic aberration at terminal velocity
    if (speedMph >= TUNNEL_VISION_SPEED) {
      this.overlay.classList.add('active');
      // Intensity scales with excess speed
      const intensity = Math.min(1, (speedMph - TUNNEL_VISION_SPEED) / 50);
      this.overlay.style.background = `radial-gradient(ellipse at center, transparent ${40 - intensity * 20}%, rgba(0, 0, 0, ${0.6 + intensity * 0.3}) 100%)`;
    } else {
      this.overlay.classList.remove('active');
    }
  }
}
