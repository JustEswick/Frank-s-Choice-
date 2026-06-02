import garmentsData from '../data/garments.json';
import PersistenceManager from './PersistenceManager.js';

const CATEGORIES = ['superior', 'inferior', 'conjunto', 'calzado', 'accesorio', 'capa'];

const DEFAULT_WEIGHTS = {
  calor: 0,
  templado: 0.5,
  frio: 0,
  formalidad: 0.5,
  evento_tipo: null,
  color_grupo: null,
  tono: null,
  textura: null,
  conjunto_prefer: 0,
};

export default class RecommendationEngine {
  constructor() {
    this.garments = garmentsData.garments;
    this.weights = { ...DEFAULT_WEIGHTS };
    this.answerCount = 0;
  }

  reset() {
    this.weights = { ...DEFAULT_WEIGHTS };
    this.answerCount = 0;
  }

  addAnswer(answer) {
    const w = answer.weight || {};
    this.answerCount++;

    if (w.calor !== undefined) this.weights.calor = (this.weights.calor + w.calor) / 2;
    if (w.templado !== undefined) this.weights.templado = (this.weights.templado + w.templado) / 2;
    if (w.frio !== undefined) this.weights.frio = (this.weights.frio + w.frio) / 2;
    if (w.formalidad !== undefined) {
      this.weights.formalidad = (this.weights.formalidad + w.formalidad) / 2;
    }
    if (w.evento_tipo !== undefined) this.weights.evento_tipo = w.evento_tipo;
    if (w.color_grupo !== undefined) this.weights.color_grupo = w.color_grupo;
    if (w.tono !== undefined) this.weights.tono = w.tono;
    if (w.textura !== undefined) this.weights.textura = w.textura;
    if (w.conjunto_prefer !== undefined) {
      this.weights.conjunto_prefer = (this.weights.conjunto_prefer + w.conjunto_prefer) / 2;
    }
  }

  calculateGarmentScore(garment) {
    const tags = garment.tags;
    let score = 0;
    let factors = 0;

    const formalityDiff = Math.abs(this.weights.formalidad - tags.formalidad);
    score += (1 - formalityDiff);
    factors++;

    const tempScore = this._scoreClima(tags.clima);
    score += tempScore;
    factors++;

    if (this.weights.evento_tipo) {
      const eventoScore = tags.evento.includes(this.weights.evento_tipo) ? 1 : 0;
      score += eventoScore;
      factors++;
    }

    if (this.weights.color_grupo || this.weights.tono) {
      const colorScore = this._scoreColor(tags.colores);
      score += colorScore;
      factors++;
    }

    if (this.weights.textura) {
      const texturaScore = tags.textura.includes(this.weights.textura) ? 1 : 0;
      score += texturaScore;
      factors++;
    }

    if (garment.category === 'conjunto') {
      const conjuntoBoost = (this.weights.conjunto_prefer + 1) / 2;
      score += conjuntoBoost;
      factors++;
    } else if (garment.category === 'superior' || garment.category === 'inferior') {
      const piecePenalty = this.weights.conjunto_prefer > 0
        ? (1 - (this.weights.conjunto_prefer + 1) / 2) * 0.5
        : 0;
      score += piecePenalty;
      factors++;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  _scoreClima(climaTags) {
    let best = 0;
    if (this.weights.calor > 0 && climaTags.includes('calor')) {
      best = Math.max(best, this.weights.calor);
    }
    if (this.weights.templado > 0 && climaTags.includes('templado')) {
      best = Math.max(best, this.weights.templado);
    }
    if (this.weights.frio > 0 && climaTags.includes('frio')) {
      best = Math.max(best, this.weights.frio);
    }
    if (best === 0 && climaTags.length > 0) {
      const dominant = this._dominantTemp();
      if (climaTags.includes(dominant)) return 0.5;
      return 0.2;
    }
    return best;
  }

  _dominantTemp() {
    const { calor, templado, frio } = this.weights;
    if (calor >= templado && calor >= frio) return 'calor';
    if (frio >= calor && frio >= templado) return 'frio';
    return 'templado';
  }

  _scoreColor(colores) {
    const profile = PersistenceManager.getProfile();
    const preferred = profile.preferred_colors || [];
    if (preferred.length === 0) return 0.5;

    const matches = colores.filter(c => preferred.includes(c));
    return matches.length > 0 ? 0.8 + (matches.length / colores.length) * 0.2 : 0.3;
  }

  getRecommendations(count = 1) {
    const results = {};
    const allScored = [];

    for (const cat of CATEGORIES) {
      const catGarments = this.garments.filter(g => g.category === cat);
      const scored = catGarments.map(g => ({
        garment: g,
        category: cat,
        score: this.calculateGarmentScore(g),
      }));
      scored.sort((a, b) => b.score - a.score);
      allScored.push(...scored);
      results[cat] = scored.slice(0, count).map(s => s.garment);
    }

    const hasConjunto = results.conjunto && results.conjunto.length > 0
      && this.weights.conjunto_prefer >= 0;
    const hasSplitOutfit = (results.superior && results.superior.length > 0)
      && (results.inferior && results.inferior.length > 0)
      && this.weights.conjunto_prefer <= 0;

    if (hasConjunto && this.weights.conjunto_prefer > 0.3) {
      results.superior = [];
      results.inferior = [];
    } else if (hasSplitOutfit && this.weights.conjunto_prefer < -0.3) {
      results.conjunto = [];
    }

    return results;
  }

  getConfidence() {
    if (this.answerCount === 0) return 0;
    const factors = [this.weights.formalidad !== 0.5 ? 1 : 0];
    if (this.weights.evento_tipo) factors.push(1);
    if (this.weights.color_grupo) factors.push(1);
    if (this.weights.textura) factors.push(1);

    const tempConfidence = Math.abs(this.weights.calor - this.weights.frio);
    factors.push(tempConfidence);

    const sum = factors.reduce((a, b) => a + b, 0);
    return Math.min(1, sum / factors.length);
  }

  learnFromRound(playerOutfit, frankOutfit) {
    const profile = PersistenceManager.getProfile();

    for (const garmentId of playerOutfit) {
      if (!frankOutfit.includes(garmentId)) {
        const garment = this.garments.find(g => g.id === garmentId);
        if (garment) {
          const tags = garment.tags;
          if (tags.colores && tags.colores.length > 0) {
            const newColor = tags.colores[0];
            if (!profile.preferred_colors.includes(newColor)) {
              profile.preferred_colors.push(newColor);
            }
          }
          if (tags.textura && tags.textura.length > 0) {
            const newTexture = tags.textura[0];
            if (!profile.preferred_textures.includes(newTexture)) {
              profile.preferred_textures.push(newTexture);
            }
          }
        }
      }
    }

    PersistenceManager.saveProfile(profile);
    return profile;
  }
}
