import Phaser from 'phaser';
import { t, getLang } from '../utils/i18n.js';
import garmentsData from '../data/garments.json';
import UIButton from '../utils/UIButton.js';

const CATEGORIES = ['superior', 'inferior', 'calzado', 'accesorio', 'capa', 'conjunto'];

const CATEGORY_OFFSETS = {
  superior: { x: 150, y: 100 },
  inferior: { x: 150, y: 200 },
  calzado: { x: 150, y: 380 },
  accesorio: { x: 180, y: 60 },
  capa: { x: 150, y: 140 },
  conjunto: { x: 150, y: 150 }
};

const CATEGORY_SCALES = {
  superior: 1,
  inferior: 1,
  calzado: 0.8,
  accesorio: 0.7,
  capa: 1.1,
  conjunto: 1.3
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
    this.thumbnailZones = [];

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
    this.mannequin.setDepth(1);

    this.garmentDisplayContainer = this.add.container(0, 0);

    this.createTabs();
    this.createThumbnailPanel();
    this.createReadyButton();
    this.createRemoveButton();
    this.updateThumbnails();

    audioManager.playMusic('jazz-main');
  }

  createTabs() {
    const { width, height } = this.cameras.main;
    const tabWidth = 110;
    const tabHeight = 40;
    const startX = width / 2 - (CATEGORIES.length * (tabWidth + 6)) / 2 + tabWidth / 2;
    const tabY = height - 40;

    this.tabButtons = [];

    CATEGORIES.forEach((cat, i) => {
      const x = startX + i * (tabWidth + 6);
      const isActive = cat === this.activeCategory;

      const btn = new UIButton(this, x, tabY, tabWidth, tabHeight, t(`categories.${cat}`), {
        sfx: 'click',
        fillColor: isActive ? 0x2E8B57 : 0x8B7355,
        hoverColor: isActive ? 0x257045 : 0x7A6345,
        strokeColor: isActive ? 0x1A5C3A : 0x6B5335,
        fontSize: '12px',
        depth: 100,
        callback: () => this.selectCategory(cat)
      });

      this.tabButtons.push({ category: cat, btn, fillColor: isActive ? 0x2E8B57 : 0x8B7355 });
    });
  }

  selectCategory(cat) {
    this.activeCategory = cat;
    this.refreshTabs();
    this.updateThumbnails();
  }

  refreshTabs() {
    const isConjuntoActive = !!this.outfit.conjunto;
    const isSplitActive = !!this.outfit.superior || !!this.outfit.inferior;

    this.tabButtons.forEach(({ category, btn, fillColor }) => {
      const isActive = category === this.activeCategory;
      const isDisabled =
        (category === 'superior' || category === 'inferior') && isConjuntoActive
        || category === 'conjunto' && isSplitActive;

      const newFill = isActive ? 0x2E8B57 : (isDisabled ? 0x666666 : 0x8B7355);
      btn.fillColor = newFill;
      btn.bg.setFillStyle(newFill);

      if (isDisabled) {
        btn.bg.disableInteractive();
      } else {
        btn.bg.setInteractive({ useHandCursor: true });
      }
    });
  }

  createThumbnailPanel() {
    this.thumbnailZones = [];
  }

  updateThumbnails() {
    this.thumbnailZones = [];
    this.thumbnailButtons.forEach(({ bg, thumbImg, label }) => {
      bg.destroy();
      if (thumbImg && thumbImg.destroy) thumbImg.destroy();
      label.destroy();
    });
    this.thumbnailButtons = [];

    const filtered = garmentsData.garments.filter(g => g.category === this.activeCategory);
    const thumbSize = 60;
    const padding = 8;
    const cols = 3;
    const startX = 30;
    const startY = 80;

    const audioManager = this.registry.get('audioManager');

    filtered.forEach((garment, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (thumbSize + padding) + thumbSize / 2;
      const y = startY + row * (thumbSize + padding + 16) + thumbSize / 2;

      const spriteKey = `garment_${garment.id.replace(/_/g, '-')}`;
      const isSelected = this.outfit[this.activeCategory]?.id === garment.id;

      const bg = this.add.rectangle(x, y, thumbSize, thumbSize, 0xE8D5C0)
        .setStrokeStyle(2, isSelected ? 0x2E8B57 : 0xBBAA88)
        .setInteractive({ useHandCursor: true })
        .setDepth(10);

      let thumbImg;
      if (this.textures.exists(spriteKey)) {
        thumbImg = this.add.image(x, y, spriteKey);
        thumbImg.setDisplaySize(thumbSize - 8, thumbSize - 8);
        thumbImg.setDepth(11);
      } else {
        thumbImg = this.add.text(x, y, garment.name.es.charAt(0), {
          fontFamily: 'Inter',
          fontSize: '18px',
          color: '#4A3728',
          fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);
      }

      const nameText = this.add.text(x, y + thumbSize / 2 + 4, garment.name.es, {
        fontFamily: 'Inter',
        fontSize: '9px',
        color: '#4A3728',
        wordWrap: { width: thumbSize + 10 },
        align: 'center'
      }).setOrigin(0.5, 0).setDepth(11);

      bg.on('pointerover', () => bg.setFillStyle(0xF0E0D0));
      bg.on('pointerout', () => bg.setFillStyle(0xE8D5C0));
      bg.on('pointerdown', () => {
        audioManager.playSFX('select');
        this.selectGarment(garment);
        this.updateThumbnails();
      });

      this.thumbnailButtons.push({ garment, bg, thumbImg, label: nameText });
    });
  }

  selectGarment(garment) {
    if (garment.category === 'conjunto') {
      ['superior', 'inferior'].forEach(cat => {
        if (this.mannequinGarments[cat]) {
          const old = this.mannequinGarments[cat];
          this.tweens.add({
            targets: old.image,
            alpha: 0,
            duration: 200,
            onComplete: () => old.image.destroy()
          });
          delete this.mannequinGarments[cat];
          delete this.outfit[cat];
        }
      });
    } else {
      if (this.mannequinGarments.conjunto) {
        const old = this.mannequinGarments.conjunto;
        this.tweens.add({
          targets: old.image,
          alpha: 0,
          duration: 200,
          onComplete: () => old.image.destroy()
        });
        delete this.mannequinGarments.conjunto;
        delete this.outfit.conjunto;
      }
    }

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

    this.refreshTabs();
  }

  createReadyButton() {
    const { width, height } = this.cameras.main;
    this.readyBtn = new UIButton(this, width - 100, height - 40, 140, 40, t('ready'), {
      sfx: 'transition',
      fontSize: '16px',
      depth: 100,
      callback: () => this.onReady()
    });
  }

  onReady() {
    if (Object.keys(this.outfit).length === 0) return;
    const outfitArray = Object.values(this.outfit).map(g => ({
      id: g.id,
      category: g.category,
      name: g.name,
      tags: g.tags
    }));
    this.registry.set('playerOutfit', outfitArray);
    this.cameras.main.fadeOut(500, 74, 55, 40);
    this.time.delayedCall(500, () => this.goToScene('QuizScene'));
  }

  goToScene(key) {
    if (this.scene.get(key)) {
      this.scene.start(key);
      return;
    }
    import(`./${key}.js`)
      .then((m) => {
        this.scene.add(key, m.default, false);
        this.scene.start(key);
      })
      .catch((err) => console.error(`Failed to load ${key}:`, err));
  }

  createRemoveButton() {
    const { width } = this.cameras.main;
    const mx = width / 2;
    const removeLabel = getLang() === 'es' ? 'Quitar prenda' : 'Remove garment';

    this.removeBtn = new UIButton(this, mx, this.mannequinY + 210, 160, 36, removeLabel, {
      sfx: 'remove',
      fillColor: 0xAA4444,
      hoverColor: 0x883333,
      strokeColor: 0x882222,
      fontSize: '13px',
      depth: 100,
      callback: () => this.onRemove()
    });
  }

  onRemove() {
    if (!this.outfit[this.activeCategory]) return;
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
    this.refreshTabs();
  }
}
