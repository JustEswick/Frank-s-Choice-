import garmentsData from '../data/garments.json';
import PersistenceManager from './PersistenceManager.js';

const CATEGORIES = ['superior', 'inferior', 'conjunto', 'calzado', 'accesorio', 'capa'];

const DEFAULT_WEIGHTS = {
  calor: 0,
  templado: 0.5,
  frio: 0,
  formalidad: 0.5,
  evento_tipo: null,
  color_sup: null,
  color_inf: null,
  tono_sup: null,
  tono_inf: null,
  textura_sup: null,
  textura_inf: null,
  corte_inf: null,
  corte_calzado: null,
  usa_accesorio: null,
  usa_capa: null,
  conjunto_prefer: 0,
};

export default class RecommendationEngine {
  constructor() {
    this.garments = garmentsData.garments;
    this.weights = { ...DEFAULT_WEIGHTS };
    this.uncertainties = {
      calor: 1.0, templado: 1.0, frio: 1.0,
      formalidad: 1.0, conjunto_prefer: 1.0
    };
    this.answerCount = 0;
    this.liesCount = 0;
    this.isContradicting = false; // Initialize flag
    this.answeredVariables = new Set();
    
    this.debugLog = {
      answers: [],
      filterSteps: [],
      finalScores: {},
      fallbackTriggered: false
    };

    // Configurable Kalman parameters
    this.processNoise = 0.05; // Q: Natural decay of certainty
    this.baseMeasurementNoise = 0.5; // R_base: Baseline trust in answers
    this.lieThreshold = 0.6; // Innovation threshold to consider it a lie
    this.lieMultiplier = 8.0; // How much tension inflates measurement noise
  }

  reset() {
    this.weights = { ...DEFAULT_WEIGHTS };
    this.uncertainties = {
      calor: 1.0, templado: 1.0, frio: 1.0,
      formalidad: 1.0, conjunto_prefer: 1.0
    };
    this.answerCount = 0;
    this.liesCount = 0;
    this.isContradicting = false; // Reset flag
    this.answeredVariables = new Set();

    this.debugLog = {
      answers: [],
      filterSteps: [],
      finalScores: {},
      fallbackTriggered: false
    };
  }

  _updateKalman(key, measurement) {
    let isFirstTime = !this.answeredVariables.has(key);
    this.answeredVariables.add(key);

    // 1. Predicción
    let x_pred = this.weights[key];
    let p_pred = this.uncertainties[key] + this.processNoise;

    // 2. Tensión (Innovación)
    let y = measurement - x_pred;
    
    // 3. Ruido dinámico: Castiga las mentiras grandes
    let r_dynamic = this.baseMeasurementNoise + (y * y * this.lieMultiplier);

    // 4. Ganancia de Kalman
    let k = p_pred / (p_pred + r_dynamic);

    // 5. Actualización
    this.weights[key] = x_pred + k * y;
    this.uncertainties[key] = (1 - k) * p_pred;

    return isFirstTime ? 0 : Math.abs(y);
  }

  addAnswer(answer) {
    const w = answer.weight || {};
    this.answerCount++;
    this.debugLog.answers.push(w);

    let maxTension = 0;

    if (w.calor !== undefined) maxTension = Math.max(maxTension, this._updateKalman('calor', w.calor));
    if (w.templado !== undefined) maxTension = Math.max(maxTension, this._updateKalman('templado', w.templado));
    if (w.frio !== undefined) maxTension = Math.max(maxTension, this._updateKalman('frio', w.frio));
    if (w.formalidad !== undefined) maxTension = Math.max(maxTension, this._updateKalman('formalidad', w.formalidad));
    if (w.conjunto_prefer !== undefined) maxTension = Math.max(maxTension, this._updateKalman('conjunto_prefer', w.conjunto_prefer));

    // Categorical variables (Event, Color, Texture) don't use Kalman perfectly, 
    // but we can flag large shifts as lies if they completely change.
    if (w.evento_tipo !== undefined) {
      if (this.weights.evento_tipo && this.weights.evento_tipo !== w.evento_tipo) maxTension = Math.max(maxTension, 0.8);
      this.weights.evento_tipo = w.evento_tipo;
    }
    const vars = ['color_sup', 'color_inf', 'tono_sup', 'tono_inf', 'textura_sup', 'textura_inf', 'corte_inf', 'corte_calzado', 'usa_accesorio', 'usa_capa'];
    vars.forEach(v => {
      if (w[v] !== undefined) {
        if (this.weights[v] && this.weights[v] !== w[v]) maxTension = Math.max(maxTension, 0.8);
        this.weights[v] = w[v];
      }
    });

    let isLie = false;
    
    // Kalman Filter "Wake Up" Logic:
    const isMassiveLie = maxTension >= 0.8;
    const pastGracePeriod = this.answerCount > 3;

    // Check for Logical Contradictions (Hybrid Architecture)
    const strictResults = this._strictFilter(this.garments);
    const hasCoreItems = strictResults.some(g => g.category === 'conjunto') || 
                        (strictResults.some(g => g.category === 'superior') && strictResults.some(g => g.category === 'inferior'));
    
    // If strict filtering leaves us with no core clothing, it's a logical contradiction!
    if (!hasCoreItems) {
      this.liesCount++;
      isLie = true;
      this.isContradicting = true; // Flag to use Fallback mode
      this.debugLog.fallbackTriggered = true;
      console.log("❌ STRIKE DETECTED: Logical Contradiction (!hasCoreItems)");
      console.log(JSON.stringify(this.debugLog, null, 2));
    } else if (maxTension > this.lieThreshold && pastGracePeriod) {
      this.liesCount++;
      isLie = true;
      console.log(`❌ STRIKE DETECTED: High Tension (${maxTension})`);
      console.log(JSON.stringify(this.debugLog, null, 2));
    }
    
    // Always keep window variable updated
    window.frankDebugLog = this.debugLog;

    return {
      isLie,
      liesCount: this.liesCount,
      tension: maxTension
    };
  }

  _strictFilter(garments) {
    let filtered = [...garments];

    if (this.weights.conjunto_prefer > 0) {
      filtered = filtered.filter(g => g.category !== 'superior' && g.category !== 'inferior');
    } else if (this.weights.conjunto_prefer < 0) {
      filtered = filtered.filter(g => g.category !== 'conjunto');
    }

    const colorGroups = {
      frio: ['azul', 'verde', 'morado'],
      caliente: ['rojo', 'naranja', 'amarillo', 'rosa'],
      neutro: ['blanco', 'negro', 'gris', 'beige', 'cafe'],
      claro: ['blanco', 'beige', 'amarillo', 'rosa', 'azul claro'],
      oscuro: ['negro', 'gris', 'azul', 'cafe', 'morado'],
      natural: ['verde', 'cafe', 'beige']
    };

    if (this.weights.color_sup) {
      const isNegative = this.weights.color_sup.startsWith('-');
      const baseGroup = isNegative ? this.weights.color_sup.substring(1) : this.weights.color_sup;
      const allowedColors = colorGroups[baseGroup] || [];
      filtered = filtered.filter(g => {
        if (g.category !== 'superior' && g.category !== 'conjunto') return true;
        if (!g.tags.colores || g.tags.colores.length === 0) return true;
        const hasMatch = g.tags.colores.some(c => allowedColors.includes(c) || c === baseGroup);
        return isNegative ? !hasMatch : hasMatch;
      });
    }

    if (this.weights.color_inf) {
      const isNegative = this.weights.color_inf.startsWith('-');
      const baseGroup = isNegative ? this.weights.color_inf.substring(1) : this.weights.color_inf;
      const allowedColors = colorGroups[baseGroup] || [];
      filtered = filtered.filter(g => {
        if (g.category !== 'inferior' && g.category !== 'conjunto') return true;
        if (!g.tags.colores || g.tags.colores.length === 0) return true;
        const hasMatch = g.tags.colores.some(c => allowedColors.includes(c) || c === baseGroup);
        return isNegative ? !hasMatch : hasMatch;
      });
    }

    const domTemp = this._dominantTemp();
    if (this.weights[domTemp] > 0.8) {
      filtered = filtered.filter(g => {
        if (!g.tags.clima || g.tags.clima.length === 0) return true;
        return g.tags.clima.includes(domTemp);
      });
    }

    if (this.weights.formalidad > 0.8) {
      filtered = filtered.filter(g => g.tags.formalidad >= 0.7);
    } else if (this.weights.formalidad < 0.2) {
      filtered = filtered.filter(g => g.tags.formalidad <= 0.3);
    }

    if (this.weights.corte_inf) {
      filtered = filtered.filter(g => {
        if (g.category !== 'inferior') return true;
        if (!g.tags.corte) return true; 
        return g.tags.corte.includes(this.weights.corte_inf);
      });
    }

    if (this.weights.corte_calzado) {
      const backupCalzado = [...filtered];
      filtered = filtered.filter(g => {
        if (g.category !== 'calzado') return true;
        if (!g.tags.corte) return true;
        return g.tags.corte.includes(this.weights.corte_calzado);
      });
      if (!filtered.some(g => g.category === 'calzado')) {
        filtered = backupCalzado;
      }
    }

    if (this.weights.usa_accesorio === 'no') {
      filtered = filtered.filter(g => g.category !== 'accesorio');
    } else if (this.weights.usa_accesorio) {
      filtered = filtered.filter(g => {
        if (g.category !== 'accesorio') return true;
        return g.id === this.weights.usa_accesorio || this.weights.usa_accesorio === 'si';
      });
    }

    if (this.weights.usa_capa === 'no') {
      filtered = filtered.filter(g => g.category !== 'capa');
    }

    // Graceful Degradation for Texture: 
    // We apply texture strictly, but if it causes the outfit to break (because we lack that material in that color), we revert it!
    const backupFiltered = [...filtered];

    if (this.weights.textura_sup) {
      filtered = filtered.filter(g => {
        if (g.category !== 'superior' && g.category !== 'conjunto') return true;
        if (!g.tags.textura || g.tags.textura.length === 0) return true;
        return g.tags.textura.includes(this.weights.textura_sup);
      });
    }

    if (this.weights.textura_inf) {
      filtered = filtered.filter(g => {
        if (g.category !== 'inferior' && g.category !== 'conjunto') return true;
        if (!g.tags.textura || g.tags.textura.length === 0) return true;
        return g.tags.textura.includes(this.weights.textura_inf);
      });
    }

    const hasCore = filtered.some(g => g.category === 'conjunto') || 
                   (filtered.some(g => g.category === 'superior') && filtered.some(g => g.category === 'inferior'));
                   
    if (!hasCore) {
      filtered = backupFiltered; // Revert texture filter if it leaves the player naked!
    }

    return filtered;
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

    if (this.weights.color_sup || this.weights.tono_sup || this.weights.color_inf || this.weights.tono_inf) {
      const colorScore = this._scoreColor(tags.colores, garment.category);
      score += colorScore;
      factors++;
    }

    if (this.weights.textura_sup || this.weights.textura_inf) {
      let reqTexture = null;
      if (garment.category === 'superior' || garment.category === 'conjunto') reqTexture = this.weights.textura_sup;
      if (garment.category === 'inferior') reqTexture = this.weights.textura_inf;
      
      if (reqTexture) {
        const texturaScore = tags.textura.includes(reqTexture) ? 1 : 0;
        score += texturaScore;
        factors++;
      }
    }

    if (this.weights.conjunto_prefer !== 0) {
      if (garment.category === 'conjunto') {
        const conjuntoBoost = (this.weights.conjunto_prefer + 1) / 2;
        score += conjuntoBoost;
        factors++;
      } else if (garment.category === 'superior' || garment.category === 'inferior') {
        const pieceBoost = this.weights.conjunto_prefer < 0
          ? (Math.abs(this.weights.conjunto_prefer) + 1) / 2
          : 0;
        score += pieceBoost;
        factors++;
      }
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

  _scoreColor(colores, category) {
    if (!colores || colores.length === 0) return 0.5;

    let score = 0.5;

    // 1. History (Lower priority now)
    const profile = PersistenceManager.getProfile();
    const preferred = profile.preferred_colors || [];
    if (preferred.length > 0) {
      const matches = colores.filter(c => preferred.includes(c));
      if (matches.length > 0) score += 0.05; // Was 0.2, drastically lowered so it only acts as a tie-breaker
    }

    // 2. Current answers
    const colorGroups = {
      frio: ['azul', 'verde', 'morado'],
      caliente: ['rojo', 'naranja', 'amarillo', 'rosa'],
      neutro: ['blanco', 'negro', 'gris', 'beige', 'cafe'],
      claro: ['blanco', 'beige', 'amarillo', 'rosa', 'azul claro'],
      oscuro: ['negro', 'gris', 'azul', 'cafe', 'morado'],
      natural: ['verde', 'cafe', 'beige']
    };

    let w_color = null;
    let w_tono = null;
    
    if (category === 'superior' || category === 'conjunto') {
      w_color = this.weights.color_sup || this.weights.color_grupo; // fallback just in case
      w_tono = this.weights.tono_sup || this.weights.tono;
    } else if (category === 'inferior') {
      w_color = this.weights.color_inf || this.weights.color_grupo;
      w_tono = this.weights.tono_inf || this.weights.tono;
    } else {
      w_color = this.weights.color_sup || this.weights.color_grupo; // default to sup
      w_tono = this.weights.tono_sup || this.weights.tono;
    }

    if (w_color) {
      const groupColors = colorGroups[w_color] || [];
      const matches = colores.filter(c => groupColors.includes(c) || c === w_color);
      if (matches.length > 0) score += 0.3;
      else score -= 0.1;
    }

    if (w_tono) {
      const tonoColors = colorGroups[w_tono] || [];
      if (tonoColors.length > 0) {
        const matches = colores.filter(c => tonoColors.includes(c));
        if (matches.length > 0) score += 0.2;
      }
    }

    return Math.min(1.0, Math.max(0.0, score));
  }

  getRecommendations(count = 1) {
    const results = {};
    const allScored = [];

    // Phase 1: Try Strict Ontology Filtering
    let candidateGarments = this.isContradicting ? this.garments : this._strictFilter(this.garments);
    
    // If strict filter is empty or missing core parts, fallback to Bayesian (Phase 2)
    const hasCore = candidateGarments.some(g => g.category === 'conjunto') || 
                   (candidateGarments.some(g => g.category === 'superior') && candidateGarments.some(g => g.category === 'inferior'));
    if (!hasCore) {
      candidateGarments = this.garments; // Fallback!
      this.debugLog.fallbackTriggered = true;
    }

    this.debugLog.filterSteps.push({
      strictCandidatesCount: candidateGarments.length,
      strictCandidatesIds: candidateGarments.map(g => g.id),
      hasCore: hasCore,
      isContradicting: this.isContradicting
    });

    for (const cat of CATEGORIES) {
      const catGarments = candidateGarments.filter(g => g.category === cat);
      const scored = catGarments.map(g => ({
        garment: g,
        category: cat,
        score: this.calculateGarmentScore(g),
      }));
      scored.sort((a, b) => b.score - a.score);
      allScored.push(...scored);
      results[cat] = scored.slice(0, count).map(s => s.garment);
      this.debugLog.finalScores[cat] = scored.map(s => ({id: s.garment.id, score: s.score}));
    }

    const getScore = (list) => list && list.length > 0 ? allScored.find(s => s.garment.id === list[0].id).score : 0;
    const scoreConjunto = getScore(results.conjunto);
    const scoreSup = getScore(results.superior);
    const scoreInf = getScore(results.inferior);

    // Conjunto vs Separates: strictly mutually exclusive
    if (scoreConjunto > ((scoreSup + scoreInf) / 2)) {
      results.superior = [];
      results.inferior = [];
    } else {
      results.conjunto = [];
    }

    // Optional items (Capa, Accesorio): Only wear them if we are very confident
    const scoreCapa = getScore(results.capa);
    if (scoreCapa < 0.65) {
      results.capa = [];
    }

    const scoreAcc = getScore(results.accesorio);
    if (scoreAcc < 0.65) {
      results.accesorio = [];
    }
    
    // Dump dev log to console for easy extraction
    window.frankDebugLog = this.debugLog;
    console.log("=== DEV MODE: FRANK LOG ===");
    console.log(JSON.stringify(this.debugLog, null, 2));

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
