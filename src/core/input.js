/**
 * ═══════════════════════════════════════════════════════
 *  BIRD GAME 3 — Input Manager
 *  Captures keyboard + mouse (pointer lock) input and
 *  exposes a clean state object for the flight controller.
 * ═══════════════════════════════════════════════════════
 */

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.mouse = { dx: 0, dy: 0, left: false, right: false };
    this.pointerLocked = false;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
  }

  /** Request pointer lock on the canvas */
  requestPointerLock() {
    this.canvas.requestPointerLock();
  }

  /** Release pointer lock */
  exitPointerLock() {
    document.exitPointerLock();
  }

  /**
   * Returns the processed input state for FlightController.update()
   * Resets accumulated mouse deltas after read.
   */
  getFlightInput() {
    const sensitivity = 0.002;

    const input = {
      flap: this.keys['Space'] || this.keys['KeyW'] || false,
      tuck: this.keys['ShiftLeft'] || this.keys['ShiftRight'] || false,
      flare: this.keys['KeyQ'] || false,
      pitch: -this.mouse.dy * sensitivity * 60, // invert Y for natural feel
      yaw: -this.mouse.dx * sensitivity * 60,
      peck: this.mouse.left,
      grip: this.mouse.right,
      breakFree: this.keys['KeyE'] || false,
      reverseThrust: this.keys['KeyS'] || false,
    };

    // Reset mouse deltas
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    this.mouse.left = false;
    this.mouse.right = false;

    return input;
  }

  // ─── Event Handlers ───────────────────────────────

  _onKeyDown(e) {
    this.keys[e.code] = true;
  }

  _onKeyUp(e) {
    this.keys[e.code] = false;
  }

  _onMouseMove(e) {
    if (!this.pointerLocked) return;
    this.mouse.dx += e.movementX;
    this.mouse.dy += e.movementY;
  }

  _onMouseDown(e) {
    if (e.button === 0) this.mouse.left = true;
    if (e.button === 2) this.mouse.right = true;
  }

  _onMouseUp(e) {
    // handled via single-click flags
  }

  _onPointerLockChange() {
    this.pointerLocked = document.pointerLockElement === this.canvas;
  }

  /** Clean up all listeners */
  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
  }
}
