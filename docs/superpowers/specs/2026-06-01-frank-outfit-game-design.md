# Frank's Outfit Game - Design Spec

## Overview

A web-based game where a tailor named Frank tries to guess the outfit the player has in mind. The player builds their outfit on an interactive mannequin, Frank asks up to 30 adaptive questions, then reveals his guess and compares it with the player's outfit. Frank learns from each round to improve future guesses.

## Tech Stack

- **Framework:** Phaser.js (monolith architecture)
- **Platform:** Web (GitHub Pages)
- **Language:** JavaScript ES6+
- **Assets:** Free sprite packs + custom tweaks
- **Audio:** Jazz piano loops + SFX
- **Persistence:** localStorage
- **Styling:** Flat design retro 50s
- **Responsive:** Multi-platform (desktop, tablet, mobile)

## Game Flow

```
Boot → Menu → Builder → Quiz → Reveal → (loop)
```

1. **BootScene:** Load assets (sprites, audio, fonts)
2. **MenuScene:** Title screen, Play button, History button
3. **BuilderScene:** Player builds outfit on interactive mannequin
4. **QuizScene:** Frank asks up to 30 adaptive questions
5. **RevealScene:** Frank reveals his outfit + side-by-side comparison

## Architecture - Scenes

### BootScene
- Preload all sprites, audio, and fonts
- Show loading bar
- Transition to MenuScene on complete

### MenuScene
- Title: "Frank's Outfit Game" / "El Juego de la Outfit de Frank"
- Play button → BuilderScene
- History button → HistoryScene
- Settings: language toggle (ES/EN), volume slider

### BuilderScene
- Mannequin in center
- Category tabs: Superiores, Inferiores, Calzado, Accesorios, Capas
- Thumbnails of available garments per category
- Click thumbnail → garment fades in on mannequin
- Right-click or X button → remove garment
- One garment per category max
- No combination restrictions (freedom of expression)
- "Listo" button when at least one garment selected → QuizScene

### QuizScene
- Split layout: Frank (left) | Mannequin with player's outfit (right)
- Dialogue box at bottom with Frank's question
- Options appear as clickable buttons
- Frank's sprite animates (idle + talk)
- Progress bar showing questions answered (X/30)
- Can end early if Frank is confident (score threshold)

### RevealScene
- Both mannequins side by side: Player (left) | Frank (right)
- Garments revealed one by one with animation
- Green highlight = match, red highlight = mismatch
- Score counter animates to final percentage
- Breakdown list: which categories matched/differed
- Buttons: "Play Again" → BuilderScene, "History" → HistoryScene

### HistoryScene
- List of past rounds with date, score, and mini mannequin previews
- Click round → detailed comparison view
- Back button → MenuScene

## Question System (Adaptive)

### Categories (6 categories × 5 questions = 30 total)
1. **Clima** (Weather): hot, cold, mild, rainy, windy
2. **Evento** (Event type): wedding, work, casual, graduation, party
3. **Formalidad** (Formality): very formal, semi-formal, casual, sporty
4. **Color** (Color preference): warm, cool, neutral, bright, dark
5. **Textura** (Texture/touch): soft, rigid, smooth, rough, light
6. **Preferencia** (Personal preference): comfortable, elegant, practical, trendy, classic

### Adaptive Logic
- Start with 5 questions from each category (30 total)
- Priority weighting: questions with higher `priority_weight` go first
- Entropy-based ordering: categories with most uncertainty go first
- If player gives very specific answer (e.g., "wedding"), Frank prioritizes formalidad/evento questions
- Early termination: if Frank's confidence score > 85%, stop asking

### Question Data Structure
```json
{
  "id": "clima_01",
  "category": "clima",
  "text": {
    "es": "¿Hace calor donde usarás el outfit?",
    "en": "Is it hot where you'll wear this?"
  },
  "options": [
    {
      "id": "si_caluroso",
      "label": { "es": "Sí, mucho", "en": "Yes, very" },
      "weight": { "calor": 1.0, "frio": 0.0 }
    }
  ],
  "priority_weight": 1.0
}
```

## Recommendation Engine (3 Layers)

### Layer 1: Inference Rules
- Knowledge base of garments with formal attributes
- Each player answer accumulates weights by category (calor, frío, formal, casual, etc.)
- Frank selects garments that maximize accumulated score

### Layer 2: Cumulative Scoring
- Each garment has attribute vector: `[evento, clima, formalidad, color, textura]`
- Player answers generate an "ideal" vector
- Score = cosine similarity between ideal vector and each garment's vector

### Layer 3: Learning per Round
- After each round, Frank compares his outfit vs player's outfit
- Garments player chose that Frank didn't → Frank "learns" them as preferred
- Preferences saved to localStorage, influence future rounds

### Garment Data Structure
```json
{
  "id": "camisa_formal",
  "category": "superior",
  "name": { "es": "Camisa Formal", "en": "Dress Shirt" },
  "sprite": "assets/garments/camisa-formal.png",
  "tags": {
    "evento": ["boda", "trabajo", "graduacion"],
    "formalidad": 0.9,
    "clima": ["templado", "frio"],
    "colores": ["blanco", "azul", "negro"],
    "textura": ["algodon", "seda"]
  }
}
```

## Garments (MVP ~20)

| Category | Garments |
|----------|----------|
| Superiores (5) | Camisa formal, Camiseta, Polo, Blazer, Suéter |
| Inferiores (5) | Pantalón formal, Jeans, Bermudas, Falda, Pantalón de lino |
| Calzado (5) | Zapatos de vestir, Mocasines, Zapatillas, Sandalias, Botas |
| Accesorios (3) | Corbata, Reloj, Gafas de sol |
| Capas (2) | Abrigo, Chaleco |

## Comparison System

### Score Calculation
- Per category: exact match (+20), partial match (+10), no match (0)
- Total score = (sum of matches / 5 categories) × 100
- Visual: matching garments highlighted green, different highlighted red

### Reveal Animation
1. Both mannequins fade in
2. Garments revealed one by one: superior → inferior → calzado → accesorios → capa
3. Each garment illuminates green/red based on match
4. Score appears with counter animation

## Audio

### Music
- `jazz-main.mp3` (menu/builder)
- `jazz-quiz.mp3` (quiz, softer)
- `jazz-reveal.mp3` (reveal, more dramatic)
- Volume adjustable via slider

### SFX
| Action | Sound |
|--------|-------|
| Select garment | Soft fabric click |
| Remove garment | Short whoosh |
| Frank speaks | Typewriter keystroke |
| Match in comparison | High ding |
| Mismatch in comparison | Low tones |
| Screen transition | Elegant swish |
| Button click | Mechanical button click |

## UI/Visual

### Layout (QuizScene)
```
┌─────────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌────────────────────┐  ┌─────────┐ │
│  │              │  │                    │  │ Historial│ │
│  │    FRANK     │  │      MANIQUÍ       │  │  Score   │ │
│  │  [Sprite]    │  │    [Outfit actual] │  │  Ronda   │ │
│  │              │  │                    │  └─────────┘ │
│  └──────────────┘  └────────────────────┘              │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ┌─────────────────────────────────────────────┐   │ │
│  │  │  "¿Qué tipo de evento asistirás?"          │   │ │
│  │  │  ○ Boda    ○ Trabajo    ○ Casual           │   │ │
│  │  └─────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────┘ │
│  [ES/EN]  ♪──────────○  Volumen                        │
└─────────────────────────────────────────────────────────┘
```

### Colors (Flat Retro 50s)
- Background: warm beige `#F5E6D3`
- Frank: brown/mustard tones
- Mannequin: light gray `#D4D4D4`
- Accents: emerald green `#2E8B57`, gold `#DAA520`
- Text: dark brown `#4A3728`

### Typography
- Titles: elegant serif (Playfair Display)
- Body: clean sans-serif (Inter or Poppins)

### Frank Sprite
- Old man with monocle, classic suit
- Idle animation: slight head movement
- Talk animation: mouth moves synced with typewriter text

### Responsiveness
- Desktop: horizontal layout (Frank | Mannequin)
- Tablet: Frank top, mannequin bottom
- Mobile: vertical stack, Frank as small avatar

## Data Persistence (localStorage)

### Player Profile
```json
{
  "frank_profile": {
    "preferred_colors": ["azul", "negro"],
    "preferred_textures": ["algodon"],
    "preferred_formality": 0.7,
    "rounds_played": 5,
    "avg_score": 72
  }
}
```

### History
```json
{
  "frank_history": [
    {
      "date": "2026-06-01",
      "player_outfit": [...],
      "frank_outfit": [...],
      "score": 72
    }
  ]
}
```

## Languages

- Bilingual: Spanish (ES) and English (EN)
- Toggle in menu, persisted in localStorage
- All UI text and Frank's dialogue in both languages

## Scope (MVP)

- ~20 garments across 5 categories
- 30 adaptive questions across 6 categories
- 3-layer recommendation engine
- Side-by-side comparison with score
- localStorage persistence
- Bilingual (ES/EN)
- Jazz piano audio + SFX
- Responsive (desktop, tablet, mobile)
