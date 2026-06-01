import Phaser from 'phaser';
import { t } from '../utils/i18n.js';
import RecommendationEngine from '../systems/RecommendationEngine.js';
import QuestionManager from '../systems/QuestionManager.js';

const TYPEWRITER_DELAY = 30;
const CONFIDENCE_THRESHOLD = 0.85;
const INTRO_TEXT = 'frank_intro';

export default class QuizScene extends Phaser.Scene {
  constructor() {
    super({ key: 'QuizScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    this.questionManager = new QuestionManager();
    this.recommendationEngine = new RecommendationEngine();
    this.currentQuestion = null;
    this.optionButtons = [];
    this.isTypewriting = false;
    this.typewriterTimer = null;

    this.add.rectangle(width / 2, height / 2, width, height, 0xF5E6D3);

    this.frank = this.add.image(150, height / 2 - 60, 'frank_idle');
    this.frank.setDisplaySize(this.frank.width * 1.5, this.frank.height * 1.5);

    this.outfitDisplayContainer = this.add.container(width - 120, height / 2 - 80);
    this.showPlayerOutfit();

    this.dialogueBg = this.add.rectangle(
      width / 2, height - 70, width * 0.9, 120, 0x4A3728, 0.9
    ).setStrokeStyle(2, 0xDAA520);

    this.dialogueText = this.add.text(width / 2, height - 110, '', {
      fontFamily: 'Inter',
      fontSize: '18px',
      color: '#F5E6D3',
      wordWrap: { width: width * 0.82 },
      lineSpacing: 6,
      align: 'center'
    }).setOrigin(0.5);

    this.progressBg = this.add.rectangle(width - 90, height - 30, 120, 10, 0x888888);
    this.progressFill = this.add.rectangle(
      width - 150, height - 30, 0, 10, 0x2E8B57
    ).setOrigin(0, 0.5);
    this.progressText = this.add.text(width - 90, height - 50, '0/30', {
      fontFamily: 'Inter',
      fontSize: '12px',
      color: '#4A3728'
    }).setOrigin(0.5);

    audioManager.playMusic('jazz-quiz');

    this.showIntro();
  }

  showPlayerOutfit() {
    const playerOutfit = this.registry.get('playerOutfit') || [];
    this.outfitDisplayContainer.removeAll(true);

    const label = this.add.text(0, -120, t('your_outfit'), {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#4A3728',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.outfitDisplayContainer.add(label);

    playerOutfit.forEach((garment, i) => {
      const y = i * 55 - 60;
      const spriteKey = `garment_${garment.id.replace(/_/g, '-')}`;

      const bg = this.add.rectangle(0, y, 80, 45, 0xE8D5C0)
        .setStrokeStyle(1, 0xBBAA88);

      let img;
      if (this.textures.exists(spriteKey)) {
        img = this.add.image(0, y, spriteKey);
        img.setDisplaySize(70, 38);
      } else {
        img = this.add.text(0, y, garment.name.es.charAt(0), {
          fontFamily: 'Inter',
          fontSize: '16px',
          color: '#4A3728',
          fontStyle: 'bold'
        }).setOrigin(0.5);
      }

      this.outfitDisplayContainer.add([bg, img]);
    });
  }

  showIntro() {
    const audioManager = this.registry.get('audioManager');
    this.typewriteText(t(INTRO_TEXT), () => {
      audioManager.playSFX('click');
      this.time.delayedCall(800, () => this.askNextQuestion());
    });
  }

  typewriteText(text, onComplete) {
    const audioManager = this.registry.get('audioManager');
    this.isTypewriting = true;
    this.dialogueText.setText('');
    this.frank.setTexture('frank_talk');

    let index = 0;
    this.typewriterTimer = this.time.addEvent({
      delay: TYPEWRITER_DELAY,
      repeat: text.length - 1,
      callback: () => {
        this.dialogueText.text += text[index];
        if (index % 3 === 0) {
          audioManager.playSFX('typewriter');
        }
        index++;

        if (index >= text.length) {
          this.isTypewriting = false;
          this.frank.setTexture('frank_idle');
          if (onComplete) onComplete();
        }
      }
    });
  }

  skipTypewriter(text) {
    if (this.typewriterTimer) {
      this.typewriterTimer.remove();
    }
    this.dialogueText.setText(text);
    this.isTypewriting = false;
    this.frank.setTexture('frank_idle');
  }

  askNextQuestion() {
    const confidence = this.recommendationEngine.getConfidence();

    if (confidence > CONFIDENCE_THRESHOLD) {
      this.endQuiz();
      return;
    }

    const question = this.questionManager.getNextQuestion(
      this.recommendationEngine.weights
    );

    if (!question) {
      this.endQuiz();
      return;
    }

    this.currentQuestion = question;
    this.updateProgress();
    this.displayQuestion(question);
  }

  displayQuestion(question) {
    this.clearOptionButtons();

    const { width, height } = this.cameras.main;

    const questionText = question.text.es || question.text.en;
    this.typewriteText(questionText, () => {
      this.showOptions(question);
    });
  }

  showOptions(question) {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');
    const lang = this.registry.get('lang') || 'es';

    const startY = height - 200;
    const optionHeight = 36;
    const optionGap = 8;
    const optionWidth = 260;
    const optionX = width / 2;

    question.options.forEach((option, i) => {
      const y = startY - (question.options.length - 1 - i) * (optionHeight + optionGap);

      const bg = this.add.rectangle(optionX, y, optionWidth, optionHeight, 0xDAA520)
        .setStrokeStyle(2, 0xB8860B)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0);

      const label = option.label[lang] || option.label.es;

      const text = this.add.text(optionX, y, label, {
        fontFamily: 'Inter',
        fontSize: '15px',
        color: '#4A3728',
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: [bg, text],
        alpha: 1,
        duration: 200,
        delay: i * 80
      });

      bg.on('pointerover', () => bg.setFillStyle(0xC4941A));
      bg.on('pointerout', () => bg.setFillStyle(0xDAA520));
      bg.on('pointerdown', () => {
        audioManager.playSFX('click');
        this.selectAnswer(option);
      });

      this.optionButtons.push({ bg, text });
    });
  }

  clearOptionButtons() {
    this.optionButtons.forEach(({ bg, text }) => {
      bg.destroy();
      text.destroy();
    });
    this.optionButtons = [];
  }

  selectAnswer(option) {
    this.recommendationEngine.addAnswer(option);
    this.clearOptionButtons();
    this.askNextQuestion();
  }

  updateProgress() {
    const asked = this.questionManager.getAskedCount();
    const total = this.questionManager.getTotal();
    const progress = asked / total;

    this.progressFill.setSize(120 * progress, 10);
    this.progressText.setText(`${asked}/${total}`);
  }

  endQuiz() {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    this.clearOptionButtons();

    const recommendations = this.recommendationEngine.getRecommendations();
    const frankOutfit = Object.values(recommendations).flat().map(g => ({
      id: g.id,
      category: g.category,
      name: g.name,
      tags: g.tags
    }));

    this.registry.set('frankOutfit', frankOutfit);
    this.registry.set('recommendationEngine', this.recommendationEngine);

    this.typewriteText(t('frank_confident'), () => {
      audioManager.playSFX('transition');
      this.cameras.main.fadeOut(500, 74, 55, 40);
      this.time.delayedCall(500, () => {
        this.scene.start('RevealScene');
      });
    });
  }
}
