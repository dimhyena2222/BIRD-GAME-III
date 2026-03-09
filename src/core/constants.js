/**
 * ═══════════════════════════════════════════════════════
 *  BIRD GAME 3 — Constants & Tuning Parameters
 * ═══════════════════════════════════════════════════════
 */

// ─── World Scale ───
export const WORLD_SCALE = 100;            // 100:1 macro scale
export const GRAVITY = -9.81;             // m/s² (applied as -Y in cannon)
export const AIR_DENSITY = 1.225;         // kg/m³ standard atmosphere

// ─── Flight Physics ───
export const FLAP_IMPULSE_BASE = 12;      // base impulse per flap
export const FLAP_COOLDOWN = 0.15;        // seconds between flaps
export const GLIDE_LIFT_COEFFICIENT = 0.4;// CL for passive lift calculation
export const TUCK_DRAG_MULTIPLIER = 0.3;  // drag when wings tucked
export const FLARE_DRAG_MULTIPLIER = 3.0; // drag when wings flared (airbrake)
export const TURBULENCE_SPEED_THRESHOLD = 60; // speed above which turbulence kicks in
export const TURBULENCE_DRAG_BONUS = 0.08;// added drag in turbulence
export const TERMINAL_VELOCITY = 150;     // absolute max speed (mph)

// ─── Combat — Collision Matrix ───
export const VELOCITY_DELTA_THRESHOLD = 15;  // minimum Δv to trigger ragdoll
export const PECK_DASH_SPEED = 25;           // forward dash impulse for Peck
export const PECK_COOLDOWN = 0.8;            // seconds between pecks
export const PECK_PIERCE_VELOCITY = 80;      // above this speed, Peck bypasses mass
export const RAGDOLL_DURATION_BASE = 2.0;    // seconds of ragdoll
export const GRIP_BREAK_STAMINA_COST = 30;   // stamina to break a Clutch

// ─── Structural Integrity ───
export const DAMAGE_PER_DELTA_V = 2.5;       // integrity lost per unit of Δv
export const FEATHER_LOSS_THRESHOLD = 0.7;   // % integrity to start losing feathers
export const WIREFRAME_THRESHOLD = 0.3;      // % integrity to show wireframe layer
export const MEAT_THRESHOLD = 0.1;           // % integrity to show "meat" layer

// ─── Stamina ───
export const STAMINA_PER_FLAP = 5;           // stamina consumed per flap
export const STAMINA_PECK_COST = 15;         // stamina consumed per peck
export const STAMINA_GRIP_COST_PER_SEC = 10; // stamina drain while gripping

// ─── Environment ───
export const THERMAL_LIFT_FORCE = 18;        // +Y force in thermal zones
export const DOWNDRAFT_FORCE = -25;          // -Y force in downdraft zones
export const WATER_DRAG_MULTIPLIER = 20;     // massive drag in the pool
export const WATER_OXYGEN_DRAIN = 20;        // stamina/sec lost in water (oxygen)
export const WIND_TUNNEL_SPEED_BOOST = 1.5;  // multiplier inside porch cracks
export const HOSE_PHYSICS_WALL_FORCE = 40;   // force of active garden hose stream
export const SLIPSTREAM_DRAG_REDUCTION = 0.5;// 50% drag reduction when drafting
export const SLIPSTREAM_DISTANCE = 8;        // max distance for slipstream effect

// ─── Game Modes ───
export const GOLDEN_EGG_MASS = 60;
export const GOLDEN_EGG_CRACK_SPEED = 40;    // speed threshold to crack the egg on wall hit

export const APEX_PREDATOR_ZONE_RADIUS = 20;
export const APEX_PREDATOR_ZONE_SPEED = 5;   // zone movement speed

// ─── Audio / Phonk-Sync Thresholds (mph) ───
export const PHONK_TIER_AMBIENT = 20;
export const PHONK_TIER_COWBELL = 40;
export const PHONK_TIER_BASS = 80;
export const PHONK_TIER_TERMINAL = 100;

// ─── Visual FX ───
export const CHROMATIC_ABERRATION_SPEED = 100; // speed to trigger screen distortion
export const TUNNEL_VISION_SPEED = 100;
