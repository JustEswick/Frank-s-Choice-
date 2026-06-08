# 🎩 Frank's Tailored Lies

A gamified **Knowledge Representation (KR) System** wrapped in a thrilling fashion interrogation game. 

Step into the tailor shop and face Frank, an AI-driven master tailor. Your goal? Build a secret outfit and then answer his questions. You can choose to tell the truth and marvel at his deduction skills, or **attempt to lie to him and fool his Bayesian logic**. But be careful: Frank uses mathematical inference to detect contradictions. Three strikes, and you're thrown out!

---

## 🎮 How to Play

1. **Design your Outfit:** Start by secretly dressing a mannequin with tops, bottoms, shoes, and accessories.
2. **The Interrogation:** Frank will ask you up to 6 questions about what you are wearing.
3. **Truth or Lies:** Answer honestly to test Frank's deduction engine, or lie to try and throw him off the scent.
4. **Survive 3 Minutes:** If Frank detects severe mathematical contradictions in your story, you'll receive a **Strike**. If he gets suspicious, he might enter **Phase 2 (Interrogation Mode)** and cross-examine you with past questions.
5. **The Reveal:** See how close Frank got to guessing your outfit. If you fool him, you'll earn Deception Stars!

---

## 🧠 AI & Knowledge Representation (Under the Hood)

This game isn't just an RPG; it's a full academic implementation of AI Symbolic and Probabilistic Reasoning:
- **Ontology & Frames:** The entire clothing catalog is structured as semantic Frames with normalized continuous variables (temperature, formality) and discrete properties (texture, color).
- **Bayesian Inference:** Frank updates his mental model of your outfit in real-time by multiplying the probability weights of your answers against his database.
- **Extended Kalman Filter:** To detect lies, the system tracks the "mathematical tension" (innovation) between your current answer and the running average of your previous answers. High tension = Strike.



---

## 🛠️ Tech Stack

- **Phaser 3** - Game engine for rendering, animations, and game loop.
- **JavaScript (ES6+)** - Custom inference engine and AI logic.
- **Vite** - Lightning-fast build tool and development server.
- **Howler.js** - Audio management for that classic jazz aesthetic.

---

## 🚀 Running Locally

To play the game on your local machine:

1. Clone the repository.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000` (or the port provided in the terminal).

Enjoy the mind games!