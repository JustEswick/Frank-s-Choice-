const KEYS = {
  profile: 'frank_profile',
  history: 'frank_history',
  lang: 'frank_lang',
};

const DEFAULT_PROFILE = {
  preferred_colors: [],
  preferred_textures: [],
  preferred_formality: 0.5,
  rounds_played: 0,
  avg_score: 0,
};

const MAX_HISTORY = 50;

export default class PersistenceManager {
  static getProfile() {
    try {
      const raw = localStorage.getItem(KEYS.profile);
      return raw ? JSON.parse(raw) : { ...DEFAULT_PROFILE };
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  }

  static saveProfile(profile) {
    localStorage.setItem(KEYS.profile, JSON.stringify(profile));
  }

  static updateProfile(roundResult) {
    const profile = this.getProfile();
    profile.rounds_played += 1;
    profile.avg_score =
      ((profile.avg_score * (profile.rounds_played - 1)) + roundResult.score) /
      profile.rounds_played;

    if (roundResult.color && !profile.preferred_colors.includes(roundResult.color)) {
      profile.preferred_colors.push(roundResult.color);
    }
    if (roundResult.texture && !profile.preferred_textures.includes(roundResult.texture)) {
      profile.preferred_textures.push(roundResult.texture);
    }

    this.saveProfile(profile);
    return profile;
  }

  static getHistory() {
    try {
      const raw = localStorage.getItem(KEYS.history);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static addRound(roundData) {
    const history = this.getHistory();
    history.unshift(roundData);
    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY;
    }
    localStorage.setItem(KEYS.history, JSON.stringify(history));
    return history;
  }

  static getLanguage() {
    return localStorage.getItem(KEYS.lang) || 'es';
  }

  static setLanguage(lang) {
    localStorage.setItem(KEYS.lang, lang);
  }

  static clearAll() {
    localStorage.removeItem(KEYS.profile);
    localStorage.removeItem(KEYS.history);
    localStorage.removeItem(KEYS.lang);
  }
}
