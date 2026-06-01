import PersistenceManager from '../systems/PersistenceManager.js';

const translations = {
  es: {
    loading: 'Cargando...',
    title: "Frank's Outfit Game",
    subtitle: 'Viste a Frank para la ocasión',
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
      capa: 'Capa'
    },
    frank_intro: '¡Hola! Soy Frank. ¡Vísteme para esta ocasión!',
    frank_confident: '¡Me siento genial con este outfit!',
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
      chaleco: 'Chaleco'
    }
  },
  en: {
    loading: 'Loading...',
    title: "Frank's Outfit Game",
    subtitle: 'Dress Frank for the occasion',
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
      capa: 'Layer'
    },
    frank_intro: "Hi! I'm Frank. Dress me for this occasion!",
    frank_confident: 'I feel great with this outfit!',
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
      chaleco: 'Vest'
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
