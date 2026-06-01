import Phaser from 'phaser';
import { t, getLang } from '../utils/i18n.js';
import garmentsData from '../data/garments.json';

const CATEGORIES = ['superior', 'inferior', 'calzado', 'accesorio', 'capa'];

const CATEGORY_OFFSETS = {
  superior: { x: 150, y: 100 },
  inferior: { x: 150, y: 200 },
  calzado: { x: 150, y: 380 },
  accesorio: { x: 180, y: 60 },
  capa: { x: 150, y: 140 }
};

const CATEGORY_SCALES = {
  superior: 1,
  inferior: 1,
  calzado: 0.8,
  accesorio: 0.7,
  capa: 1.1
};

export default class BuilderScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BuilderScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    this.outfit = {};
    this.activeCategory = CATEGORIES[0];
    this.mannequinGarments = {};
    this.thumbnailButtons = [];
    this.tabButtons = [];

    this.add.rectangle(width / 2, height / 2, width, height, 0xF5E6D3);

    this.add.text(width / 2, 30, t('title'), {
      fontFamily: 'Playfair Display',
      fontSize: '36px',
      color: '#4A3728',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const mannequinX = width / 2;
    const mannequinY = height / 2 - 20;
    this.mannequinX = mannequinX;
    this.mannequinY = mannequinY;

    this.mannequin = this.add.image(mannequinX, mannequinY, 'mannequin');
    this.mannequin.setDisplaySize(300, 500);

    this.thumbnailContainer = this.add.container(0, 0);
    this.garmentDisplayContainer = this.add.container(0, 0);

    this.createTabs();
    this.createThumbnailPanel();
    this.createReadyButton();
    this.createRemoveButton();
    this.updateThumbnails();
  }

  createTabs() {
    const { width, height } = this.cameras.main;
    const tabWidth = 140;
    const tabHeight = 40;
    const startX = width / 2 - (CATEGORIES.length * (tabWidth + 8)) / 2 + tabWidth / 2;
    const tabY = height - 40;

    CATEGORIES.forEach((cat, i) => {
      const x = startX + i * (tabWidth + 8);
      const bg = this.add.rectangle(x, tabY, tabWidth, tabHeight, 0x2E8B57)
        .setStrokeStyle(2, 0x1A5C3A)
        .setInteractive({ useHandCursor: true });

      const label = this.add.text(x, tabY, t(`categories.${cat}`), {
        fontFamily: 'Inter',
        fontSize: '14px',
        color: '#FFFFFF',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      if (cat !== this.activeCategory) {
        bg.setFillStyle(0x8B7355);
        bg.setStrokeStyle(2, 0x6B5335);
      }

      bg.on('pointerdown', () => {
        audioManager.playSFX('click');
        this.activeCategory = cat;
        this.refreshTabs();
        this.updateThumbnails();
      });

      this.tabButtons.push({ category: cat, bg, label });
    });
  }

  refreshTabs() {
    this.tabButtons.forEach(({ category, bg }) => {
      if (category === this.activeCategory) {
        bg.setFillStyle(0x2E8B57);
        bg.setStrokeStyle(2, 0x1A5C3A);
      } else {
        bg.setFillStyle(0x8B7355);
        bg.setStrokeStyle(2, 0x6B5335);
      }
    });
  }

  createThumbnailPanel() {
    this.thumbnailContainer.removeAll(true);
    this.thumbnailButtons = [];
  }

  updateThumbnails() {
    const audioManager = this.registry.get('audioManager');
    this.thumbnailContainer.removeAll(true);
    this.thumbnailButtons = [];

    const filtered = garmentsData.garments.filter(g => g.category === this.activeCategory);
    const thumbSize = 60;
    const padding = 8;
    const cols = 3;
    const startX = 30;
    const startY = 80;

    filtered.forEach((garment, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (thumbSize + padding) + thumbSize / 2;
      const y = startY + row * (thumbSize + padding + 16) + thumbSize / 2;

      const spriteKey = `garment_${garment.id.replace(/_/g, '-')}`;

      const bg = this.add.rectangle(x, y, thumbSize, thumbSize, 0xE8D5C0)
        .setStrokeStyle(2, this.outfit[this.activeCategory]?.id === garment.id ? 0x2E8B57 : 0xBBAA88)
        .setInteractive({ useHandCursor: true });

      let thumbImg;
      if (this.textures.exists(spriteKey)) {
        thumbImg = this.add.image(x, y, spriteKey);
        thumbImg.setDisplaySize(thumbSize - 8, thumbSize - 8);
      } else {
        thumbImg = this.add.text(x, y, garment.name.es.charAt(0), {
          fontFamily: 'Inter',
          fontSize: '18px',
          color: '#4A3728',
          fontStyle: 'bold'
        }).setOrigin(0.5);
      }

      const nameText = this.add.text(x, y + thumbSize / 2 + 4, garment.name.es, {
        fontFamily: 'Inter',
        fontSize: '9px',
        color: '#4A3728',
        wordWrap: { width: thumbSize + 10 },
        align: 'center'
      }).setOrigin(0.5, 0);

      bg.on('pointerdown', () => {
        audioManager.playSFX('select');
        this.selectGarment(garment);
        this.updateThumbnails();
      });

      this.thumbnailContainer.add([bg, thumbImg, nameText]);
      this.thumbnailButtons.push({ garment, bg });
    });
  }

  selectGarment(garment) {
    const audioManager = this.registry.get('audioManager');

    if (this.mannequinGarments[garment.category]) {
      const old = this.mannequinGarments[garment.category];
      this.tweens.add({
        targets: old.image,
        alpha: 0,
        duration: 200,
        onComplete: () => old.image.destroy()
      });
    }

    const spriteKey = `garment_${garment.id.replace(/_/g, '-')}`;
    const offset = CATEGORY_OFFSETS[garment.category] || { x: 150, y: 150 };
    const scale = CATEGORY_SCALES[garment.category] || 1;

    let garmentImg;
    if (this.textures.exists(spriteKey)) {
      garmentImg = this.add.image(this.mannequinX + offset.x - 150, this.mannequinY + offset.y - 250, spriteKey);
      garmentImg.setDisplaySize(300 * scale, 200 * scale);
    } else {
      const placeholder = this.add.rectangle(
        this.mannequinX + offset.x - 150 + 100,
        this.mannequinY + offset.y - 250 + 75,
        200 * scale,
        150 * scale,
        0xCCCCFF,
        0.6
      );
      garmentImg = placeholder;
    }

    garmentImg.setAlpha(0);
    this.garmentDisplayContainer.add(garmentImg);

    this.tweens.add({
      targets: garmentImg,
      alpha: 1,
      duration: 400,
      ease: 'Power2'
    });

    this.outfit[garment.category] = garment;
    this.mannequinGarments[garment.category] = { garment, image: garmentImg };
  }

  createReadyButton() {
    const { width, height } = this.cameras.main;

    this.readyBtnBg = this.add.rectangle(width - 100, height - 40, 140, 40, 0x2E8B57)
      .setStrokeStyle(2, 0x1A5C3A)
      .setInteractive({ useHandCursor: true });

    this.readyBtnLabel = this.add.text(width - 100, height - 40, t('ready'), {
      fontFamily: 'Inter',
      fontSize: '16px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.readyBtnBg.on('pointerdown', () => {
      if (Object.keys(this.outfit).length === 0) return;

      const audioManager = this.registry.get('audioManager');
      audioManager.playSFX('transition');

      const outfitArray = Object.values(this.outfit).map(g => ({
        id: g.id,
        category: g.category,
        name: g.name,
        tags: g.tags
      }));
      this.registry.set('playerOutfit', outfitArray);

      this.cameras.main.fadeOut(500, 74, 55, 40);
      this.time.delayedCall(500, () => {
        this.scene.start('QuizScene');
      });
    });

    this.readyBtnBg.on('pointerover', () => {
      if (Object.keys(this.outfit).length > 0) {
        this.readyBtnBg.setFillStyle(0x257045);
      }
    });
    this.readyBtnBg.on('pointerout', () => this.readyBtnBg.setFillStyle(0x2E8B57));
  }

  createRemoveButton() {
    const { width } = this.cameras.main;
    const mx = width / 2;

    this.removeBtnBg = this.add.rectangle(mx, this.mannequinY + 210, 160, 36, 0xAA4444)
      .setStrokeStyle(2, 0x882222)
      .setInteractive({ useHandCursor: true });

    const removeLabel = getLang() === 'es' ? 'Quitar prenda' : 'Remove garment';
    this.removeBtnLabel = this.add.text(mx, this.mannequinY + 210, removeLabel, {
      fontFamily: 'Inter',
      fontSize: '13px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.removeBtnBg.on('pointerdown', () => {
      const audioManager = this.registry.get('audioManager');
      if (!this.outfit[this.activeCategory]) return;

      audioManager.playSFX('remove');

      const entry = this.mannequinGarments[this.activeCategory];
      if (entry) {
        this.tweens.add({
          targets: entry.image,
          alpha: 0,
          duration: 300,
          onComplete: () => entry.image.destroy()
        });
        delete this.mannequinGarments[this.activeCategory];
      }
      delete this.outfit[this.activeCategory];
      this.updateThumbnails();
    });

    this.removeBtnBg.on('pointerover', () => this.removeBtnBg.setFillStyle(0x883333));
    this.removeBtnBg.on('pointerout', () => this.removeBtnBg.setFillStyle(0xAA4444));
  }
}
