/**
 * ═══════════════════════════════════════════════════════
 *  BIRD GAME 3 — HUD Manager
 *  Updates the on-screen HUD elements:
 *  Speed, Altitude, Stamina bar, Structural Integrity.
 * ═══════════════════════════════════════════════════════
 */

export class HUDManager {
  constructor() {
    this.container = document.getElementById('hud');
    this.speedVal = document.getElementById('hud-speed-val');
    this.altVal = document.getElementById('hud-altitude-val');
    this.staminaBar = document.getElementById('hud-stamina-bar');
    this.integrityVal = document.getElementById('hud-integrity-val');
  }

  show() {
    this.container.classList.add('active');
  }

  hide() {
    this.container.classList.remove('active');
  }

  /**
   * @param {import('../core/flight.js').FlightController} ctrl
   */
  update(ctrl) {
    // Speed
    const mph = Math.round(ctrl.speedMph);
    this.speedVal.textContent = mph;

    // Altitude
    this.altVal.textContent = Math.round(ctrl.altitude);

    // Stamina bar
    const staminaPct = ctrl.staminaFraction * 100;
    this.staminaBar.style.width = `${staminaPct}%`;

    // Color-code stamina
    if (staminaPct > 50) {
      this.staminaBar.style.background = 'linear-gradient(90deg, #00ff88, #ffe600)';
    } else if (staminaPct > 20) {
      this.staminaBar.style.background = 'linear-gradient(90deg, #ffe600, #ff6600)';
    } else {
      this.staminaBar.style.background = '#ff2200';
    }

    // Integrity
    const intPct = Math.round(ctrl.integrityFraction * 100);
    this.integrityVal.textContent = `${intPct}%`;
    if (intPct > 60) {
      this.integrityVal.style.color = '#00ff88';
    } else if (intPct > 30) {
      this.integrityVal.style.color = '#ffe600';
    } else {
      this.integrityVal.style.color = '#ff2200';
    }
  }
}
