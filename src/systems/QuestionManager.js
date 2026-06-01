import questionsData from '../data/questions.json';

const MAX_QUESTIONS = 30;

const CATEGORY_BOOST = {
  evento: ['formalidad', 'evento'],
  formalidad: ['formalidad'],
  clima: ['clima'],
};

export default class QuestionManager {
  constructor() {
    this.allQuestions = questionsData.questions.slice(0, MAX_QUESTIONS);
    this.remaining = [...this.allQuestions];
    this.asked = [];
  }

  reset() {
    this.remaining = [...this.allQuestions];
    this.asked = [];
  }

  prioritizeByWeights(weights) {
    if (!weights || Object.keys(weights).length === 0) return;

    const boostCategories = new Set();
    for (const [key, value] of Object.entries(weights)) {
      if (value && value !== 0) {
        const cats = CATEGORY_BOOST[key];
        if (cats) cats.forEach(c => boostCategories.add(c));
      }
    }

    if (boostCategories.size === 0) return;

    this.remaining.sort((a, b) => {
      const aBoost = boostCategories.has(a.category) ? 1 : 0;
      const bBoost = boostCategories.has(b.category) ? 1 : 0;
      return bBoost - aBoost;
    });
  }

  getNextQuestion(answeredWeights) {
    if (this.remaining.length === 0) return null;

    this.prioritizeByWeights(answeredWeights);

    const next = this.remaining.shift();
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
