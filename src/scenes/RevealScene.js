import Phaser from 'phaser';
import { t } from '../utils/i18n.js';
import PersistenceManager from '../systems/PersistenceManager.js';
import UIButton from '../utils/UIButton.js';

const CATEGORIES = ['superior', 'inferior', 'calzado', 'accesorio', 'capa'];
const REVEAL_DELAY = 300;
const SCORE_TWEEN_DURATION = 1500;
const BEIGE = 0xF5E6D3;
const BROWN = 0x4A3728;
const GREEN = 0x2E8B57;
const RED = 0xCC3333;

export default class RevealScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RevealScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    this.playerOutfit = this.registry.get('playerOutfit') || [];
    this.frankOutfit = this.registry.get('frankOutfit') || [];
    this.recommendationEngine = this.registry.get('recommendationEngine');
    this.breakdown = [];
    this.revealedCount = 0;

    this.add.rectangle(width / 2, height / 2, width, height, BEIGE);

    this.add.text(width / 2, 30, t('similarity'), {
      fontFamily: 'Playfair Display',
      fontSize: '36px',
      color: '#' + BROWN.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width * 0.25, 70, t('your_outfit'), {
      fontFamily: 'Inter',
      fontSize: '16px',
      color: '#' + BROWN.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width * 0.75, 70, t('frank_outfit'), {
      fontFamily: 'Inter',
      fontSize: '16px',
      color: '#' + BROWN.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.revealSlots = [];
    this.categoryResults = {};

    CATEGORIES.forEach((cat, i) => {
      const y = 110 + i * 80;
      const catLabel = this.add.text(width / 2, y, t(`categories.${cat}`), {
        fontFamily: 'Inter',
        fontSize: '13px',
        color: '#888888',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const playerSlot = this.createSlot(width * 0.25, y + 30, this.playerOutfit, cat);
      const frankSlot = this.createSlot(width * 0.75, y + 30, this.frankOutfit, cat);

      const resultText = this.add.text(width / 2, y + 30, '', {
        fontFamily: 'Inter',
        fontSize: '22px',
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0);

      this.revealSlots.push({ catLabel, playerSlot, frankSlot, resultText, y });
      this.categoryResults[cat] = { resultText, playerGarment: null, frankGarment: null };
    });

    this.scoreText = this.add.text(width / 2, height - 110, '', {
      fontFamily: 'Playfair Display',
      fontSize: '48px',
      color: '#' + BROWN.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);

    this.scoreLabel = this.add.text(width / 2, height - 140, '', {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5).setAlpha(0);

    this.createButtons();
    this.startReveal();
    audioManager.playSFX('reveal');
  }

  createSlot(x, y, outfitArray, category) {
    const garment = outfitArray.find(g => g.category === category);
    const container = this.add.container(x, y);

    if (garment) {
      const spriteKey = `garment_${garment.id.replace(/_/g, '-')}`;
      let img;
      if (this.textures.exists(spriteKey)) {
        img = this.add.image(0, 0, spriteKey);
        img.setDisplaySize(60, 45);
      } else {
        const placeholder = this.add.rectangle(0, 0, 60, 45, 0xCCCCFF, 0.6);
        img = placeholder;
      }
      img.setAlpha(0);
      container.add(img);
      return { container, img, garment };
    }

    const empty = this.add.rectangle(0, 0, 60, 45, 0xDDDDDD, 0.4)
      .setStrokeStyle(1, 0xBBBBBB);
    empty.setAlpha(0);
    container.add(empty);
    return { container, img: empty, garment: null };
  }

  startReveal() {
    const { width } = this.cameras.main;

    CATEGORIES.forEach((cat, i) => {
      this.time.delayedCall(i * REVEAL_DELAY, () => {
        this.revealCategory(cat, i);
      });
    });

    const totalDelay = CATEGORIES.length * REVEAL_DELAY + 200;
    this.time.delayedCall(totalDelay, () => {
      this.showScore();
      this.saveRoundData();
    });
  }

  revealCategory(cat, index) {
    const { width } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');
    const slot = this.revealSlots[index];
    const result = this.categoryResults[cat];

    const playerGarment = slot.playerSlot.garment;
    const frankGarment = slot.frankSlot.garment;

    result.playerGarment = playerGarment;
    result.frankGarment = frankGarment;

    this.tweens.add({
      targets: slot.playerSlot.img,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });

    this.tweens.add({
      targets: slot.frankSlot.img,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });

    const isMatch = playerGarment && frankGarment && playerGarment.id === frankGarment.id;
    const score = isMatch ? 20 : 0;
    this.breakdown.push({ category: cat, score, match: isMatch });

    this.time.delayedCall(200, () => {
      if (isMatch) {
        result.resultText.setText('\u2713');
        result.resultText.setColor('#' + GREEN.toString(16).padStart(6, '0'));
        audioManager.playSFX('match');
      } else {
        result.resultText.setText('\u2717');
        result.resultText.setColor('#' + RED.toString(16).padStart(6, '0'));
        audioManager.playSFX('mismatch');
      }

      this.tweens.add({
        targets: result.resultText,
        alpha: 1,
        duration: 200,
        ease: 'Power2'
      });
    });

    this.revealedCount++;
  }

  showScore() {
    const { width, height } = this.cameras.main;
    const totalScore = this.breakdown.reduce((sum, b) => sum + b.score, 0);

    this.scoreLabel.setText(t('score'));
    this.tweens.add({
      targets: this.scoreLabel,
      alpha: 1,
      duration: 300
    });

    this.scoreText.setText('0%');
    this.tweens.add({
      targets: this.scoreText,
      alpha: 1,
      duration: 300
    });

    let current = 0;
    const timer = this.time.addEvent({
      delay: SCORE_TWEEN_DURATION / 100,
      repeat: 99,
      callback: () => {
        current += totalScore / 100;
        if (current >= totalScore) {
          current = totalScore;
          timer.remove();
        }
        this.scoreText.setText(`${Math.round(current)}%`);
      }
    });
  }

  createButtons() {
    const { width, height } = this.cameras.main;

    this.playAgainBtn = new UIButton(this, width * 0.3, height - 40, 160, 40, t('play_again'), {
      sfx: 'click',
      fontSize: '14px',
      depth: 50,
      callback: () => {
        this.cameras.main.fadeOut(500, 74, 55, 40);
        this.time.delayedCall(500, () => {
          this.scene.start('BuilderScene');
        });
      }
    });

    this.historyBtn = new UIButton(this, width * 0.7, height - 40, 160, 40, t('history'), {
      sfx: 'click',
      fillColor: 0x8B7355,
      hoverColor: 0x7A6345,
      strokeColor: 0x6B5335,
      fontSize: '14px',
      depth: 50,
      callback: () => {
        this.cameras.main.fadeOut(500, 74, 55, 40);
        this.time.delayedCall(500, () => {
          this.scene.start('HistoryScene');
        });
      }
    });

    this.playAgainBtn.setVisible(false);
    this.historyBtn.setVisible(false);

    this.tweens.add({
      targets: [this.playAgainBtn.bg, this.playAgainBtn.label, this.historyBtn.bg, this.historyBtn.label],
      alpha: 1,
      duration: 400,
      delay: CATEGORIES.length * REVEAL_DELAY + 600,
      onStart: () => {
        this.playAgainBtn.setVisible(true);
        this.historyBtn.setVisible(true);
        this.playAgainBtn.bg.setAlpha(0);
        this.playAgainBtn.label.setAlpha(0);
        this.historyBtn.bg.setAlpha(0);
        this.historyBtn.label.setAlpha(0);
      }
    });
  }

  saveRoundData() {
    const totalScore = this.breakdown.reduce((sum, b) => sum + b.score, 0);
    const playerIds = this.playerOutfit.map(g => g.id);
    const frankIds = this.frankOutfit.map(g => g.id);

    const roundData = {
      date: new Date().toISOString(),
      score: totalScore,
      breakdown: this.breakdown,
      playerOutfit: playerIds,
      frankOutfit: frankIds
    };

    PersistenceManager.addRound(roundData);
    PersistenceManager.updateProfile({ score: totalScore });

    if (this.recommendationEngine) {
      this.recommendationEngine.learnFromRound(playerIds, frankIds);
    }
  }
}
