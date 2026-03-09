/**
 * ═══════════════════════════════════════════════════════
 *  BIRD GAME 3 — Species Database (The Aviary)
 *  Every bird is a "Weight Class" with a unique math profile.
 * ═══════════════════════════════════════════════════════
 */

export const SPECIES = {
  pigeon: {
    id: 'pigeon',
    name: 'Common Pigeon',
    icon: '🐦',
    mass: 50,
    maxThrust: 60,
    dragCoefficient: 0.05,
    staminaRegen: 1.5,
    maxStamina: 100,
    structuralIntegrity: 100,
    wingArea: 1.0,          // normalized wing surface area
    hitboxScale: 1.0,
    ability: {
      name: 'Rapid Recovery',
      description: 'Faster Snap-Back from Ragdoll state.',
      ragdollRecoveryMultiplier: 0.4, // 60% faster recovery
    },
    description: 'The everyman. Forgiving flight model with fast ragdoll recovery.',
    color: 0x8899aa,
  },

  falcon: {
    id: 'falcon',
    name: 'Peregrine Falcon',
    icon: '🦅',
    mass: 30,
    maxThrust: 40,
    dragCoefficient: 0.01,
    staminaRegen: 0.8,
    maxStamina: 80,
    structuralIntegrity: 80,
    wingArea: 0.7,
    hitboxScale: 1.0,
    ability: {
      name: 'Aero-Tuck',
      description: 'Reduces hitbox size by 30% during dives.',
      diveHitboxMultiplier: 0.7,
    },
    description: 'The assassin. Lowest drag in the roster — built for terminal-velocity dives.',
    color: 0x334455,
  },

  eagle: {
    id: 'eagle',
    name: 'Golden Eagle',
    icon: '🦅',
    mass: 100,
    maxThrust: 30,
    dragCoefficient: 0.10,
    staminaRegen: 1.0,
    maxStamina: 120,
    structuralIntegrity: 150,
    wingArea: 1.5,
    hitboxScale: 1.3,
    ability: {
      name: 'Grip-Lock',
      description: 'Opponents cannot break a Clutch for 3 seconds.',
      gripLockDuration: 3.0,
    },
    description: 'The tank. Massive grip strength and structural integrity, but sluggish acceleration.',
    color: 0x997722,
  },

  hummingbird: {
    id: 'hummingbird',
    name: 'Hummingbird',
    icon: '🐤',
    mass: 5,
    maxThrust: 100,
    dragCoefficient: 0.02,
    staminaRegen: 0.5,
    maxStamina: 50,
    structuralIntegrity: 30,
    wingArea: 0.3,
    hitboxScale: 0.5,
    ability: {
      name: 'Reverse-Thrust',
      description: 'Instant backward momentum.',
      reverseThrustMultiplier: 1.0,
    },
    description: 'The glass cannon. Insane thrust but paper-thin integrity. Reverse on a dime.',
    color: 0x22ee88,
  },

  albatross: {
    id: 'albatross',
    name: 'Albatross',
    icon: '🕊️',
    mass: 70,
    maxThrust: 20,
    dragCoefficient: 0.03,
    staminaRegen: 2.0,
    maxStamina: 160,
    structuralIntegrity: 110,
    wingArea: 2.0,
    hitboxScale: 1.4,
    ability: {
      name: 'Dynamic Soaring',
      description: 'No altitude loss in wind zones.',
      windZoneLiftMultiplier: Infinity,
    },
    description: 'The marathon runner. Massive wings, endless stamina. Dominates wind zones.',
    color: 0xddddee,
  },

  owl: {
    id: 'owl',
    name: 'Great Horned Owl',
    icon: '🦉',
    mass: 50,
    maxThrust: 50,
    dragCoefficient: 0.06,
    staminaRegen: 1.0,
    maxStamina: 100,
    structuralIntegrity: 100,
    wingArea: 1.2,
    hitboxScale: 1.0,
    ability: {
      name: 'Silent Glide',
      description: 'Removes wind-whistle audio for stealth approaches.',
      silentGlide: true,
    },
    description: 'The assassin support. Silent flight lets you ambush unaware targets.',
    color: 0x664422,
  },

  dodo: {
    id: 'dodo',
    name: 'The Dodo',
    icon: '🦤',
    mass: 250,
    maxThrust: 5,
    dragCoefficient: 0.25,
    staminaRegen: 1.2,
    maxStamina: 200,
    structuralIntegrity: 300,
    wingArea: 0.4,          // tiny wings = "Negative Lift"
    hitboxScale: 1.8,
    negativeLift: true,     // must constantly flap to stay level
    screechImmune: true,    // immune to knockback from Screech
    ability: {
      name: 'Crushing Impact',
      description: 'One-hits any bird if landing from above.',
      crushingImpact: true,
      groundCharge: true,   // ram grounded birds like bowling pins
    },
    description: 'The juggernaut. Cannot fly well. Annihilates on impact from above.',
    color: 0x887766,
  },
};

/** Get a species by id */
export function getSpecies(id) {
  return SPECIES[id] ?? SPECIES.pigeon;
}

/** Get all species as an array */
export function getAllSpecies() {
  return Object.values(SPECIES);
}
