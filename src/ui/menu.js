/**
 * ═══════════════════════════════════════════════════════
 *  BIRD GAME 3 — Main Menu UI
 *  Species selection, game mode selection, and launch.
 * ═══════════════════════════════════════════════════════
 */

import { getAllSpecies } from '../data/species.js';

export class MenuManager {
  constructor(onLaunch) {
    this.menuEl = document.getElementById('main-menu');
    this.speciesSelectEl = document.getElementById('species-select');
    this.speciesGridEl = document.getElementById('species-grid');
    this.btnPlay = document.getElementById('btn-play');
    this.btnAviary = document.getElementById('btn-aviary');
    this.btnNest = document.getElementById('btn-nest');
    this.btnLaunch = document.getElementById('btn-launch');

    this.selectedSpecies = 'pigeon';
    this.onLaunch = onLaunch;

    this._buildSpeciesGrid();
    this._bindEvents();
  }

  _buildSpeciesGrid() {
    const species = getAllSpecies();
    this.speciesGridEl.innerHTML = '';

    for (const sp of species) {
      const card = document.createElement('div');
      card.className = 'species-card' + (sp.id === this.selectedSpecies ? ' selected' : '');
      card.dataset.speciesId = sp.id;
      card.innerHTML = `
        <span class="species-icon">${sp.icon}</span>
        <span class="species-name">${sp.name}</span>
        <span class="species-mass">${sp.mass} kg • Drag ${sp.dragCoefficient}</span>
      `;
      card.addEventListener('click', () => this._selectSpecies(sp.id));
      this.speciesGridEl.appendChild(card);
    }
  }

  _selectSpecies(id) {
    this.selectedSpecies = id;
    const cards = this.speciesGridEl.querySelectorAll('.species-card');
    cards.forEach((c) => c.classList.toggle('selected', c.dataset.speciesId === id));
  }

  _bindEvents() {
    this.btnPlay.addEventListener('click', () => {
      this.speciesSelectEl.classList.remove('hidden');
    });

    this.btnLaunch.addEventListener('click', () => {
      this.hide();
      this.onLaunch(this.selectedSpecies);
    });

    this.btnAviary.addEventListener('click', () => {
      // TODO: open aviary detail view
      this.speciesSelectEl.classList.remove('hidden');
    });

    this.btnNest.addEventListener('click', () => {
      // TODO: open nest/progression view
      console.log('[Nest] Coming soon — Bio-Mods & Legacy Ascension');
    });
  }

  show() {
    this.menuEl.classList.remove('hidden');
  }

  hide() {
    this.menuEl.classList.add('hidden');
  }
}
