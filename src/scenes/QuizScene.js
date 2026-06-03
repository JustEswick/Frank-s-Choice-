import Phaser from 'phaser';
import { t } from '../utils/i18n.js';
import RecommendationEngine from '../systems/RecommendationEngine.js';
import QuestionManager from '../systems/QuestionManager.js';
import UIButton from '../utils/UIButton.js';
import VolumeControl from '../utils/VolumeControl.js';

const TYPEWRITER_DELAY = 30;
const TYPEWRITER_SFX_INTERVAL = 400;
const CONFIDENCE_THRESHOLD = 0.85;
const MIN_QUESTIONS_BEFORE_END = 2;
const INTRO_TEXT = 'frank_intro';

export default class QuizScene extends Phaser.Scene {
  constructor() {
    super({ key: 'QuizScene' });
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
  }

  create() {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    if (this.typewriterTimer) {
      this.typewriterTimer.remove();
      this.typewriterTimer = null;
    }
    if (this.delayedCallTimer) {
      this.delayedCallTimer.remove();
      this.delayedCallTimer = null;
    }

    this.questionManager = new QuestionManager();
    this.recommendationEngine = new RecommendationEngine();
    this.currentQuestion = null;
    this.optionButtons = [];
    this.isTypewriting = false;
    this.typewriterTimer = null;
    this.lastTypewriterSfx = 0;

    this.add.image(0, 0, 'bg-quiz').setOrigin(0, 0).setDisplaySize(width, height);

    this.volumeControl = new VolumeControl(this, width - 36, 36, { depth: 90 });

    // Frank: Anchored to the bottom center, moved down to prevent floating, scaled up, moved left, with ChromaKey.
    this.frank = this.add.sprite(width / 2 - 120, height + 140, 'frank-idle');
    this.frank.setOrigin(0.5, 1);
    this.frank.setScale(1.6); // Gran tamaño
    this.frank.setPostPipeline('ChromaKeyPipeline');
    this.frank.setDepth(5);

    this.outfitDisplayContainer = this.add.container(width - 100, 90);
    this.showPlayerOutfit();

    this.dialogueBg = this.add.rectangle(
      width / 2, height - 50, width * 0.85, 80, 0x4A3728, 0.9
    ).setStrokeStyle(2, 0xDAA520).setDepth(10);

    this.dialogueText = this.add.text(width / 2, height - 50, '', {
      fontFamily: 'Inter',
      fontSize: '18px',
      color: '#F5E6D3',
      wordWrap: { width: width * 0.75 },
      lineSpacing: 6,
      align: 'center'
    }).setOrigin(0.5).setDepth(11);

    const barWidth = 200;
    const barX = width / 2;
    const barY = 30;

    this.progressBg = this.add.rectangle(barX, barY, barWidth, 14, 0x2A1F18, 0.8)
        .setStrokeStyle(2, 0xDAA520).setDepth(20);
    this.progressFill = this.add.rectangle(
      barX - barWidth / 2 + 2, barY, 0, 10, 0x2E8B57
    ).setOrigin(0, 0.5).setDepth(21);
    this.progressText = this.add.text(barX, barY + 22, '0/30', {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#FFF8E7',
      stroke: '#4A3728',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(21);

    audioManager.playMusic('jazz-quiz');

    this.frank.play('frank_intro');
    this.frank.once('animationcomplete-frank_intro', () => {
      this.frank.play('frank_writing');
      this.showIntro();
    });
  }

  showPlayerOutfit() {
    const playerOutfit = this.registry.get('playerOutfit') || [];
    this.outfitDisplayContainer.removeAll(true);

    const label = this.add.text(0, -10, t('your_outfit'), {
      fontFamily: 'Playfair Display',
      fontSize: '18px',
      color: '#FFF8E7',
      stroke: '#4A3728',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.outfitDisplayContainer.add(label);

    playerOutfit.forEach((garment, i) => {
      const y = 40 + i * 52;
      const spriteKey = `garment_${garment.id.replace(/_/g, '-')}`;

      const bg = this.add.rectangle(0, y, 80, 42, 0xE8D5C0)
        .setStrokeStyle(1, 0xBBAA88);

      let img;
      if (this.textures.exists(spriteKey)) {
        img = this.add.image(0, y, spriteKey);
        img.setDisplaySize(70, 36);
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
    this.lastTypewriterSfx = 0;

    let index = 0;
    this.typewriterTimer = this.time.addEvent({
      delay: TYPEWRITER_DELAY,
      repeat: text.length - 1,
      callback: () => {
        this.dialogueText.text += text[index];

        const now = this.time.now;
        if (now - this.lastTypewriterSfx >= TYPEWRITER_SFX_INTERVAL) {
          audioManager.playSFX('typewriter');
          this.lastTypewriterSfx = now;
        }
        index++;

        if (index >= text.length) {
          this.isTypewriting = false;
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
  }

  askNextQuestion() {
    const confidence = this.recommendationEngine.getConfidence();
    const askedEnough = this.questionManager.getAskedCount() >= MIN_QUESTIONS_BEFORE_END;

    if (askedEnough && confidence > CONFIDENCE_THRESHOLD) {
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

    if (this.typewriterTimer) {
      this.typewriterTimer.remove();
      this.typewriterTimer = null;
    }

    const { width, height } = this.cameras.main;

    const questionText = question.text.es || question.text.en;
    this.typewriteText(questionText, () => {
      this.showOptions(question);
    });
  }

  showOptions(question) {
    const { width, height } = this.cameras.main;
    const lang = this.registry.get('lang') || 'es';

    const optionHeight = 38;
    const optionGap = 10;
    const optionWidth = 260;
    const optionX = 950;
    const startY = 200;

    question.options.forEach((option, i) => {
      const y = startY + i * (optionHeight + optionGap);

      const label = option.label[lang] || option.label.es;

      const btn = new UIButton(this, optionX, y, optionWidth, optionHeight, label, {
        sfx: 'click',
        fillColor: 0xDAA520,
        hoverColor: 0xC4941A,
        strokeColor: 0xB8860B,
        textColor: '#4A3728',
        fontSize: '16px',
        depth: 50,
        callback: () => this.selectAnswer(option)
      });

      btn.bg.setAlpha(0);
      btn.label.setAlpha(0);

      this.tweens.add({
        targets: [btn.bg, btn.label],
        alpha: 1,
        duration: 200,
        delay: i * 80
      });

      this.optionButtons.push(btn);
    });
  }

  clearOptionButtons() {
    this.optionButtons.forEach(btn => btn.destroy());
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

    this.progressFill.setSize(196 * progress, 10);
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
      this.frank.play('frank_close');
      this.frank.once('animationcomplete-frank_close', () => {
        audioManager.playSFX('transition');
        this.cameras.main.fadeOut(500, 74, 55, 40);
        this.time.delayedCall(500, () => this.goToScene('RevealScene'));
      });
    });
  }

  goToScene(key) {
    this.scene.start(key);
  }
}
