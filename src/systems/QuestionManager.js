import questionsData from '../data/questions.json';

const MAX_QUESTIONS = 30;

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default class QuestionManager {
  constructor() {
    this.allQuestions = shuffleArray([...questionsData.questions]).slice(0, MAX_QUESTIONS);
    this.remaining = [...this.allQuestions];
    this.asked = [];
    this.bossPhase = false;
  }

  reset() {
    this.allQuestions = shuffleArray([...questionsData.questions]).slice(0, MAX_QUESTIONS);
    this.remaining = [...this.allQuestions];
    this.asked = [];
    this.bossPhase = false;
  }

  prioritizeByWeights(weights) {
    if (!weights) return;

    // Frank's Intelligence: He actively hunts for missing data
    const missingCategories = new Set();
    
    if (!weights.color_sup || !weights.color_inf) missingCategories.add('color');
    if (!weights.textura_sup || !weights.textura_inf) missingCategories.add('textura');
    if (!weights.corte_inf) missingCategories.add('corte');
    if (!weights.corte_calzado) missingCategories.add('corte_calzado');
    if (!weights.usa_accesorio) missingCategories.add('formalidad'); // accesorio question is in formalidad
    if (!weights.usa_capa) missingCategories.add('pref'); // capa question is in pref
    if (!weights.evento_tipo) missingCategories.add('evento');
    if (weights.calor === 0 && weights.frio === 0 && weights.templado === 0.5) missingCategories.add('clima');
    if (weights.formalidad === 0.5) missingCategories.add('formalidad');

    if (missingCategories.size > 0) {
      this.remaining.sort((a, b) => {
        const aBoost = missingCategories.has(a.category) ? 1 : 0;
        const bBoost = missingCategories.has(b.category) ? 1 : 0;
        return bBoost - aBoost;
      });
    }
  }

  getNextQuestion(weights, strikes = 0) {
    if (this.remaining.length === 0) {
      if (strikes > 0 && this.asked.length > 0) {
        this.bossPhase = true;
        this.remaining = shuffleArray([...this.asked]);
        this.asked = [];
      } else {
        return null;
      }
    }

    this.prioritizeByWeights(weights);

    let validQuestions = this.remaining;

    // Intelligence: Prevent asking redundant top/bottom questions if we already know that specific half!
    // UNLESS Frank is suspicious! If he has a strike, he will bypass filters to cross-examine.
    if (strikes === 0) {
      if (weights.color_sup) validQuestions = validQuestions.filter(q => !(q.category === 'color' && q.id.endsWith('_sup')));
      if (weights.color_inf) validQuestions = validQuestions.filter(q => !(q.category === 'color' && q.id.endsWith('_inf')));
      if (weights.textura_sup) validQuestions = validQuestions.filter(q => !(q.category === 'textura' && q.id.endsWith('_sup')));
      if (weights.textura_inf) validQuestions = validQuestions.filter(q => !(q.category === 'textura' && q.id.endsWith('_inf')));
      if (weights.corte_inf) validQuestions = validQuestions.filter(q => q.category !== 'corte' || q.id !== 'corte_01');
      if (weights.corte_calzado) validQuestions = validQuestions.filter(q => q.category !== 'corte' || q.id !== 'corte_calzado_01');
    }

    if (validQuestions.length === 0) {
      if (strikes > 0 && this.asked.length > 0) {
        this.bossPhase = true;
        this.remaining = shuffleArray([...this.asked]);
        this.asked = [];
        validQuestions = this.remaining;
      } else {
        return null;
      }
    }

    const next = validQuestions.shift();
    this.remaining = this.remaining.filter(q => q !== next);
    this.asked.push(next);
    return next;
  }

  getTotal() {
    return Math.min(this.allQuestions.length, MAX_QUESTIONS);
  }

  getAskedCount() {
    return this.asked.length;
  }

  getProgress() {
    return this.asked.length / this.getTotal();
  }
}
