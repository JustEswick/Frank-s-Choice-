import PersistenceManager from '../systems/PersistenceManager.js';

const translations = {
  es: {
    loading: 'Cargando...',
    title: "Frank's Tailored Lies",
    subtitle: 'Engaña al sastre y sobrevive al interrogatorio',
    play: 'Jugar',
    history: 'Historial',
    settings: 'Ajustes',
    language: 'Idioma',
    volume: 'Volumen',
    ready: 'Listo',
    back: 'Volver',
    play_again: 'Jugar de nuevo',
    score: 'Puntuación',
    round: 'Ronda',
    question_progress: '{current}/{total}',
    your_outfit: 'Tu outfit',
    frank_outfit: 'Outfit de Frank',
    similarity: 'Similitud',
    match: 'Coincidencia',
    mismatch: 'No coincide',
    categories: {
      superior: 'Superior',
      inferior: 'Inferior',
      calzado: 'Calzado',
      accesorio: 'Accesorio',
      capa: 'Capa',
      conjunto: 'Conjunto'
    },
    frank_intro: 'Soy Frank. Responderás mis preguntas y adivinaré tu outfit... ¡No intentes mentirme!',
    frank_confident: '¡Las matemáticas no mienten! Este es tu outfit.',
    no_history: 'No hay rondas anteriores',
    round_date: 'Fecha de la ronda',
    garment_names: {
      camisa_formal: 'Camisa Formal',
      camiseta: 'Camiseta',
      polo: 'Polo',
      blazer: 'Blazer',
      sueter: 'Suéter',
      pantalon_formal: 'Pantalón Formal',
      jeans: 'Jeans',
      bermudas: 'Bermudas',
      falda: 'Falda',
      pantalon_lino: 'Pantalón de Lino',
      zapatos_vestir: 'Zapatos de Vestir',
      mocasines: 'Mocasines',
      zapatillas: 'Zapatillas',
      sandalias: 'Sandalias',
      botas: 'Botas',
      corbata: 'Corbata',
      reloj: 'Reloj',
      gafas_sol: 'Gafas de Sol',
      abrigo: 'Abrigo',
      chaleco: 'Chaleco',
      vestido_formal: 'Vestido Formal',
      vestido_casual: 'Vestido Casual',
      blusa_seda: 'Blusa de Seda',
      blusa_casual: 'Blusa Casual',
      tacones_vestir: 'Tacones de Vestir',
      tacones_casual: 'Tacones Casuales'
    }
  },
  en: {
    loading: 'Loading...',
    title: "Frank's Tailored Lies",
    subtitle: 'Deceive the tailor and survive the interrogation',
    play: 'Play',
    history: 'History',
    settings: 'Settings',
    language: 'Language',
    volume: 'Volume',
    ready: 'Ready',
    back: 'Back',
    play_again: 'Play again',
    score: 'Score',
    round: 'Round',
    question_progress: '{current}/{total}',
    your_outfit: 'Your outfit',
    frank_outfit: "Frank's outfit",
    similarity: 'Similarity',
    match: 'Match',
    mismatch: 'Mismatch',
    categories: {
      superior: 'Top',
      inferior: 'Bottom',
      calzado: 'Footwear',
      accesorio: 'Accessory',
      capa: 'Layer',
      conjunto: 'Outfit Set'
    },
    frank_intro: "I'm Frank. Answer my questions and I'll guess your outfit... Don't try to lie to me!",
    frank_confident: "Math never lies! Here is your outfit.",
    no_history: 'No previous rounds',
    round_date: 'Round date',
    garment_names: {
      camisa_formal: 'Formal Shirt',
      camiseta: 'T-Shirt',
      polo: 'Polo Shirt',
      blazer: 'Blazer',
      sueter: 'Sweater',
      pantalon_formal: 'Dress Pants',
      jeans: 'Jeans',
      bermudas: 'Shorts',
      falda: 'Skirt',
      pantalon_lino: 'Linen Pants',
      zapatos_vestir: 'Dress Shoes',
      mocasines: 'Loafers',
      zapatillas: 'Sneakers',
      sandalias: 'Sandals',
      botas: 'Boots',
      corbata: 'Tie',
      reloj: 'Watch',
      gafas_sol: 'Sunglasses',
      abrigo: 'Coat',
      chaleco: 'Vest',
      vestido_formal: 'Formal Dress',
      vestido_casual: 'Casual Dress',
      blusa_seda: 'Silk Blouse',
      blusa_casual: 'Casual Blouse',
      tacones_vestir: 'Dress Heels',
      tacones_casual: 'Casual Heels'
    }
  }
};

let currentLang = PersistenceManager.getLanguage();

export function t(key) {
  const keys = key.split('.');
  let value = translations[currentLang];
  for (const k of keys) {
    if (value === undefined) return key;
    value = value[k];
  }
  if (typeof value !== 'string') return key;
  return value;
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (translations[lang]) {
    currentLang = lang;
    PersistenceManager.setLanguage(lang);
  }
}

export default { t, getLang, setLang };
