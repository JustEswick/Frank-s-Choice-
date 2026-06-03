import Phaser from 'phaser';
import { t } from '../utils/i18n.js';
import PersistenceManager from '../systems/PersistenceManager.js';
import UIButton from '../utils/UIButton.js';
import { getGarmentOffsets } from '../data/garmentOffsets.js';

const CATEGORIES = ['superior', 'inferior', 'conjunto', 'calzado', 'accesorio', 'capa'];
const REVEAL_DELAY = 900;
const SFX_DELAY = 400;
const SCORE_TWEEN_DURATION = 1500;
const GREEN = 0x2E8B57;
const RED = 0xCC3333;
const MAX_POSSIBLE_SCORE = CATEGORIES.length * 20;

// Mannequin display size and center positions (mannequin: source 385x1123, aspect 1:2.92).
// 150x438 keeps the original aspect ratio and clears the score text at the bottom.
const MANNEQUIN_W = 150;
const MANNEQUIN_H = 438;
const FRANK_X = 240;
const PLAYER_X = 1040;
const MANNEQUIN_Y = 345;

export default class RevealScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RevealScene' });
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
  }

  create() {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    this.playerOutfit = this.registry.get('playerOutfit') || [];
    this.frankOutfit = this.registry.get('frankOutfit') || [];
    this.recommendationEngine = this.registry.get('recommendationEngine');
    this.breakdown = [];
    this.revealedCount = 0;

    this.add.image(0, 0, 'bg-reveal').setOrigin(0, 0).setDisplaySize(width, height);

    this.createMedallion();

    // Labels: Frank on LEFT, player on RIGHT.
    this.add.text(FRANK_X, 90, t('frank_outfit'), {
      fontFamily: 'Inter',
      fontSize: '18px',
      color: '#FFF8E7',
      stroke: '#4A3728',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(PLAYER_X, 90, t('your_outfit'), {
      fontFamily: 'Inter',
      fontSize: '18px',
      color: '#FFF8E7',
      stroke: '#4A3728',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Build two mannequins (one per side) with their respective outfits.
    this.frankMannequin = this.buildMannequin(FRANK_X, MANNEQUIN_Y, this.frankOutfit, 'frank');
    this.playerMannequin = this.buildMannequin(PLAYER_X, MANNEQUIN_Y, this.playerOutfit, 'player');

    // Stacked category result rows in the middle column.
    this.categoryResults = {};
    this.revealSlots = [];

    const rowStartY = 180;
    const rowStep = 65;

    CATEGORIES.forEach((cat, i) => {
      const y = rowStartY + i * rowStep;

      const plateW = 130;
      const plateH = 56;

      const plateBg = this.add.rectangle(width / 2, y + 10, plateW, plateH, 0x2A1F18, 0.6)
        .setStrokeStyle(2, 0xDAA520);

      const cornerSize = 8;
      const cornerColor = 0xDAA520;
      const cornerPositions = [
        { x: width / 2 - plateW / 2, y: y + 10 - plateH / 2 },
        { x: width / 2 + plateW / 2, y: y + 10 - plateH / 2 },
        { x: width / 2 - plateW / 2, y: y + 10 + plateH / 2 },
        { x: width / 2 + plateW / 2, y: y + 10 + plateH / 2 }
      ];
      const corners = cornerPositions.map(pos =>
        this.add.rectangle(pos.x, pos.y, cornerSize, cornerSize, cornerColor)
      );

      const catLabel = this.add.text(width / 2, y, t(`categories.${cat}`), {
        fontFamily: 'Playfair Display',
        fontSize: '13px',
        color: '#FFF8E7',
        stroke: '#4A3728',
        strokeThickness: 2,
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0.9);

      const resultText = this.add.text(width / 2, y + 18, '', {
        fontFamily: 'Inter',
        fontSize: '22px',
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0);

      this.revealSlots.push({ catLabel, resultText, y, category: cat, plateBg, corners });
      this.categoryResults[cat] = { resultText, playerGarment: null, frankGarment: null };
    });

    this.scoreText = this.add.text(width / 2, height - 110, '', {
      fontFamily: 'Playfair Display',
      fontSize: '48px',
      color: '#DAA520',
      stroke: '#1A0F08',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);

    this.scoreLabel = this.add.text(width / 2, height - 140, '', {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#FFF8E7',
      stroke: '#4A3728',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);

    this.createButtons();
    this.startReveal();
    audioManager.playSFX('reveal');
  }

  createMedallion() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    const cy = 40;

    // Wide banner for better legibility
    this.add.rectangle(cx, cy, 260, 44, 0x1A0F08, 0.85)
      .setStrokeStyle(2, 0xDAA520);
      
    this.add.text(cx, cy, t('similarity'), {
      fontFamily: 'Playfair Display',
      fontSize: '22px',
      color: '#DAA520',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  buildMannequin(centerX, centerY, outfitArray, side) {
    const container = this.add.container(centerX, centerY);

    const mannequinImg = this.add.image(0, 0, 'mannequin');
    mannequinImg.setDisplaySize(MANNEQUIN_W, MANNEQUIN_H);
    mannequinImg.setOrigin(0.5, 0.5);
    mannequinImg.setDepth(1);
    container.add(mannequinImg);

    const garmentDisplayContainer = this.add.container(0, 0);
    garmentDisplayContainer.setDepth(5);
    container.add(garmentDisplayContainer);

    const garmentLayers = {};
    const categoryDepths = { calzado: 1, inferior: 2, superior: 3, conjunto: 3, accesorio: 4, capa: 5 };
    const perfectOffsets = getGarmentOffsets();

    outfitArray.forEach((garment) => {
      const spriteKey = `garment_${garment.id.replace(/_/g, '-')}`;
      
      let itemData = perfectOffsets[garment.id];
      if (Array.isArray(itemData)) itemData = itemData[0]; // Frank uses the first valid variant

      const defaultOffset = itemData ? { x: itemData.x, y: itemData.y } : { x: 0, y: 0 };
      const defaultScale = itemData ? itemData.scale : 1.2;

      let offset = defaultOffset;
      let scale = defaultScale;

      if (side === 'player') {
        if (garment.customOffset) offset = garment.customOffset;
        if (garment.customScale) scale = garment.customScale;
      } else {
        // Frank's outfit: steal the alignment from the player's outfit for the same category!
        const playerMatchingCategory = this.playerOutfit.find(g => g.category === garment.category);
        if (playerMatchingCategory && playerMatchingCategory.customOffset) {
          offset = playerMatchingCategory.customOffset;
        }
        if (playerMatchingCategory && playerMatchingCategory.customScale) {
          scale = playerMatchingCategory.customScale;
        }
      }

      let garmentImg;
      if (this.textures.exists(spriteKey)) {
        const revealScaleRatio = 150 / 180; // MANNEQUIN_W in Reveal vs Builder
        const finalScale = scale * revealScaleRatio;
        const scaledOffsetX = offset.x * revealScaleRatio;
        const scaledOffsetY = offset.y * revealScaleRatio;
        
        garmentImg = this.add.image(scaledOffsetX, scaledOffsetY, spriteKey);
        garmentImg.setScale(finalScale);
        garmentImg.setDepth(categoryDepths[garment.category] || 1);
      } else {
        garmentImg = this.add.rectangle(
          offset.x + 100,
          offset.y + 75,
          200 * scale,
          150 * scale,
          0xCCCCFF,
          0.6
        );
      }
      garmentImg.setAlpha(0);
      garmentDisplayContainer.add(garmentImg);
      garmentLayers[garment.category] = garmentImg;
    });

    container.setDepth(5);
    return { container, garmentLayers, mannequinImg };
  }

  startReveal() {
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
    const audioManager = this.registry.get('audioManager');
    const slot = this.revealSlots[index];
    const result = this.categoryResults[cat];

    const playerGarment = (this.playerOutfit || []).find(g => g.category === cat) || null;
    const frankGarment = (this.frankOutfit || []).find(g => g.category === cat) || null;

    result.playerGarment = playerGarment;
    result.frankGarment = frankGarment;

    // Fade in garments on BOTH mannequins for this category.
    const playerLayer = this.playerMannequin.garmentLayers[cat];
    const frankLayer = this.frankMannequin.garmentLayers[cat];

    if (playerLayer) {
      this.tweens.add({ targets: playerLayer, alpha: 1, duration: 300, ease: 'Power2' });
    }
    if (frankLayer) {
      this.tweens.add({ targets: frankLayer, alpha: 1, duration: 300, ease: 'Power2' });
    }

    const isMatch = playerGarment && frankGarment && playerGarment.id === frankGarment.id;
    let score = isMatch ? 20 : 0;
    
    // Tailor Mechanic: Check how closely the player aligned their garment to the PERFECT obfuscated offsets!
    let tailorBonus = 0;
    if (playerGarment && playerGarment.customOffset) {
      const perfectOffsets = getGarmentOffsets();
      let targets = perfectOffsets[playerGarment.id] || [];
      if (!Array.isArray(targets)) targets = [targets];
      
      if (targets.length > 0) {
        // Find the closest variant (e.g. left vs right wrist for watch)
        let minDistance = Infinity;
        targets.forEach(t => {
          const dx = playerGarment.customOffset.x - t.x;
          const dy = playerGarment.customOffset.y - t.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDistance) minDistance = dist;
        });

        // Award up to 5 bonus points for perfect alignment (distance < 15 pixels)
        if (minDistance <= 15) {
          tailorBonus = 5;
        } else if (minDistance <= 40) {
          tailorBonus = 2;
        }
      }
    }
    
    score += tailorBonus;

    this.breakdown.push({ category: cat, score, match: isMatch, tailorBonus });

    this.time.delayedCall(SFX_DELAY, () => {
      if (isMatch) {
        result.resultText.setText('\u2713');
        result.resultText.setColor('#' + GREEN.toString(16).padStart(6, '0'));
        audioManager.playSFX('match');
      } else {
        result.resultText.setText('\u2717');
        result.resultText.setColor('#' + RED.toString(16).padStart(6, '0'));
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
    const basePossible = CATEGORIES.length * 20;
    // Total possible is base matching + up to 5 tailor bonus points per category
    const maxWithBonus = basePossible + (CATEGORIES.length * 5); 
    
    const totalScore = this.breakdown.reduce((sum, b) => sum + b.score, 0);
    // Calculate percentage against the base, allowing them to go over 100% if they matched AND aligned perfectly!
    let finalPercent = Math.round((totalScore / basePossible) * 100);
    
    // Capped at 125% visually, but the raw score is saved correctly.
    
    this.scoreLabel.setText('Similitud + Bono de Sastre');
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
        current += finalPercent / 100;
        if (current >= finalPercent) {
          current = finalPercent;
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
      callback: () => this.goToBuilder()
    });

    this.historyBtn = new UIButton(this, width * 0.7, height - 40, 160, 40, t('history'), {
      sfx: 'click',
      fillColor: 0x8B7355,
      hoverColor: 0x7A6345,
      strokeColor: 0x6B5335,
      fontSize: '14px',
      depth: 50,
      callback: () => this.goToHistory()
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
    const scorePercent = Math.round((totalScore / MAX_POSSIBLE_SCORE) * 100);
    const playerIds = this.playerOutfit.map(g => g.id);
    const frankIds = this.frankOutfit.map(g => g.id);

    const roundData = {
      date: new Date().toISOString(),
      score: scorePercent,
      breakdown: this.breakdown,
      playerOutfit: playerIds,
      frankOutfit: frankIds
    };

    PersistenceManager.addRound(roundData);
    PersistenceManager.updateProfile({ score: scorePercent });

    if (this.recommendationEngine) {
      this.recommendationEngine.learnFromRound(playerIds, frankIds);
    }
  }

  goToBuilder() {
    this.cameras.main.fadeOut(500, 74, 55, 40);
    this.time.delayedCall(500, () => this.goToScene('BuilderScene'));
  }

  goToHistory() {
    this.cameras.main.fadeOut(500, 74, 55, 40);
    this.time.delayedCall(500, () => this.goToScene('HistoryScene'));
  }

  goToScene(key) {
    this.scene.start(key);
  }
}
