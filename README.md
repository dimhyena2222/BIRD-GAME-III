# 🐦 BIRD GAME III — THE KINETIC ECONOMY

> *A physics-first avian combat simulator in a Macro-Scale universe. Phonk aesthetic. Newtonian momentum. Featherless ragdolls.*

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (LTS recommended)

### Install & Run
```bash
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

### Build for Production
```bash
npm run build
npm run preview
```

---

## 🎮 Controls

| Action | Key / Mouse |
|---|---|
| **Flap (Thrust)** | `Space` or `W` |
| **Tuck Wings** (reduce drag, dive faster) | `Shift` |
| **Flare Wings** (airbrake) | `Q` |
| **Reverse Thrust** (Hummingbird only) | `S` |
| **Steer** | Mouse movement (pointer lock) |
| **Kinetic Peck** | Left Click |
| **Talon-Clutch** | Right Click (on contact) |
| **Break Free** from Clutch | `E` |
| **Forfeit / Menu** | `Escape` |

---

## 🦅 The Aviary (Roster)

| Species | Mass | Thrust | Drag | Ability |
|---|---|---|---|---|
| **Pigeon** | 50 | 60 | 0.05 | Rapid Recovery |
| **Peregrine Falcon** | 30 | 40 | 0.01 | Aero-Tuck (30% smaller hitbox in dives) |
| **Golden Eagle** | 100 | 30 | 0.10 | Grip-Lock (3s unbreakable clutch) |
| **Hummingbird** | 5 | 100 | 0.02 | Reverse-Thrust |
| **Albatross** | 70 | 20 | 0.03 | Dynamic Soaring (free lift in wind) |
| **Great Horned Owl** | 50 | 50 | 0.06 | Silent Glide (stealth) |
| **The Dodo** | 250 | 5 | 0.25 | Crushing Impact (one-hit from above) |

---

## 🏗️ Project Structure

```
BIRD-GAME-III/
├── index.html              # Entry HTML with HUD overlay + menu
├── package.json
├── vite.config.js
├── public/                 # Static assets
└── src/
    ├── main.js             # Game loop, scene setup, orchestration
    ├── core/
    │   ├── constants.js    # All tuning parameters
    │   ├── flight.js       # "Vector-Vortex" flight physics
    │   ├── combat.js       # Collision Matrix, Peck, Clutch
    │   ├── physicsWorld.js # Cannon-es world wrapper
    │   ├── input.js        # Keyboard + mouse input manager
    │   └── environment.js  # Thermals, downdrafts, water, wind tunnels
    ├── data/
    │   └── species.js      # Full species database (The Aviary)
    ├── rendering/
    │   ├── birdMesh.js     # Bird mesh factory + plumage health layers
    │   └── vfx.js          # Chromatic aberration, tunnel vision
    ├── audio/
    │   └── phonkSync.js    # Procedural Phonk-Sync audio engine
    ├── ui/
    │   ├── hud.js          # Speed, altitude, stamina, integrity HUD
    │   └── menu.js         # Main menu + species select
    ├── world/
    │   └── backyard.js     # "The Giant's Backyard" world builder
    ├── modes/
    │   └── gameModes.js    # Golden Egg CTF, Apex Predator, Great Migration
    ├── progression/
    │   └── nest.js         # Bio-Mods, XP, Legacy Ascension
    └── styles/
        └── main.css        # Phonk-themed UI styles
```

---

## 🔧 Tech Stack

- **Three.js** — 3D rendering (WebGL)
- **Cannon-es** — Rigid-body physics (Newtonian momentum)
- **Vite** — Dev server & build tool
- **Web Audio API** — Procedural Phonk-Sync engine

---

## 📋 Design Reference

See the full Omni-Spec design document for:
- **The Kinetic Architecture** — Four-force flight model
- **The Collision Matrix** — Velocity-delta damage system
- **The Giant's Backyard** — Macro-scale environment design
- **Win-Condition Logic** — 3 game modes
- **Bio-Mods & Legacy Ascension** — Progression system
- **Phonk-Sync Engine** — Speed-reactive audio tiers
- **Plumage Health** — Geometry peeling damage visualization
