/**
 * ═══════════════════════════════════════════════════════
 *  BIRD GAME 3 — Nesting Progression & Bio-Mods
 *
 *  Players return to The Nest between matches to evolve.
 *  Bio-Mass Evolution + Legacy Ascension system.
 * ═══════════════════════════════════════════════════════
 */

/**
 * @typedef {Object} BioMod
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} maxLevel
 * @property {function(number): object} effect — returns stat modifiers for a given level
 */

/** @type {BioMod[]} */
export const BIO_MODS = [
  {
    id: 'boneDensity',
    name: 'Bone Density',
    description: 'Increases Mass (more collision damage) but increases Drag (harder to fly).',
    maxLevel: 5,
    effect(level) {
      return {
        massMultiplier: 1 + level * 0.1,       // +10% mass per level
        dragMultiplier: 1 + level * 0.05,       // +5% drag per level
      };
    },
  },
  {
    id: 'lungCapacity',
    name: 'Lung Capacity',
    description: 'Increases Stamina pool, letting you flap and fight longer.',
    maxLevel: 5,
    effect(level) {
      return {
        staminaBonus: level * 15, // +15 stamina per level
      };
    },
  },
  {
    id: 'visualCortex',
    name: 'Visual Cortex',
    description: 'Unlocks "Predator Vision" — highlights velocity vectors of nearby birds as colored arrows.',
    maxLevel: 3,
    effect(level) {
      return {
        predatorVisionRange: level * 20, // detection range in world units
        predatorVisionActive: level > 0,
      };
    },
  },
  {
    id: 'hollowBones',
    name: 'Hollow Bones',
    description: 'Reduces Mass for faster acceleration, but lowers Structural Integrity.',
    maxLevel: 5,
    effect(level) {
      return {
        massMultiplier: 1 - level * 0.08,       // -8% mass per level
        integrityMultiplier: 1 - level * 0.06,   // -6% integrity per level
      };
    },
  },
  {
    id: 'kerosinGlands',
    name: 'Kerosin Glands',
    description: 'Increases Thrust output at the cost of faster Stamina drain.',
    maxLevel: 4,
    effect(level) {
      return {
        thrustMultiplier: 1 + level * 0.12,     // +12% thrust per level
        staminaDrainMultiplier: 1 + level * 0.1, // +10% drain per level
      };
    },
  },
];

/**
 * Player's nest progression state
 */
export class NestProgression {
  constructor() {
    this.xp = 0;
    this.level = 1;
    this.maxLevel = 50;
    this.bioModLevels = {}; // modId → current level

    // Initialize all mods at level 0
    for (const mod of BIO_MODS) {
      this.bioModLevels[mod.id] = 0;
    }

    this.isLegacy = false;     // true after "Sacrifice" ascension
    this.opiumBirdUnlocked = false;
  }

  /**
   * XP needed for the next level
   */
  xpForNextLevel() {
    return Math.floor(100 * Math.pow(1.15, this.level));
  }

  /**
   * Add XP and check for level-ups
   */
  addXP(amount) {
    this.xp += amount;
    while (this.xp >= this.xpForNextLevel() && this.level < this.maxLevel) {
      this.xp -= this.xpForNextLevel();
      this.level++;
    }
  }

  /**
   * Invest a point into a bio-mod
   */
  upgradeMod(modId) {
    const mod = BIO_MODS.find((m) => m.id === modId);
    if (!mod) return false;

    const current = this.bioModLevels[modId] ?? 0;
    if (current >= mod.maxLevel) return false;

    this.bioModLevels[modId] = current + 1;
    return true;
  }

  /**
   * Get the combined stat modifiers from all active bio-mods.
   * Returns an object of multipliers/bonuses to apply to the species base stats.
   */
  getStatModifiers() {
    const mods = {
      massMultiplier: 1,
      dragMultiplier: 1,
      thrustMultiplier: 1,
      integrityMultiplier: 1,
      staminaBonus: 0,
      staminaDrainMultiplier: 1,
      predatorVisionActive: false,
      predatorVisionRange: 0,
    };

    for (const bioMod of BIO_MODS) {
      const level = this.bioModLevels[bioMod.id] ?? 0;
      if (level === 0) continue;

      const effect = bioMod.effect(level);
      for (const [key, val] of Object.entries(effect)) {
        if (key.endsWith('Multiplier') && typeof mods[key] === 'number') {
          mods[key] *= val;
        } else if (key.endsWith('Bonus') && typeof mods[key] === 'number') {
          mods[key] += val;
        } else if (typeof val === 'boolean') {
          mods[key] = mods[key] || val;
        } else if (typeof val === 'number' && typeof mods[key] === 'number') {
          mods[key] = Math.max(mods[key], val);
        }
      }
    }

    return mods;
  }

  /**
   * "Sacrifice" — Legacy Ascension
   * Resets level and unlocks the Opium Bird.
   */
  ascend() {
    if (this.level < this.maxLevel) return false;

    this.isLegacy = true;
    this.opiumBirdUnlocked = true;
    this.level = 1;
    this.xp = 0;
    // Keep bio-mod levels as a reward

    return true;
  }

  /**
   * Save to localStorage
   */
  save() {
    const data = {
      xp: this.xp,
      level: this.level,
      bioModLevels: this.bioModLevels,
      isLegacy: this.isLegacy,
      opiumBirdUnlocked: this.opiumBirdUnlocked,
    };
    localStorage.setItem('bg3_nest', JSON.stringify(data));
  }

  /**
   * Load from localStorage
   */
  load() {
    const raw = localStorage.getItem('bg3_nest');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      Object.assign(this, data);
    } catch {
      // corrupted save, ignore
    }
  }
}
