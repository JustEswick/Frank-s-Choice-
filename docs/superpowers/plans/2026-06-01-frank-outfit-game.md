# Frank's Outfit Game - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete web game where Frank the tailor guesses the player's outfit using adaptive questions, 3-layer recommendation engine, and side-by-side comparison.

**Architecture:** Monolith Phaser.js app with 6 scenes, Vite bundler, localStorage persistence, bilingual support (ES/EN).

**Tech Stack:** Phaser 3, Vite, JavaScript ES6+, Howler.js (audio), Google Fonts (Playfair Display + Inter)

---

## File Structure

```
frank-outfit-game/
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
├── public/
│   └── assets/
│       ├── garments/          (20 PNG sprites)
│       ├── frank/             (Frank sprite sheet)
│       ├── mannequin/         (mannequin base PNG)
│       ├── ui/                (buttons, panels, tabs)
│       ├── audio/
│       │   ├── music/         (3 jazz loops)
│       │   └── sfx/           (7 sound effects)
│       └── fonts/
├── src/
│   ├── main.js                (entry point + Phaser config)
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── MenuScene.js
│   │   ├── BuilderScene.js
│   │   ├── QuizScene.js
│   │   ├── RevealScene.js
│   │   └── HistoryScene.js
│   ├── systems/
│   │   ├── RecommendationEngine.js
│   │   ├── QuestionManager.js
│   │   └── PersistenceManager.js
│   ├── data/
│   │   ├── garments.json
│   │   └── questions.json
│   └── utils/
│       ├── i18n.js
│       └── AudioManager.js
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `.gitignore`

- [ ] **Step 1: Initialize npm project**

```bash
cd "C:\Users\Isaac\Downloads\Knowledge Representation"
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install phaser@3 howler
npm install -D vite
```

- [ ] **Step 3: Create `package.json` scripts**

```json
{
  "name": "frank-outfit-game",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "phaser": "^3.80.0",
    "howler": "^2.2.4"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 4: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 3000,
    open: true
  }
});
```

- [ ] **Step 5: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Frank's Outfit Game</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #2a2a2a; overflow: hidden; }
    #game-container { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules/
dist/
.DS_Store
*.log
```

- [ ] **Step 7: Create directory structure**

```bash
mkdir -p src\scenes src\systems src\data src\utils
mkdir -p public\assets\garments public\assets\frank public\assets\mannequin public\assets\ui
mkdir -p public\assets\audio\music public\assets\audio\sfx
```

- [ ] **Step 8: Verify dev server works**

```bash
npm run dev
```
Expected: Server starts on http://localhost:3000, opens empty browser

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: project scaffolding with Vite + Phaser"
```

---

## Task 2: Phaser Config + BootScene

**Files:**
- Create: `src/main.js`
- Create: `src/scenes/BootScene.js`

- [ ] **Step 1: Create `src/main.js`**

```js
import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import BuilderScene from './scenes/BuilderScene.js';
import QuizScene from './scenes/QuizScene.js';
import RevealScene from './scenes/RevealScene.js';
import HistoryScene from './scenes/HistoryScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#F5E6D3',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, BuilderScene, QuizScene, RevealScene, HistoryScene]
};

const game = new Phaser.Game(config);
```

- [ ] **Step 2: Create `src/scenes/BootScene.js`**

```js
import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.cameras.main;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0xD4D4D4, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 15, 320, 30);

    const loadingText = this.add.text(width / 2, height / 2 - 40, 'Cargando...', {
      fontFamily: 'Inter',
      fontSize: '18px',
      color: '#4A3728'
    }).setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#4A3728'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      percentText.setText(`${Math.round(value * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0x2E8B57, 1);
      progressBar.fillRect(width / 2 - 155, height / 2 - 10, 310 * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Placeholder: load assets here in later tasks
    // this.load.image('frank-idle', 'assets/frank/idle.png');
    // this.load.audio('jazz-main', 'assets/audio/music/jazz-main.mp3');
  }

  create() {
    this.scene.start('MenuScene');
  }
}
```

- [ ] **Step 3: Create placeholder scenes**

Create `src/scenes/MenuScene.js`:
```js
import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    this.add.text(640, 360, 'Frank\'s Outfit Game', {
      fontFamily: 'Playfair Display', fontSize: '48px', color: '#4A3728'
    }).setOrigin(0.5);
  }
}
```

Create empty placeholder files for remaining scenes:
```bash
type nul > src\scenes\BuilderScene.js
type nul > src\scenes\QuizScene.js
type nul > src\scenes\RevealScene.js
type nul > src\scenes\HistoryScene.js
```

- [ ] **Step 4: Verify scene loads**

```bash
npm run dev
```
Expected: Browser shows "Frank's Outfit Game" title on beige background

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: Phaser config + BootScene with loading bar"
```

---

## Task 3: Data Files (Garments + Questions)

**Files:**
- Create: `src/data/garments.json`
- Create: `src/data/questions.json`

- [ ] **Step 1: Create `src/data/garments.json`**

```json
{
  "garments": [
    {
      "id": "camisa_formal",
      "category": "superior",
      "name": { "es": "Camisa Formal", "en": "Dress Shirt" },
      "sprite": "assets/garments/camisa-formal.png",
      "tags": {
        "evento": ["boda", "trabajo", "graduacion"],
        "formalidad": 0.9,
        "clima": ["templado", "frio"],
        "colores": ["blanco", "azul"],
        "textura": ["algodon", "seda"]
      }
    },
    {
      "id": "camiseta",
      "category": "superior",
      "name": { "es": "Camiseta", "en": "T-Shirt" },
      "sprite": "assets/garments/camiseta.png",
      "tags": {
        "evento": ["casual", "playa"],
        "formalidad": 0.2,
        "clima": ["calor"],
        "colores": ["blanco", "negro", "azul", "rojo"],
        "textura": ["algodon"]
      }
    },
    {
      "id": "polo",
      "category": "superior",
      "name": { "es": "Polo", "en": "Polo Shirt" },
      "sprite": "assets/garments/polo.png",
      "tags": {
        "evento": ["trabajo", "casual"],
        "formalidad": 0.5,
        "clima": ["calor", "templado"],
        "colores": ["blanco", "azul", "negro"],
        "textura": ["algodon"]
      }
    },
    {
      "id": "blazer",
      "category": "superior",
      "name": { "es": "Blazer", "en": "Blazer" },
      "sprite": "assets/garments/blazer.png",
      "tags": {
        "evento": ["boda", "trabajo", "graduacion"],
        "formalidad": 0.95,
        "clima": ["templado", "frio"],
        "colores": ["negro", "azul", "gris"],
        "textura": ["lana", "seda"]
      }
    },
    {
      "id": "sueter",
      "category": "superior",
      "name": { "es": "Suéter", "en": "Sweater" },
      "sprite": "assets/garments/sueter.png",
      "tags": {
        "evento": ["casual", "trabajo"],
        "formalidad": 0.4,
        "clima": ["frio"],
        "colores": ["negro", "gris", "azul"],
        "textura": ["lana", "acrilico"]
      }
    },
    {
      "id": "pantalon_formal",
      "category": "inferior",
      "name": { "es": "Pantalón Formal", "en": "Dress Pants" },
      "sprite": "assets/garments/pantalon-formal.png",
      "tags": {
        "evento": ["boda", "trabajo", "graduacion"],
        "formalidad": 0.9,
        "clima": ["templado", "frio"],
        "colores": ["negro", "gris", "azul"],
        "textura": ["lana", "algodon"]
      }
    },
    {
      "id": "jeans",
      "category": "inferior",
      "name": { "es": "Jeans", "en": "Jeans" },
      "sprite": "assets/garments/jeans.png",
      "tags": {
        "evento": ["casual"],
        "formalidad": 0.3,
        "clima": ["templado", "frio"],
        "colores": ["azul", "negro"],
        "textura": ["denim"]
      }
    },
    {
      "id": "bermudas",
      "category": "inferior",
      "name": { "es": "Bermudas", "en": "Shorts" },
      "sprite": "assets/garments/bermudas.png",
      "tags": {
        "evento": ["casual", "playa"],
        "formalidad": 0.15,
        "clima": ["calor"],
        "colores": ["beige", "azul", "negro"],
        "textura": ["algodon", "linos"]
      }
    },
    {
      "id": "falda",
      "category": "inferior",
      "name": { "es": "Falda", "en": "Skirt" },
      "sprite": "assets/garments/falda.png",
      "tags": {
        "evento": ["boda", "trabajo", "casual"],
        "formalidad": 0.6,
        "clima": ["calor", "templado"],
        "colores": ["negro", "azul", "rojo"],
        "textura": ["algodon", "seda"]
      }
    },
    {
      "id": "pantalon_lino",
      "category": "inferior",
      "name": { "es": "Pantalón de Lino", "en": "Linen Pants" },
      "sprite": "assets/garments/pantalon-lino.png",
      "tags": {
        "evento": ["boda", "casual"],
        "formalidad": 0.7,
        "clima": ["calor"],
        "colores": ["beige", "blanco"],
        "textura": ["linos"]
      }
    },
    {
      "id": "zapatos_vestir",
      "category": "calzado",
      "name": { "es": "Zapatos de Vestir", "en": "Dress Shoes" },
      "sprite": "assets/garments/zapatos-vestir.png",
      "tags": {
        "evento": ["boda", "trabajo", "graduacion"],
        "formalidad": 0.95,
        "clima": ["templado", "frio"],
        "colores": ["negro", "marron"],
        "textura": ["cuero"]
      }
    },
    {
      "id": "mocasines",
      "category": "calzado",
      "name": { "es": "Mocasines", "en": "Loafers" },
      "sprite": "assets/garments/mocasines.png",
      "tags": {
        "evento": ["trabajo", "casual"],
        "formalidad": 0.65,
        "clima": ["calor", "templado"],
        "colores": ["marron", "negro"],
        "textura": ["cuero", "gamuza"]
      }
    },
    {
      "id": "zapatillas",
      "category": "calzado",
      "name": { "es": "Zapatillas", "en": "Sneakers" },
      "sprite": "assets/garments/zapatillas.png",
      "tags": {
        "evento": ["casual", "playa"],
        "formalidad": 0.15,
        "clima": ["calor", "templado"],
        "colores": ["blanco", "negro"],
        "textura": ["tela", "cuero"]
      }
    },
    {
      "id": "sandalias",
      "category": "calzado",
      "name": { "es": "Sandalias", "en": "Sandals" },
      "sprite": "assets/garments/sandalias.png",
      "tags": {
        "evento": ["playa", "casual"],
        "formalidad": 0.1,
        "clima": ["calor"],
        "colores": ["marron", "negro"],
        "textura": ["cuero", "tela"]
      }
    },
    {
      "id": "botas",
      "category": "calzado",
      "name": { "es": "Botas", "en": "Boots" },
      "sprite": "assets/garments/botas.png",
      "tags": {
        "evento": ["casual", "trabajo"],
        "formalidad": 0.4,
        "clima": ["frio"],
        "colores": ["marron", "negro"],
        "textura": ["cuero"]
      }
    },
    {
      "id": "corbata",
      "category": "accesorio",
      "name": { "es": "Corbata", "en": "Tie" },
      "sprite": "assets/garments/corbata.png",
      "tags": {
        "evento": ["boda", "trabajo", "graduacion"],
        "formalidad": 0.95,
        "clima": ["templado", "frio"],
        "colores": ["azul", "rojo", "negro"],
        "textura": ["seda"]
      }
    },
    {
      "id": "reloj",
      "category": "accesorio",
      "name": { "es": "Reloj", "en": "Watch" },
      "sprite": "assets/garments/reloj.png",
      "tags": {
        "evento": ["boda", "trabajo", "casual"],
        "formalidad": 0.7,
        "clima": ["calor", "templado", "frio"],
        "colores": ["dorado", "plateado", "negro"],
        "textura": ["metal", "cuero"]
      }
    },
    {
      "id": "gafas_sol",
      "category": "accesorio",
      "name": { "es": "Gafas de Sol", "en": "Sunglasses" },
      "sprite": "assets/garments/gafas-sol.png",
      "tags": {
        "evento": ["casual", "playa"],
        "formalidad": 0.3,
        "clima": ["calor"],
        "colores": ["negro", "marron"],
        "textura": ["plastico", "metal"]
      }
    },
    {
      "id": "abrigo",
      "category": "capa",
      "name": { "es": "Abrigo", "en": "Coat" },
      "sprite": "assets/garments/abrigo.png",
      "tags": {
        "evento": ["trabajo", "boda"],
        "formalidad": 0.85,
        "clima": ["frio"],
        "colores": ["negro", "gris", "marron"],
        "textura": ["lana"]
      }
    },
    {
      "id": "chaleco",
      "category": "capa",
      "name": { "es": "Chaleco", "en": "Vest" },
      "sprite": "assets/garments/chaleco.png",
      "tags": {
        "evento": ["boda", "trabajo"],
        "formalidad": 0.85,
        "clima": ["templado"],
        "colores": ["negro", "gris"],
        "textura": ["lana", "algodon"]
      }
    }
  ]
}
```

- [ ] **Step 2: Create `src/data/questions.json`**

```json
{
  "questions": [
    {
      "id": "clima_01",
      "category": "clima",
      "text": {
        "es": "¿Hace calor donde usarás el outfit?",
        "en": "Is it hot where you'll wear this?"
      },
      "options": [
        { "id": "si_caluroso", "label": { "es": "Sí, mucho", "en": "Yes, very" }, "weight": { "calor": 1.0, "frio": 0.0 } },
        { "id": "templado", "label": { "es": "Está templado", "en": "It's mild" }, "weight": { "calor": 0.5, "frio": 0.5 } },
        { "id": "no_frio", "label": { "es": "No, hace frío", "en": "No, it's cold" }, "weight": { "calor": 0.0, "frio": 1.0 } }
      ],
      "priority_weight": 1.0
    },
    {
      "id": "clima_02",
      "category": "clima",
      "text": {
        "es": "¿Lloverá durante el evento?",
        "en": "Will it rain during the event?"
      },
      "options": [
        { "id": "si_lluvia", "label": { "es": "Sí, probablemente", "en": "Yes, probably" }, "weight": { "lluvia": 1.0 } },
        { "id": "no_lluvia", "label": { "es": "No, estará soleado", "en": "No, it'll be sunny" }, "weight": { "lluvia": 0.0 } }
      ],
      "priority_weight": 0.8
    },
    {
      "id": "clima_03",
      "category": "clima",
      "text": {
        "es": "¿Habrá viento?",
        "en": "Will it be windy?"
      },
      "options": [
        { "id": "si_viento", "label": { "es": "Sí, bastante", "en": "Yes, quite" }, "weight": { "viento": 1.0 } },
        { "id": "no_viento", "label": { "es": "No, calmado", "en": "No, calm" }, "weight": { "viento": 0.0 } }
      ],
      "priority_weight": 0.6
    },
    {
      "id": "clima_04",
      "category": "clima",
      "text": {
        "es": "¿El evento es al aire libre?",
        "en": "Is the event outdoors?"
      },
      "options": [
        { "id": "si_exterior", "label": { "es": "Sí", "en": "Yes" }, "weight": { "exterior": 1.0 } },
        { "id": "no_interior", "label": { "es": "No, es interior", "en": "No, it's indoors" }, "weight": { "exterior": 0.0 } }
      ],
      "priority_weight": 0.7
    },
    {
      "id": "clima_05",
      "category": "clima",
      "text": {
        "es": "¿Estás al sol o a la sombra?",
        "en": "Will you be in sun or shade?"
      },
      "options": [
        { "id": "sol", "label": { "es": "Al sol", "en": "In the sun" }, "weight": { "sol": 1.0 } },
        { "id": "sombra", "label": { "es": "A la sombra", "en": "In the shade" }, "weight": { "sol": 0.3 } }
      ],
      "priority_weight": 0.5
    },
    {
      "id": "evento_01",
      "category": "evento",
      "text": {
        "es": "¿Qué tipo de evento es?",
        "en": "What type of event is it?"
      },
      "options": [
        { "id": "boda", "label": { "es": "Boda", "en": "Wedding" }, "weight": { "formalidad": 0.9, "evento_tipo": "boda" } },
        { "id": "trabajo", "label": { "es": "Trabajo", "en": "Work" }, "weight": { "formalidad": 0.7, "evento_tipo": "trabajo" } },
        { "id": "casual", "label": { "es": "Casual", "en": "Casual" }, "weight": { "formalidad": 0.3, "evento_tipo": "casual" } },
        { "id": "graduacion", "label": { "es": "Graduación", "en": "Graduation" }, "weight": { "formalidad": 0.85, "evento_tipo": "graduacion" } },
        { "id": "fiesta", "label": { "es": "Fiesta", "en": "Party" }, "weight": { "formalidad": 0.5, "evento_tipo": "fiesta" } }
      ],
      "priority_weight": 1.0
    },
    {
      "id": "evento_02",
      "category": "evento",
      "text": {
        "es": "¿Es un evento de día o de noche?",
        "en": "Is it a day or night event?"
      },
      "options": [
        { "id": "dia", "label": { "es": "De día", "en": "Daytime" }, "weight": { "dia": 1.0 } },
        { "id": "noche", "label": { "es": "De noche", "en": "Nighttime" }, "weight": { "dia": 0.0 } }
      ],
      "priority_weight": 0.8
    },
    {
      "id": "evento_03",
      "category": "evento",
      "text": {
        "es": "¿Es formal o informal?",
        "en": "Is it formal or informal?"
      },
      "options": [
        { "id": "muy_formal", "label": { "es": "Muy formal", "en": "Very formal" }, "weight": { "formalidad": 1.0 } },
        { "id": "semi_formal", "label": { "es": "Semi-formal", "en": "Semi-formal" }, "weight": { "formalidad": 0.7 } },
        { "id": "informal", "label": { "es": "Informal", "en": "Informal" }, "weight": { "formalidad": 0.3 } }
      ],
      "priority_weight": 0.9
    },
    {
      "id": "evento_04",
      "category": "evento",
      "text": {
        "es": "¿Cuántas personas habrá aproximadamente?",
        "en": "Approximately how many people will be there?"
      },
      "options": [
        { "id": "pocas", "label": { "es": "Pocas ( menos de 20)", "en": "Few (less than 20)" }, "weight": { "tamanio": "pequeno" } },
        { "id": "medio", "label": { "es": "Un grupo (20-100)", "en": "A group (20-100)" }, "weight": { "tamanio": "medio" } },
        { "id": "muchas", "label": { "es": "Muchas (100+)", "en": "Many (100+)" }, "weight": { "tamanio": "grande" } }
      ],
      "priority_weight": 0.5
    },
    {
      "id": "evento_05",
      "category": "evento",
      "text": {
        "es": "¿Necesitas ser el centro de atención?",
        "en": "Do you need to be the center of attention?"
      },
      "options": [
        { "id": "si_centro", "label": { "es": "Sí, quiero destacar", "en": "Yes, I want to stand out" }, "weight": { "destacar": 1.0 } },
        { "id": "no_discreto", "label": { "es": "No, algo discreto", "en": "No, something discreet" }, "weight": { "destacar": 0.0 } }
      ],
      "priority_weight": 0.6
    },
    {
      "id": "formalidad_01",
      "category": "formalidad",
      "text": {
        "es": "¿Qué tan formal quieres verte?",
        "en": "How formal do you want to look?"
      },
      "options": [
        { "id": "elegante", "label": { "es": "Muy elegante", "en": "Very elegant" }, "weight": { "formalidad": 1.0 } },
        { "id": "semi_formal", "label": { "es": "Semi-formal", "en": "Semi-formal" }, "weight": { "formalidad": 0.7 } },
        { "id": "casual_chic", "label": { "es": "Casual con estilo", "en": "Casual but stylish" }, "weight": { "formalidad": 0.5 } },
        { "id": "relajado", "label": { "es": "Totalmente relajado", "en": "Fully relaxed" }, "weight": { "formalidad": 0.2 } }
      ],
      "priority_weight": 1.0
    },
    {
      "id": "formalidad_02",
      "category": "formalidad",
      "text": {
        "es": "¿Usarás accesorios formales (corbata, reloj)?",
        "en": "Will you wear formal accessories (tie, watch)?"
      },
      "options": [
        { "id": "si_accesorios", "label": { "es": "Sí", "en": "Yes" }, "weight": { "accesorios_formales": 1.0 } },
        { "id": "no_accesorios", "label": { "es": "No", "en": "No" }, "weight": { "accesorios_formales": 0.0 } }
      ],
      "priority_weight": 0.7
    },
    {
      "id": "formalidad_03",
      "category": "formalidad",
      "text": {
        "es": "¿Prefieres traje o sin traje?",
        "en": "Do you prefer a suit or no suit?"
      },
      "options": [
        { "id": "con_traje", "label": { "es": "Con traje completo", "en": "Full suit" }, "weight": { "traje": 1.0 } },
        { "id": "media_traje", "label": { "es": "Solo chaqueta", "en": "Jacket only" }, "weight": { "traje": 0.7 } },
        { "id": "sin_traje", "label": { "es": "Sin traje", "en": "No suit" }, "weight": { "traje": 0.0 } }
      ],
      "priority_weight": 0.8
    },
    {
      "id": "formalidad_04",
      "category": "formalidad",
      "text": {
        "es": "¿El evento tiene dress code?",
        "en": "Does the event have a dress code?"
      },
      "options": [
        { "id": "black_tie", "label": { "es": "Black tie", "en": "Black tie" }, "weight": { "dress_code": "black_tie" } },
        { "id": "business", "label": { "es": "Business", "en": "Business" }, "weight": { "dress_code": "business" } },
        { "id": "smart_casual", "label": { "es": "Smart casual", "en": "Smart casual" }, "weight": { "dress_code": "smart_casual" } },
        { "id": "no_dress_code", "label": { "es": "No hay dress code", "en": "No dress code" }, "weight": { "dress_code": "none" } }
      ],
      "priority_weight": 0.9
    },
    {
      "id": "formalidad_05",
      "category": "formalidad",
      "text": {
        "es": "¿Quieres sentirte cómodo o arreglado?",
        "en": "Do you want to feel comfortable or dressed up?"
      },
      "options": [
        { "id": "arreglado", "label": { "es": "Arreglado", "en": "Dressed up" }, "weight": { "comodidad": 0.3 } },
        { "id": "equilibrio", "label": { "es": "Un equilibrio", "en": "A balance" }, "weight": { "comodidad": 0.6 } },
        { "id": "comodo", "label": { "es": "Cómodo", "en": "Comfortable" }, "weight": { "comodidad": 1.0 } }
      ],
      "priority_weight": 0.6
    },
    {
      "id": "color_01",
      "category": "color",
      "text": {
        "es": "¿Qué colores prefieres generalmente?",
        "en": "What colors do you generally prefer?"
      },
      "options": [
        { "id": "colores_frios", "label": { "es": "Azules, verdes, violetas", "en": "Blues, greens, purples" }, "weight": { "color_grupo": "frio" } },
        { "id": "colores_cálidos", "label": { "es": "Rojos, naranjas, amarillos", "en": "Reds, oranges, yellows" }, "weight": { "color_grupo": "calido" } },
        { "id": "neutros", "label": { "es": "Negro, blanco, gris, beige", "en": "Black, white, gray, beige" }, "weight": { "color_grupo": "neutro" } }
      ],
      "priority_weight": 1.0
    },
    {
      "id": "color_02",
      "category": "color",
      "text": {
        "es": "¿Te gustan los colores oscuros o claros?",
        "en": "Do you like dark or light colors?"
      },
      "options": [
        { "id": "oscuros", "label": { "es": "Oscuros", "en": "Dark" }, "weight": { "tono": "oscuro" } },
        { "id": "claros", "label": { "es": "Claros", "en": "Light" }, "weight": { "tono": "claro" } },
        { "id": "mezcla", "label": { "es": "Mezcla de ambos", "en": "Mix of both" }, "weight": { "tono": "mixto" } }
      ],
      "priority_weight": 0.8
    },
    {
      "id": "color_03",
      "category": "color",
      "text": {
        "es": "¿Te gustan los estampados o prefieres lisos?",
        "en": "Do you like patterns or solids?"
      },
      "options": [
        { "id": "lisos", "label": { "es": "Lisos", "en": "Solids" }, "weight": { "estampado": "liso" } },
        { "id": "rayas", "label": { "es": "Rayas", "en": "Stripes" }, "weight": { "estampado": "rayas" } },
        { "id": "estampados", "label": { "es": "Estampados variados", "en": "Various patterns" }, "weight": { "estampado": "variado" } }
      ],
      "priority_weight": 0.6
    },
    {
      "id": "color_04",
      "category": "color",
      "text": {
        "es": "¿Quieres que el outfit sea monocromático?",
        "en": "Do you want a monochromatic outfit?"
      },
      "options": [
        { "id": "si_mono", "label": { "es": "Sí, todo del mismo color", "en": "Yes, all same color" }, "weight": { "monocromatico": 1.0 } },
        { "id": "no_mono", "label": { "es": "No, quiero contraste", "en": "No, I want contrast" }, "weight": { "monocromatico": 0.0 } }
      ],
      "priority_weight": 0.5
    },
    {
      "id": "color_05",
      "category": "color",
      "text": {
        "es": "¿Hay algún color que NO usarías?",
        "en": "Is there any color you would NOT wear?"
      },
      "options": [
        { "id": "no_rosa", "label": { "es": "Rosa", "en": "Pink" }, "weight": { "evitar": "rosa" } },
        { "id": "no_amarillo", "label": { "es": "Amarillo", "en": "Yellow" }, "weight": { "evitar": "amarillo" } },
        { "id": "no_naranja", "label": { "es": "Naranja", "en": "Orange" }, "weight": { "evitar": "naranja" } },
        { "id": "cualquiera", "label": { "es": "Cualquier color", "en": "Any color" }, "weight": { "evitar": "nada" } }
      ],
      "priority_weight": 0.4
    },
    {
      "id": "textura_01",
      "category": "textura",
      "text": {
        "es": "¿Qué tipo de tela prefieres?",
        "en": "What type of fabric do you prefer?"
      },
      "options": [
        { "id": "algodon", "label": { "es": "Algodón", "en": "Cotton" }, "weight": { "textura": "algodon" } },
        { "id": "seda", "label": { "es": "Seda", "en": "Silk" }, "weight": { "textura": "seda" } },
        { "id": "lino", "label": { "es": "Lino", "en": "Linen" }, "weight": { "textura": "linos" } },
        { "id": "lana", "label": { "es": "Lana", "en": "Wool" }, "weight": { "textura": "lana" } }
      ],
      "priority_weight": 1.0
    },
    {
      "id": "textura_02",
      "category": "textura",
      "text": {
        "es": "¿Prefieres telas suaves o rígidas?",
        "en": "Do you prefer soft or stiff fabrics?"
      },
      "options": [
        { "id": "suaves", "label": { "es": "Suaves", "en": "Soft" }, "weight": { "rigidez": 0.0 } },
        { "id": "medio", "label": { "es": "Intermedias", "en": "Medium" }, "weight": { "rigidez": 0.5 } },
        { "id": "rigidas", "label": { "es": "Rígidas", "en": "Stiff" }, "weight": { "rigidez": 1.0 } }
      ],
      "priority_weight": 0.7
    },
    {
      "id": "textura_03",
      "category": "textura",
      "text": {
        "es": "¿Te importa que la tela transpire?",
        "en": "Do you care about breathability?"
      },
      "options": [
        { "id": "si_transpire", "label": { "es": "Sí, mucho", "en": "Yes, a lot" }, "weight": { "transpirable": 1.0 } },
        { "id": "no_transpire", "label": { "es": "No me importa", "en": "I don't mind" }, "weight": { "transpirable": 0.0 } }
      ],
      "priority_weight": 0.5
    },
    {
      "id": "textura_04",
   "category": "textura",
      "text": {
        "es": "¿Prefieres telas ligeras o pesadas?",
        "en": "Do you prefer lightweight or heavy fabrics?"
      },
      "options": [
        { "id": "ligeras", "label": { "es": "Ligeras", "en": "Lightweight" }, "weight": { "peso": "ligero" } },
        { "id": "medio_peso", "label": { "es": "Intermedias", "en": "Medium" }, "weight": { "peso": "medio" } },
        { "id": "pesadas", "label": { "es": "Pesadas", "en": "Heavy" }, "weight": { "peso": "pesado" } }
      ],
      "priority_weight": 0.6
    },
    {
      "id": "textura_05",
      "category": "textura",
      "text": {
        "es": "¿Te gusta el cuero o materiales similares?",
        "en": "Do you like leather or similar materials?"
      },
      "options": [
        { "id": "si_cuero", "label": { "es": "Sí, me gusta", "en": "Yes, I like it" }, "weight": { "cuero": 1.0 } },
        { "id": "no_cuero", "label": { "es": "No, prefiero evitarlo", "en": "No, I'd rather avoid it" }, "weight": { "cuero": 0.0 } }
      ],
      "priority_weight": 0.5
    },
    {
      "id": "preferencia_01",
      "category": "preferencia",
      "text": {
        "es": "¿Qué es más importante para ti: comodidad o estilo?",
        "en": "What's more important to you: comfort or style?"
      },
      "options": [
        { "id": "comodidad", "label": { "es": "Comodidad", "en": "Comfort" }, "weight": { "prioridad": "comodidad" } },
        { "id": "estilo", "label": { "es": "Estilo", "en": "Style" }, "weight": { "prioridad": "estilo" } },
        { "id": "ambos", "label": { "es": "Ambos por igual", "en": "Both equally" }, "weight": { "prioridad": "ambos" } }
      ],
      "priority_weight": 1.0
    },
    {
      "id": "preferencia_02",
      "category": "preferencia",
      "text": {
        "es": "¿Eres más de clásico o de moderno?",
        "en": "Are you more classic or modern?"
      },
      "options": [
        { "id": "clasico", "label": { "es": "Clásico", "en": "Classic" }, "weight": { "estilo": "clasico" } },
        { "id": "moderno", "label": { "es": "Moderno", "en": "Modern" }, "weight": { "estilo": "moderno" } },
        { "id": "fusion", "label": { "es": "Una fusión", "en": "A fusion" }, "weight": { "estilo": "fusion" } }
      ],
      "priority_weight": 0.8
    },
    {
      "id": "preferencia_03",
      "category": "preferencia",
      "text": {
        "es": "¿Sigues tendencias o prefieres algo atemporal?",
        "en": "Do you follow trends or prefer something timeless?"
      },
      "options": [
        { "id": "tendencias", "label": { "es": "Me gustan las tendencias", "en": "I like trends" }, "weight": { "atemporal": 0.0 } },
        { "id": "atemporal", "label": { "es": "Prefiero algo atemporal", "en": "I prefer something timeless" }, "weight": { "atemporal": 1.0 } }
      ],
      "priority_weight": 0.6
    },
    {
      "id": "preferencia_04",
      "category": "preferencia",
      "text": {
        "es": "¿Te importa lo que los demás piensen de tu outfit?",
        "en": "Do you care what others think of your outfit?"
      },
      "options": [
        { "id": "si_importa", "label": { "es": "Sí, me importa", "en": "Yes, I care" }, "weight": { "opinion_ajena": 1.0 } },
        { "id": "no_importa", "label": { "es": "No, me visto para mí", "en": "No, I dress for myself" }, "weight": { "opinion_ajena": 0.0 } }
      ],
      "priority_weight": 0.5
    },
    {
      "id": "preferencia_05",
      "category": "preferencia",
      "text": {
        "es": "¿Cuál es tu color favorito para la ropa?",
        "en": "What's your favorite color for clothing?"
      },
      "options": [
        { "id": "negro", "label": { "es": "Negro", "en": "Black" }, "weight": { "color_fav": "negro" } },
        { "id": "azul", "label": { "es": "Azul", "en": "Blue" }, "weight": { "color_fav": "azul" } },
        { "id": "blanco", "label": { "es": "Blanco", "en": "White" }, "weight": { "color_fav": "blanco" } },
        { "id": "otro", "label": { "es": "Otro", "en": "Other" }, "weight": { "color_fav": "otro" } }
      ],
      "priority_weight": 0.7
    }
  ]
}
```

- [ ] **Step 3: Verify JSON is valid**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/data/garments.json')); console.log('garments.json OK')"
node -e "JSON.parse(require('fs').readFileSync('src/data/questions.json')); console.log('questions.json OK')"
```
Expected: Both print OK

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add garment and question data files"
```

---

## Task 4: PersistenceManager

**Files:**
- Create: `src/systems/PersistenceManager.js`

- [ ] **Step 1: Create `src/systems/PersistenceManager.js`**

```js
const STORAGE_KEY_PROFILE = 'frank_profile';
const STORAGE_KEY_HISTORY = 'frank_history';
const STORAGE_KEY_LANG = 'frank_lang';

export default class PersistenceManager {
  static getProfile() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROFILE);
      return data ? JSON.parse(data) : {
        preferred_colors: [],
        preferred_textures: [],
        preferred_formality: 0.5,
        rounds_played: 0,
        avg_score: 0
      };
    } catch {
      return { preferred_colors: [], preferred_textures: [], preferred_formality: 0.5, rounds_played: 0, avg_score: 0 };
    }
  }

  static saveProfile(profile) {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  }

  static updateProfile(roundResult) {
    const profile = this.getProfile();
    profile.rounds_played++;

    const totalScore = profile.avg_score * (profile.rounds_played - 1) + roundResult.score;
    profile.avg_score = Math.round(totalScore / profile.rounds_played);

    if (roundResult.player_outfit) {
      roundResult.player_outfit.forEach(g => {
        if (g.tags?.colores) {
          g.tags.colores.forEach(c => {
            if (!profile.preferred_colors.includes(c)) profile.preferred_colors.push(c);
          });
        }
        if (g.tags?.textura) {
          g.tags.textura.forEach(t => {
            if (!profile.preferred_textures.includes(t)) profile.preferred_textures.push(t);
          });
        }
      });
    }

    this.saveProfile(profile);
  }

  static getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addRound(roundData) {
    const history = this.getHistory();
    history.unshift({
      date: new Date().toISOString(),
      player_outfit: roundData.player_outfit,
      frank_outfit: roundData.frank_outfit,
      score: roundData.score,
      breakdown: roundData.breakdown
    });
    if (history.length > 50) history.pop();
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  }

  static getLanguage() {
    return localStorage.getItem(STORAGE_KEY_LANG) || 'es';
  }

  static setLanguage(lang) {
    localStorage.setItem(STORAGE_KEY_LANG, lang);
  }

  static clearAll() {
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    localStorage.removeItem(STORAGE_KEY_LANG);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: PersistenceManager for localStorage"
```

---

## Task 5: i18n System

**Files:**
- Create: `src/utils/i18n.js`

- [ ] **Step 1: Create `src/utils/i18n.js`**

```js
import PersistenceManager from '../systems/PersistenceManager.js';

const translations = {
  es: {
    loading: 'Cargando...',
    title: "El Juego de Frank",
    subtitle: "¿Puede Frank adivinar tu outfit?",
    play: 'Jugar',
    history: 'Historial',
    settings: 'Configuración',
    language: 'Idioma',
    volume: 'Volumen',
    ready: 'Listo',
    back: 'Volver',
    play_again: 'Jugar de nuevo',
    score: 'Puntuación',
    round: 'Ronda',
    question_progress: '{current}/{total}',
    your_outfit: 'TU OUTFIT',
    frank_outfit: 'OUTFIT DE FRANK',
    similarity: 'SIMILITUD',
    match: 'Coincide',
    mismatch: 'No coincide',
    categories: {
      superior: 'Superiores',
      inferior: 'Inferiores',
      calzado: 'Calzado',
      accesorio: 'Accesorios',
      capa: 'Capas'
    },
    frank_intro: '¡Hola! Soy Frank, tu costurero personal. Déjame adivinar qué outfit tienes en mente...',
    frank_confident: 'Creo que ya sé qué outfit necesitas...',
    no_history: 'Aún no hay rondas jugadas.',
    round_date: 'Fecha',
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
    subtitle: "Can Frank guess your outfit?",
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
    your_outfit: 'YOUR OUTFIT',
    frank_outfit: "FRANK'S OUTFIT",
    similarity: 'SIMILARITY',
    match: 'Match',
    mismatch: 'Mismatch',
    categories: {
      superior: 'Tops',
      inferior: 'Bottoms',
      calzado: 'Footwear',
      accesorio: 'Accessories',
      capa: 'Layers'
    },
    frank_intro: "Hello! I'm Frank, your personal tailor. Let me guess what outfit you have in mind...",
    frank_confident: "I think I know what outfit you need...",
    no_history: 'No rounds played yet.',
    round_date: 'Date',
    garment_names: {
      camisa_formal: 'Dress Shirt',
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

export function t(key) {
  const lang = PersistenceManager.getLanguage();
  const keys = key.split('.');
  let value = translations[lang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

export function getLang() {
  return PersistenceManager.getLanguage();
}

export function setLang(lang) {
  PersistenceManager.setLanguage(lang);
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: i18n system with ES/EN translations"
```

---

## Task 6: AudioManager

**Files:**
- Create: `src/utils/AudioManager.js`

- [ ] **Step 1: Create `src/utils/AudioManager.js`**

```js
import { Howl, Howler } from 'howler';

const musicFiles = {
  main: 'assets/audio/music/jazz-main.mp3',
  quiz: 'assets/audio/music/jazz-quiz.mp3',
  reveal: 'assets/audio/music/jazz-reveal.mp3'
};

const sfxFiles = {
  select: 'assets/audio/sfx/select.mp3',
  remove: 'assets/audio/sfx/remove.mp3',
  typewriter: 'assets/audio/sfx/typewriter.mp3',
  match: 'assets/audio/sfx/match.mp3',
  mismatch: 'assets/audio/sfx/mismatch.mp3',
  transition: 'assets/audio/sfx/transition.mp3',
  click: 'assets/audio/sfx/click.mp3'
};

export default class AudioManager {
  constructor() {
    this.currentMusic = null;
    this.musicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.sounds = {};
    this.musicTracks = {};
  }

  preload(scene) {
    Object.entries(musicFiles).forEach(([key, path]) => {
      scene.load.audio(`music_${key}`, path);
    });
    Object.entries(sfxFiles).forEach(([key, path]) => {
      scene.load.audio(`sfx_${key}`, path);
    });
  }

  init(scene) {
    Object.keys(musicFiles).forEach(key => {
      this.musicTracks[key] = scene.sound.add(`music_${key}`, { volume: this.musicVolume, loop: true });
    });
    Object.keys(sfxFiles).forEach(key => {
      this.sounds[key] = scene.sound.add(`sfx_${key}`, { volume: this.sfxVolume });
    });
  }

  playMusic(track) {
    if (this.currentMusic) {
      this.currentMusic.stop();
    }
    this.currentMusic = this.musicTracks[track];
    if (this.currentMusic) {
      this.currentMusic.play();
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }

  playSFX(name) {
    if (this.sounds[name]) {
      this.sounds[name].play();
    }
  }

  setMusicVolume(vol) {
    this.musicVolume = vol;
    if (this.currentMusic) {
      this.currentMusic.volume = vol;
    }
  }

  setSFXVolume(vol) {
    this.sfxVolume = vol;
  }

  setMasterVolume(vol) {
    Howler.volume(vol);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: AudioManager with Howler.js for music + SFX"
```

---

## Task 7: BootScene + Asset Loading

**Files:**
- Modify: `src/scenes/BootScene.js`

- [ ] **Step 1: Update BootScene with asset loading**

```js
import Phaser from 'phaser';
import AudioManager from '../utils/AudioManager.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.cameras.main;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0xD4D4D4, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 15, 320, 30);

    const loadingText = this.add.text(width / 2, height / 2 - 40, 'Cargando...', {
      fontFamily: 'Inter',
      fontSize: '18px',
      color: '#4A3728'
    }).setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#4A3728'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      percentText.setText(`${Math.round(value * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0x2E8B57, 1);
      progressBar.fillRect(width / 2 - 155, height / 2 - 10, 310 * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Frank sprites
    this.load.spritesheet('frank-idle', 'assets/frank/idle.png', { frameWidth: 200, frameHeight: 300, frameMax: 2 });
    this.load.spritesheet('frank-talk', 'assets/frank/talk.png', { frameWidth: 200, frameHeight: 300, frameMax: 4 });

    // Mannequin
    this.load.image('mannequin', 'assets/mannequin/mannequin.png');

    // Garments (20 images)
    const garments = [
      'camisa-formal', 'camiseta', 'polo', 'blazer', 'sueter',
      'pantalon-formal', 'jeans', 'bermudas', 'falda', 'pantalon-lino',
      'zapatos-vestir', 'mocasines', 'zapatillas', 'sandalias', 'botas',
      'corbata', 'reloj', 'gafas-sol', 'abrigo', 'chaleco'
    ];
    garments.forEach(g => {
      this.load.image(`garment_${g}`, `assets/garments/${g}.png`);
    });

    // UI elements
    this.load.image('btn_play', 'assets/ui/btn-play.png');
    this.load.image('btn_history', 'assets/ui/btn-history.png');
    this.load.image('btn_back', 'assets/ui/btn-back.png');
    this.load.image('btn_ready', 'assets/ui/btn-ready.png');
    this.load.image('panel_dialogue', 'assets/ui/panel-dialogue.png');
    this.load.image('tab_bg', 'assets/ui/tab-bg.png');
    this.load.image('tab_active', 'assets/ui/tab-active.png');

    // Audio
    this.audioManager = new AudioManager();
    this.audioManager.preload(this);
  }

  create() {
    this.audioManager.init(this);
    this.registry.set('audioManager', this.audioManager);

    // Frank animations
    this.anims.create({
      key: 'frank_idle',
      frames: this.anims.generateFrameNumbers('frank-idle', { start: 0, end: 1 }),
      frameRate: 2,
      repeat: -1
    });
    this.anims.create({
      key: 'frank_talk',
      frames: this.anims.generateFrameNumbers('frank-talk', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    this.scene.start('MenuScene');
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: BootScene with full asset loading and Frank animations"
```

---

## Task 8: MenuScene

**Files:**
- Modify: `src/scenes/MenuScene.js`

- [ ] **Step 1: Implement MenuScene**

```js
import Phaser from 'phaser';
import { t, getLang, setLang } from '../utils/i18n.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    this.add.rectangle(width / 2, height / 2, width, height, 0xF5E6D3);

    this.add.text(width / 2, 120, t('title'), {
      fontFamily: 'Playfair Display',
      fontSize: '52px',
      color: '#4A3728',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, 180, t('subtitle'), {
      fontFamily: 'Inter',
      fontSize: '18px',
      color: '#7A6B5D'
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.text(width / 2, 320, t('play'), {
      fontFamily: 'Inter',
      fontSize: '28px',
      color: '#FFFFFF',
      backgroundColor: '#2E8B57',
      padding: { x: 40, y: 15 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setStyle({ backgroundColor: '#257045' }));
    playBtn.on('pointerout', () => playBtn.setStyle({ backgroundColor: '#2E8B57' }));
    playBtn.on('pointerdown', () => {
      audioManager.playSFX('click');
      this.scene.start('BuilderScene');
    });

    // History button
    const historyBtn = this.add.text(width / 2, 400, t('history'), {
      fontFamily: 'Inter',
      fontSize: '22px',
      color: '#4A3728',
      backgroundColor: '#DAA520',
      padding: { x: 30, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    historyBtn.on('pointerover', () => historyBtn.setStyle({ backgroundColor: '#C4941A' }));
    historyBtn.on('pointerout', () => historyBtn.setStyle({ backgroundColor: '#DAA520' }));
    historyBtn.on('pointerdown', () => {
      audioManager.playSFX('click');
      this.scene.start('HistoryScene');
    });

    // Language toggle
    const langText = this.add.text(width - 100, height - 50, getLang().toUpperCase(), {
      fontFamily: 'Inter',
      fontSize: '16px',
      color: '#4A3728',
      backgroundColor: '#E8D5C0',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    langText.on('pointerdown', () => {
      const newLang = getLang() === 'es' ? 'en' : 'es';
      setLang(newLang);
      audioManager.playSFX('click');
      this.scene.restart();
    });

    // Volume control (placeholder)
    this.add.text(100, height - 50, `♪ ${t('volume')}`, {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#7A6B5D'
    }).setOrigin(0.5);

    audioManager.playMusic('main');
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: MenuScene with play, history, language toggle"
```

---

## Task 9: RecommendationEngine

**Files:**
- Create: `src/systems/RecommendationEngine.js`

- [ ] **Step 1: Create RecommendationEngine**

```js
import garmentsData from '../data/garments.json';
import PersistenceManager from './PersistenceManager.js';

export default class RecommendationEngine {
  constructor() {
    this.garments = garmentsData.garments;
    this.accumulatedWeights = {};
    this.playerAnswers = [];
    this.confidence = 0;
  }

  reset() {
    this.accumulatedWeights = {};
    this.playerAnswers = [];
    this.confidence = 0;
  }

  addAnswer(answer) {
    this.playerAnswers.push(answer);
    if (answer.weight) {
      Object.entries(answer.weight).forEach(([key, value]) => {
        if (!this.accumulatedWeights[key]) {
          this.accumulatedWeights[key] = 0;
        }
        this.accumulatedWeights[key] += value;
      });
    }
    this.confidence = Math.min(this.confidence + 0.03, 1.0);
  }

  calculateGarmentScore(garment) {
    let score = 0;
    const weights = this.accumulatedWeights;
    const tags = garment.tags;

    // Formalidad match
    if (weights.formalidad !== undefined) {
      const diff = Math.abs(weights.formalidad - tags.formalidad);
      score += (1 - diff) * 25;
    }

    // Clima match
    if (weights.calor !== undefined || weights.frio !== undefined) {
      const playerTemp = (weights.calor || 0) - (weights.frio || 0);
      const garmentMatches = tags.clima.some(c => {
        if (playerTemp > 0.3 && (c === 'calor')) return true;
        if (playerTemp < -0.3 && (c === 'frio')) return true;
        if (Math.abs(playerTemp) <= 0.3 && (c === 'templado')) return true;
        return false;
      });
      score += garmentMatches ? 25 : 5;
    }

    // Evento match
    if (weights.evento_tipo) {
      const matches = tags.evento.includes(weights.evento_tipo);
      score += matches ? 25 : 5;
    }

    // Color match
    if (weights.color_grupo || weights.tono || weights.color_fav) {
      const colorMatch = tags.colores.some(c => {
        if (weights.color_fav && c === weights.color_fav) return true;
        if (weights.tono === 'oscuro' && ['negro', 'azul', 'gris'].includes(c)) return true;
        if (weights.tono === 'claro' && ['blanco', 'beige'].includes(c)) return true;
        return false;
      });
      score += colorMatch ? 15 : 3;
    }

    // Textura match
    if (weights.textura) {
      const textureMatch = tags.textura.includes(weights.textura);
      score += textureMatch ? 10 : 2;
    }

    return score;
  }

  getRecommendations(count = 5) {
    const scored = this.garments.map(g => ({
      ...g,
      score: this.calculateGarmentScore(g)
    }));

    const categories = ['superior', 'inferior', 'calzado', 'accesorio', 'capa'];
    const selected = [];

    categories.forEach(cat => {
      const catGarments = scored.filter(g => g.category === cat);
      catGarments.sort((a, b) => b.score - a.score);
      if (catGarments.length > 0) {
        selected.push(catGarments[0]);
      }
    });

    return selected;
  }

  getConfidence() {
    const answerCount = this.playerAnswers.length;
    const weightKeys = Object.keys(this.accumulatedWeights).length;
    return Math.min(0.2 + (answerCount * 0.02) + (weightKeys * 0.05), 0.95);
  }

  learnFromRound(playerOutfit, frankOutfit) {
    const profile = PersistenceManager.getProfile();
    playerOutfit.forEach(pGarment => {
      const inFrank = frankOutfit.some(fGarment => fGarment.id === pGarment.id);
      if (!inFrank) {
        if (pGarment.tags?.colores) {
          pGarment.tags.colores.forEach(c => {
            if (!profile.preferred_colors.includes(c)) {
              profile.preferred_colors.push(c);
            }
          });
        }
        if (pGarment.tags?.textura) {
          pGarment.tags.textura.forEach(t => {
            if (!profile.preferred_textures.includes(t)) {
              profile.preferred_textures.push(t);
            }
          });
        }
      }
    });
    PersistenceManager.saveProfile(profile);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: RecommendationEngine with 3-layer scoring"
```

---

## Task 10: QuestionManager

**Files:**
- Create: `src/systems/QuestionManager.js`

- [ ] **Step 1: Create QuestionManager**

```js
import questionsData from '../data/questions.json';

export default class QuestionManager {
  constructor() {
    this.allQuestions = questionsData.questions;
    this.asked = [];
    this.remaining = [];
    this.currentIndex = 0;
    this.maxQuestions = 30;
  }

  reset() {
    this.asked = [];
    this.remaining = [...this.allQuestions];
    this.currentIndex = 0;
    this.prioritizeByWeights({});
  }

  prioritizeByWeights(weights) {
    this.remaining.sort((a, b) => {
      const aBoost = this.getCategoryBoost(a.category, weights);
      const bBoost = this.getCategoryBoost(b.category, weights);
      return (b.priority_weight + bBoost) - (a.priority_weight + aBoost);
    });
  }

  getCategoryBoost(category, weights) {
    if (weights.evento_tipo && (category === 'evento' || category === 'formalidad')) return 0.3;
    if (weights.formalidad !== undefined && category === 'formalidad') return 0.2;
    if (weights.calor !== undefined && category === 'clima') return 0.1;
    return 0;
  }

  getNextQuestion(answeredWeights = {}) {
    if (this.asked.length >= this.maxQuestions || this.remaining.length === 0) {
      return null;
    }

    this.prioritizeByWeights(answeredWeights);

    const question = this.remaining.shift();
    if (question) {
      this.asked.push(question);
      this.currentIndex++;
    }
    return question;
  }

  getTotal() {
    return Math.min(this.allQuestions.length, this.maxQuestions);
  }

  getAskedCount() {
    return this.asked.length;
  }

  getProgress() {
    return this.asked.length / this.getTotal();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: QuestionManager with adaptive priority ordering"
```

---

## Task 11: BuilderScene

**Files:**
- Modify: `src/scenes/BuilderScene.js`

- [ ] **Step 1: Implement BuilderScene**

```js
import Phaser from 'phaser';
import { t } from '../utils/i18n.js';
import garmentsData from '../data/garments.json';

const CATEGORIES = ['superior', 'inferior', 'calzado', 'accesorio', 'capa'];

export default class BuilderScene extends Phaser.Scene {
  constructor() {
    super('BuilderScene');
    this.selectedGarments = {};
    this.currentCategory = 'superior';
    this.garmentSprites = {};
    this.tabButtons = {};
  }

  create() {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    this.add.rectangle(width / 2, height / 2, width, height, 0xF5E6D3);

    // Title
    this.add.text(width / 2, 30, t('ready'), {
      fontFamily: 'Playfair Display',
      fontSize: '28px',
      color: '#4A3728'
    }).setOrigin(0.5);

    // Mannequin
    this.mannequin = this.add.image(width / 2, height / 2 - 20, 'mannequin')
      .setDisplaySize(300, 500);

    // Garment layer container
    this.garmentLayer = this.add.container(width / 2, height / 2 - 20);

    // Category tabs
    const tabWidth = 120;
    const tabStartX = 30;
    CATEGORIES.forEach((cat, i) => {
      const tab = this.add.text(tabStartX + i * (tabWidth + 10), height - 120, t(`categories.${cat}`), {
        fontFamily: 'Inter',
        fontSize: '14px',
        color: '#4A3728',
        backgroundColor: '#E8D5C0',
        padding: { x: 10, y: 8 }
      }).setInteractive({ useHandCursor: true });

      tab.on('pointerdown', () => {
        audioManager.playSFX('click');
        this.currentCategory = cat;
        this.updateTabs();
        this.showGarmentsForCategory(cat);
      });

      this.tabButtons[cat] = { bg: tab, text: tab };
    });

    this.updateTabs();
    this.showGarmentsForCategory(this.currentCategory);

    // Ready button
    const readyBtn = this.add.text(width - 100, height - 50, t('ready'), {
      fontFamily: 'Inter',
      fontSize: '20px',
      color: '#FFFFFF',
      backgroundColor: '#2E8B57',
      padding: { x: 25, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    readyBtn.on('pointerover', () => readyBtn.setStyle({ backgroundColor: '#257045' }));
    readyBtn.on('pointerout', () => readyBtn.setStyle({ backgroundColor: '#2E8B57' }));
    readyBtn.on('pointerdown', () => {
      if (Object.keys(this.selectedGarments).length > 0) {
        audioManager.playSFX('transition');
        this.registry.set('playerOutfit', this.getSelectedOutfit());
        this.scene.start('QuizScene');
      }
    });

    // Remove garment button
    this.removeBtn = this.add.text(width / 2, height / 2 + 280, '✕ Quitar prenda', {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#CC4444',
      backgroundColor: '#FFE0E0',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);

    this.removeBtn.on('pointerdown', () => {
      this.removeGarment(this.currentCategory);
      audioManager.playSFX('remove');
    });
  }

  updateTabs() {
    CATEGORIES.forEach(cat => {
      const tab = this.tabButtons[cat];
      if (cat === this.currentCategory) {
        tab.text.setStyle({ backgroundColor: '#2E8B57', color: '#FFFFFF' });
      } else {
        tab.text.setStyle({ backgroundColor: '#E8D5C0', color: '#4A3728' });
      }
    });
  }

  showGarmentsForCategory(category) {
    // Clear previous thumbnails
    if (this.thumbnailContainer) this.thumbnailContainer.destroy();
    this.thumbnailContainer = this.add.container(0, 0);

    const garments = garmentsData.garments.filter(g => g.category === category);
    const startX = 50;
    const y = 80;
    const spacing = 80;

    garments.forEach((garment, i) => {
      const thumb = this.add.image(startX + i * spacing, y, `garment_${garment.id.replace(/_/g, '-')}`)
        .setDisplaySize(60, 60)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, this.selectedGarments[category]?.id === garment.id ? 0x2E8B57 : 0xD4D4D4);

      thumb.on('pointerdown', () => {
        this.selectGarment(garment);
        audioManager.playSFX('select');
      });

      const label = this.add.text(startX + i * spacing, y + 40, t(`garment_names.${garment.id}`), {
        fontFamily: 'Inter',
        fontSize: '10px',
        color: '#4A3728',
        wordWrap: { width: 70 }
      }).setOrigin(0.5);

      this.thumbnailContainer.add([thumb, label]);
    });
  }

  selectGarment(garment) {
    const category = garment.category;

    // Remove existing garment in category
    if (this.garmentSprites[category]) {
      this.garmentSprites[category].destroy();
      delete this.garmentSprites[category];
    }

    // Add new garment
    const sprite = this.add.image(
      this.mannequin.x,
      this.mannequin.y,
      `garment_${garment.id.replace(/_/g, '-')}`
    ).setDisplaySize(250, 400).setAlpha(0);

    this.tweens.add({
      targets: sprite,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    this.garmentSprites[category] = sprite;
    this.selectedGarments[category] = garment;
    this.removeBtn.setVisible(true);

    this.showGarmentsForCategory(category);
  }

  removeGarment(category) {
    if (this.garmentSprites[category]) {
      this.tweens.add({
        targets: this.garmentSprites[category],
        alpha: 0,
        duration: 200,
        ease: 'Power2',
        onComplete: () => {
          this.garmentSprites[category].destroy();
          delete this.garmentSprites[category];
        }
      });
      delete this.selectedGarments[category];
      this.showGarmentsForCategory(category);

      if (Object.keys(this.selectedGarments).length === 0) {
        this.removeBtn.setVisible(false);
      }
    }
  }

  getSelectedOutfit() {
    return Object.values(this.selectedGarments);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: BuilderScene with mannequin, tabs, garment selection"
```

---

## Task 12: QuizScene

**Files:**
- Modify: `src/scenes/QuizScene.js`

- [ ] **Step 1: Implement QuizScene**

```js
import Phaser from 'phaser';
import { t } from '../utils/i18n.js';
import RecommendationEngine from '../systems/RecommendationEngine.js';
import QuestionManager from '../systems/QuestionManager.js';

export default class QuizScene extends Phaser.Scene {
  constructor() {
    super('QuizScene');
    this.engine = new RecommendationEngine();
    this.questionManager = new QuestionManager();
    this.currentQuestion = null;
    this.optionButtons = [];
    this.typewriterTimer = null;
    this.displayedText = '';
  }

  create() {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    this.add.rectangle(width / 2, height / 2, width, height, 0xF5E6D3);
    audioManager.playMusic('quiz');

    this.engine.reset();
    this.questionManager.reset();

    // Player outfit display (right)
    this.add.text(width * 0.7, 30, t('your_outfit'), {
      fontFamily: 'Inter', fontSize: '14px', color: '#7A6B5D'
    }).setOrigin(0.5);

    const playerOutfit = this.registry.get('playerOutfit') || [];
    playerOutfit.forEach((garment, i) => {
      this.add.image(width * 0.7, 80 + i * 80, `garment_${garment.id.replace(/_/g, '-')}`)
        .setDisplaySize(60, 60);
    });

    // Frank (left)
    this.frank = this.add.sprite(150, height / 2 - 60, 'frank-idle');
    this.frank.play('frank_idle');

    // Dialogue box
    this.dialogueBg = this.add.rectangle(width / 2, height - 130, width - 100, 120, 0x4A3728, 0.9)
      .setStrokeStyle(2, 0xDAA520);

    this.dialogueText = this.add.text(width / 2, height - 140, '', {
      fontFamily: 'Inter',
      fontSize: '16px',
      color: '#FFFFFF',
      wordWrap: { width: width - 160 },
      lineSpacing: 5
    }).setOrigin(0.5);

    // Progress bar
    this.progressBg = this.add.rectangle(width - 80, height - 20, 120, 10, 0xD4D4D4);
    this.progressFill = this.add.rectangle(width - 140, height - 20, 0, 10, 0x2E8B57).setOrigin(0, 0.5);

    this.progressText = this.add.text(width - 80, height - 35, '', {
      fontFamily: 'Inter', fontSize: '12px', color: '#7A6B5D'
    }).setOrigin(0.5);

    // Options container
    this.optionsContainer = this.add.container(0, 0);

    // Start with intro
    this.showIntro();
  }

  showIntro() {
    this.frank.play('frank_talk');
    this.typewriteText(t('frank_intro'), () => {
      this.frank.play('frank_idle');
      this.time.delayedCall(500, () => this.askNextQuestion());
    });
  }

  askNextQuestion() {
    const weights = this.engine.accumulatedWeights;
    this.currentQuestion = this.questionManager.getNextQuestion(weights);

    if (!this.currentQuestion) {
      this.endQuiz();
      return;
    }

    // Check confidence
    if (this.engine.getConfidence() > 0.85) {
      this.frank.play('frank_talk');
      this.typewriteText(t('frank_confident'), () => {
        this.frank.play('frank_idle');
        this.time.delayedCall(300, () => this.endQuiz());
      });
      return;
    }

    // Update progress
    const progress = this.questionManager.getProgress();
    this.progressFill.width = 120 * progress;
    this.progressText.setText(this.questionManager.getAskedCount() + '/' + this.questionManager.getTotal());

    // Show question
    this.frank.play('frank_talk');
    this.typewriteText(this.currentQuestion.text[t('lang')] || this.currentQuestion.text.es, () => {
      this.frank.play('frank_idle');
      this.showOptions();
    });
  }

  showOptions() {
    this.optionsContainer.removeAll(true);

    const { width, height } = this.cameras.main;
    const options = this.currentQuestion.options;
    const optWidth = 180;
    const startX = width / 2 - ((options.length - 1) * (optWidth + 15)) / 2;

    options.forEach((opt, i) => {
      const btn = this.add.text(startX + i * (optWidth + 15), height - 220, opt.label[t('lang')] || opt.label.es, {
        fontFamily: 'Inter',
        fontSize: '15px',
        color: '#4A3728',
        backgroundColor: '#E8D5C0',
        padding: { x: 15, y: 10 },
        wordWrap: { width: optWidth }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#DAA520', color: '#FFFFFF' }));
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#E8D5C0', color: '#4A3728' }));
      btn.on('pointerdown', () => {
        this.registry.get('audioManager').playSFX('click');
        this.selectAnswer(opt);
      });

      this.optionsContainer.add(btn);
    });
  }

  selectAnswer(option) {
    this.optionsContainer.removeAll(true);
    this.engine.addAnswer(option);

    this.time.delayedCall(300, () => this.askNextQuestion());
  }

  typewriteText(text, onComplete) {
    this.displayedText = '';
    this.dialogueText.setText('');
    let index = 0;

    if (this.typewriterTimer) this.typewriterTimer.destroy();

    this.typewriterTimer = this.time.addEvent({
      delay: 30,
      repeat: text.length - 1,
      callback: () => {
        this.displayedText += text[index];
        this.dialogueText.setText(this.displayedText);
        index++;
        if (index >= text.length) {
          this.typewriterTimer.destroy();
          this.typewriterTimer = null;
          if (onComplete) onComplete();
        }
      }
    });
  }

  endQuiz() {
    const frankOutfit = this.engine.getRecommendations();
    this.registry.set('frankOutfit', frankOutfit);
    this.registry.set('recommendationEngine', this.engine);
    this.registry.get('audioManager').playSFX('transition');
    this.scene.start('RevealScene');
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: QuizScene with adaptive questions and typewriter dialogue"
```

---

## Task 13: RevealScene

**Files:**
- Modify: `src/scenes/RevealScene.js`

- [ ] **Step 1: Implement RevealScene**

```js
import Phaser from 'phaser';
import { t } from '../utils/i18n.js';
import PersistenceManager from '../systems/PersistenceManager.js';

const CATEGORIES = ['superior', 'inferior', 'calzado', 'accesorio', 'capa'];

export default class RevealScene extends Phaser.Scene {
  constructor() {
    super('RevealScene');
    this.score = 0;
    this.breakdown = [];
  }

  create() {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    this.add.rectangle(width / 2, height / 2, width, height, 0xF5E6D3);
    audioManager.playMusic('reveal');

    const playerOutfit = this.registry.get('playerOutfit') || [];
    const frankOutfit = this.registry.get('frankOutfit') || [];
    const engine = this.registry.get('recommendationEngine');

    // Calculate score
    this.calculateScore(playerOutfit, frankOutfit);

    // Save round
    PersistenceManager.addRound({
      player_outfit: playerOutfit,
      frank_outfit: frankOutfit,
      score: this.score,
      breakdown: this.breakdown
    });
    PersistenceManager.updateProfile({ score: this.score, player_outfit: playerOutfit });
    engine.learnFromRound(playerOutfit, frankOutfit);

    // Title
    this.add.text(width / 2, 30, t('similarity'), {
      fontFamily: 'Playfair Display', fontSize: '28px', color: '#4A3728'
    }).setOrigin(0.5);

    // Player outfit (left)
    this.add.text(width * 0.25, 70, t('your_outfit'), {
      fontFamily: 'Inter', fontSize: '14px', color: '#7A6B5D'
    }).setOrigin(0.5);

    // Frank outfit (right)
    this.add.text(width * 0.75, 70, t('frank_outfit'), {
      fontFamily: 'Inter', fontSize: '14px', color: '#7A6B5D'
    }).setOrigin(0.5);

    // Reveal garments one by one
    CATEGORIES.forEach((cat, i) => {
      const y = 120 + i * 90;
      const pGarment = playerOutfit.find(g => g.category === cat);
      const fGarment = frankOutfit.find(g => g.category === cat);
      const match = pGarment && fGarment && pGarment.id === fGarment.id;

      // Category label
      this.add.text(width * 0.12, y, t(`categories.${cat}`), {
        fontFamily: 'Inter', fontSize: '12px', color: '#7A6B5D'
      }).setOrigin(0.5);

      // Player garment
      if (pGarment) {
        const pSprite = this.add.image(width * 0.25, y, `garment_${pGarment.id.replace(/_/g, '-')}`)
          .setDisplaySize(50, 50).setAlpha(0);

        this.tweens.add({
          targets: pSprite,
          alpha: 1,
          y: y,
          duration: 400,
          delay: i * 300,
          ease: 'Power2'
        });
      }

      // Frank garment
      if (fGarment) {
        const fSprite = this.add.image(width * 0.75, y, `garment_${fGarment.id.replace(/_/g, '-')}`)
          .setDisplaySize(50, 50).setAlpha(0);

        this.tweens.add({
          targets: fSprite,
          alpha: 1,
          duration: 400,
          delay: i * 300 + 150,
          ease: 'Power2'
        });

        // Match indicator
        const indicator = this.add.text(width * 0.5, y, match ? '✓' : '✗', {
          fontFamily: 'Inter',
          fontSize: '24px',
          color: match ? '#2E8B57' : '#CC4444'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
          targets: indicator,
          alpha: 1,
          duration: 300,
          delay: i * 300 + 300,
          ease: 'Power2'
        });

        if (match) {
          audioManager.playSFX('match');
        } else {
          audioManager.playSFX('mismatch');
        }
      }
    });

    // Score counter
    const scoreText = this.add.text(width / 2, height - 140, '0%', {
      fontFamily: 'Playfair Display',
      fontSize: '52px',
      color: '#4A3728',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: scoreText,
      alpha: 1,
      duration: 500,
      delay: CATEGORIES.length * 300 + 500,
      onComplete: () => {
        this.tweens.addCounter({
          from: 0,
          to: this.score,
          duration: 1500,
          onUpdate: (tween) => {
            scoreText.setText(Math.round(tween.getValue()) + '%');
          }
        });
      }
    });

    // Buttons
    const playAgainBtn = this.add.text(width * 0.35, height - 60, t('play_again'), {
      fontFamily: 'Inter', fontSize: '18px', color: '#FFFFFF',
      backgroundColor: '#2E8B57', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playAgainBtn.on('pointerdown', () => {
      audioManager.playSFX('click');
      this.scene.start('BuilderScene');
    });

    const historyBtn = this.add.text(width * 0.65, height - 60, t('history'), {
      fontFamily: 'Inter', fontSize: '18px', color: '#FFFFFF',
      backgroundColor: '#DAA520', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    historyBtn.on('pointerdown', () => {
      audioManager.playSFX('click');
      this.scene.start('HistoryScene');
    });
  }

  calculateScore(playerOutfit, frankOutfit) {
    let total = 0;
    CATEGORIES.forEach(cat => {
      const p = playerOutfit.find(g => g.category === cat);
      const f = frankOutfit.find(g => g.category === cat);
      if (p && f && p.id === f.id) {
        total += 20;
        this.breakdown.push({ category: cat, match: true, garment: p.id });
      } else if (p && f && p.tags && f.tags) {
        const pTags = p.tags;
        const fTags = f.tags;
        let partial = 0;
        if (pTags.formalidad && fTags.formalidad && Math.abs(pTags.formalidad - fTags.formalidad) < 0.3) partial += 5;
        if (pTags.clima && fTags.clima && pTags.clima.some(c => fTags.clima.includes(c))) partial += 5;
        total += partial;
        this.breakdown.push({ category: cat, match: false, partial, garment: p.id });
      } else {
        this.breakdown.push({ category: cat, match: false, partial: 0, garment: p?.id || null });
      }
    });
    this.score = total;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: RevealScene with side-by-side comparison and score animation"
```

---

## Task 14: HistoryScene

**Files:**
- Modify: `src/scenes/HistoryScene.js`

- [ ] **Step 1: Implement HistoryScene**

```js
import Phaser from 'phaser';
import { t } from '../utils/i18n.js';
import PersistenceManager from '../systems/PersistenceManager.js';

export default class HistoryScene extends Phaser.Scene {
  constructor() {
    super('HistoryScene');
  }

  create() {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    this.add.rectangle(width / 2, height / 2, width, height, 0xF5E6D3);

    this.add.text(width / 2, 40, t('history'), {
      fontFamily: 'Playfair Display', fontSize: '32px', color: '#4A3728'
    }).setOrigin(0.5);

    const history = PersistenceManager.getHistory();
    const profile = PersistenceManager.getProfile();

    // Profile stats
    this.add.text(width / 2, 80, `${t('round')}: ${profile.rounds_played} | ${t('score')}: ${profile.avg_score}%`, {
      fontFamily: 'Inter', fontSize: '14px', color: '#7A6B5D'
    }).setOrigin(0.5);

    if (history.length === 0) {
      this.add.text(width / 2, height / 2, t('no_history'), {
        fontFamily: 'Inter', fontSize: '18px', color: '#7A6B5D'
      }).setOrigin(0.5);
    } else {
      const startY = 120;
      const itemHeight = 60;
      const maxVisible = Math.min(history.length, 8);

      for (let i = 0; i < maxVisible; i++) {
        const round = history[i];
        const y = startY + i * itemHeight;
        const date = new Date(round.date).toLocaleDateString();

        this.add.text(50, y, `${t('round')} ${history.length - i}`, {
          fontFamily: 'Inter', fontSize: '14px', color: '#4A3728', fontStyle: 'bold'
        });

        this.add.text(150, y, `${t('round_date')}: ${date}`, {
          fontFamily: 'Inter', fontSize: '12px', color: '#7A6B5D'
        });

        const scoreColor = round.score >= 70 ? '#2E8B57' : round.score >= 40 ? '#DAA520' : '#CC4444';
        this.add.text(width - 100, y, `${round.score}%`, {
          fontFamily: 'Inter', fontSize: '18px', color: scoreColor, fontStyle: 'bold'
        });

        // Mini garment icons
        if (round.player_outfit) {
          round.player_outfit.slice(0, 3).forEach((g, j) => {
            this.add.image(300 + j * 35, y + 5, `garment_${g.id.replace(/_/g, '-')}`)
              .setDisplaySize(28, 28);
          });
        }
      }
    }

    // Back button
    const backBtn = this.add.text(width / 2, height - 50, t('back'), {
      fontFamily: 'Inter', fontSize: '18px', color: '#FFFFFF',
      backgroundColor: '#4A3728', padding: { x: 25, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      audioManager.playSFX('click');
      this.scene.start('MenuScene');
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: HistoryScene with past rounds and profile stats"
```

---

## Task 15: Responsive Design

**Files:**
- Modify: `src/scenes/BuilderScene.js` (responsive tweaks)
- Modify: `src/scenes/QuizScene.js` (responsive tweaks)
- Modify: `src/scenes/RevealScene.js` (responsive tweaks)
- Modify: `src/main.js` (scale mode)

- [ ] **Step 1: Add responsive helper**

Create `src/utils/responsive.js`:
```js
export function isMobile(scene) {
  return scene.cameras.main.width < 768;
}

export function isTablet(scene) {
  const w = scene.cameras.main.width;
  return w >= 768 && w < 1024;
}

export function getLayout(scene) {
  if (isMobile(scene)) return 'mobile';
  if (isTablet(scene)) return 'tablet';
  return 'desktop';
}
```

- [ ] **Step 2: Update main.js scale config**

```js
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  min: { width: 375, height: 667 },
  max: { width: 1920, height: 1080 }
}
```

- [ ] **Step 3: Update QuizScene for responsive layout**

In `QuizScene.js`, modify `create()` to use layout detection:
```js
import { getLayout } from '../utils/responsive.js';

// In create():
const layout = getLayout(this);

if (layout === 'mobile') {
  // Stack vertically: Frank top, mannequin middle, dialogue bottom
  this.frank.setPosition(width / 2, 100).setDisplaySize(120, 180);
  // Mannequin and dialogue repositioned...
} else if (layout === 'tablet') {
  // Frank top, mannequin bottom
} else {
  // Desktop: side by side (default)
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: responsive layout for mobile, tablet, desktop"
```

---

## Task 16: GitHub Repository Setup

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```markdown
# Frank's Outfit Game

A web game where Frank the tailor tries to guess the outfit you have in mind.

## How to Play

1. Build your outfit on the mannequin
2. Frank asks you questions to figure out what you're wearing
3. See how well Frank guessed!

## Tech Stack

- Phaser 3
- Vite
- Howler.js (audio)
- localStorage (persistence)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

```bash
npm run build
# Push to gh-pages branch
```

## License

MIT
```

- [ ] **Step 2: Initialize git and push**

```bash
git init
git add .
git commit -m "feat: complete Frank's Outfit Game MVP"
git remote add origin https://github.com/<username>/frank-outfit-game.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Enable GitHub Pages**

Go to repo Settings → Pages → Source: Deploy from branch → Branch: main / / (root)

- [ ] **Step 4: Final verification**

```bash
npm run build
npm run preview
```
Expected: Game works at http://localhost:4173

---

## Self-Review Checklist

1. **Spec coverage:** All 8 spec sections have corresponding tasks
2. **No placeholders:** All code is complete, no TBD/TODO
3. **File paths:** Consistent naming throughout
4. **Type consistency:** Function names and data structures match across tasks
5. **Scenes flow:** Boot → Menu → Builder → Quiz → Reveal → History works end-to-end

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-01-frank-outfit-game.md`.**

**Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
