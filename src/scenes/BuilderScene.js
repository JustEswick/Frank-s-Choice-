import Phaser from 'phaser';
import { t, getLang } from '../utils/i18n.js';
import garmentsData from '../data/garments.json';
import UIButton from '../utils/UIButton.js';
import VolumeControl from '../utils/VolumeControl.js';
import { getGarmentOffsets } from '../data/garmentOffsets.js';

const CATEGORIES = ['superior', 'inferior', 'calzado', 'accesorio', 'capa', 'conjunto'];

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

    this.add.image(0, 0, 'bg-builder').setOrigin(0, 0).setDisplaySize(width, height);

    this.volumeControl = new VolumeControl(this, width - 36, 36, { depth: 90 });

    // Title removed as requested

    const mannequinX = width / 2;
    const mannequinY = height / 2 + 25;
    this.mannequinX = mannequinX;
    this.mannequinY = mannequinY;

    this.mannequin = this.add.image(mannequinX, mannequinY, 'mannequin');
    this.mannequin.setDisplaySize(180, 525);
    this.mannequin.setOrigin(0.5, 0.5);
    this.mannequin.setDepth(1);

    this.garmentDisplayContainer = this.add.container(0, 0);
    this.garmentDisplayContainer.setDepth(5);

    this.createTabs();
    this.createThumbnailPanel();
    this.createReadyButton();
    this.createRemoveButton();
    this.createExitButton();
    this.createTipsButton();
    this.updateThumbnails();

    // Nicer scale text bubble that fades out
    this.debugText = this.add.text(width / 2, 100, '', {
      fontFamily: 'Inter',
      fontSize: '20px',
      color: '#FFFFFF',
      backgroundColor: '#000000AA',
      padding: { x: 16, y: 8 },
      fontStyle: 'bold'
    }).setDepth(1000).setOrigin(0.5, 0.5).setAlpha(0);

    audioManager.playMusic('jazz-main');
  }

  createTabs() {
    const { width, height } = this.cameras.main;
    const tabWidth = 100;
    const tabHeight = 36;
    const startX = width / 2 - (CATEGORIES.length * (tabWidth + 6)) / 2 + tabWidth / 2;
    const tabY = height - 24;

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
    this.thumbnailButtons.forEach(({ bg, thumbImg, label, header, headerBg }) => {
      if (bg) bg.destroy();
      if (thumbImg && thumbImg.destroy) thumbImg.destroy();
      if (label) label.destroy();
      if (header) header.destroy();
      if (headerBg) headerBg.destroy();
    });
    this.thumbnailButtons = [];

    const filtered = garmentsData.garments.filter(g => g.category === this.activeCategory);
    
    const groups = [
      { title: getLang() === 'es' ? 'Formales' : 'Formal', items: filtered.filter(g => (g.tags.formalidad || 0) >= 0.5) },
      { title: getLang() === 'es' ? 'Casuales' : 'Casual', items: filtered.filter(g => (g.tags.formalidad || 0) < 0.5) }
    ];

    const thumbSize = 80;
    const labelH = 30;
    const cellW = thumbSize;
    const cellH = thumbSize + labelH + 24;
    const hGap = 10;
    
    const offsetX = 20 + (230 - (2 * cellW + hGap)) / 2 + cellW / 2; 
    let currentY = 110;

    const audioManager = this.registry.get('audioManager');

    groups.forEach(group => {
      if (group.items.length === 0) return;

      const headerBg = this.add.rectangle(135, currentY, 180, 24, 0x4A3728, 0.8)
        .setStrokeStyle(1, 0xDAA520)
        .setOrigin(0.5, 0.5)
        .setDepth(10);

      const headerText = this.add.text(135, currentY, group.title, {
        fontFamily: 'Playfair Display',
        fontSize: '16px',
        color: '#FFF8E7',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(11);
      
      this.thumbnailButtons.push({ bg: this.add.rectangle(0,0,0,0), label: this.add.text(0,0,''), header: headerText, headerBg });

      currentY += 25;

      const cols = 2;
      group.items.forEach((garment, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = offsetX + col * (cellW + hGap);
        const y = currentY + row * cellH + cellW / 2;

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
            fontSize: '22px',
            color: '#4A3728',
            fontStyle: 'bold'
          }).setOrigin(0.5).setDepth(11);
        }

        const nameText = this.add.text(x, y + thumbSize / 2 + 4, garment.name.es, {
          fontFamily: 'Inter',
          fontSize: '11px',
          color: '#FFF8E7',
          stroke: '#4A3728',
          strokeThickness: 2,
          wordWrap: { width: cellW + 10 },
          align: 'center',
          fontStyle: 'bold'
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

      const rows = Math.ceil(group.items.length / cols);
      currentY += rows * cellH + 10;
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
    const perfectOffsets = getGarmentOffsets();
    
    let itemData = perfectOffsets[garment.id];
    if (Array.isArray(itemData)) itemData = itemData[0]; // Use first variant as spawn default

    const offset = itemData ? { x: itemData.x, y: itemData.y } : { x: 0, y: 0 };
    const scale = itemData ? itemData.scale : 1.2;

    const topLeftX = this.mannequinX + offset.x;
    const topLeftY = this.mannequinY + offset.y;

    let garmentImg;
    if (this.textures.exists(spriteKey)) {
      garmentImg = this.add.image(topLeftX, topLeftY, spriteKey);
      const categoryDepths = { calzado: 1, inferior: 2, superior: 3, conjunto: 3, accesorio: 4, capa: 5 };
      garmentImg.setDepth(categoryDepths[garment.category] || 1);
      
      // Drag and scale feature for precise alignment
      garmentImg.setInteractive({ draggable: true });
      this.input.setDraggable(garmentImg);
      
      const showScale = (scale) => {
        this.debugText.setText(`Escala: ${scale.toFixed(2)}x`);
        this.debugText.setAlpha(1);
        if (this.debugTextTimer) this.debugTextTimer.remove();
        this.debugTextTimer = this.time.delayedCall(1500, () => {
          this.tweens.add({ targets: this.debugText, alpha: 0, duration: 500 });
        });
      };

      garmentImg.on('drag', (pointer, dragX, dragY) => {
        garmentImg.x = dragX;
        garmentImg.y = dragY;
      });

      let lastScaleTime = 0;
      garmentImg.on('wheel', (pointer, dx, dy, dz) => {
        const currentScale = garmentImg.scale;
        const newScale = currentScale + (dy > 0 ? -0.05 : 0.05);
        garmentImg.setScale(Math.max(0.1, newScale));
        
        showScale(garmentImg.scale);

        const now = this.time.now;
        if (now - lastScaleTime > 100) {
          lastScaleTime = now;
          this.time.delayedCall(50, () => {
            const audioManager = this.registry.get('audioManager');
            audioManager.playSFX('select');
          });
        }
      });

    } else {
      const placeholder = this.add.rectangle(
        topLeftX + 100,
        topLeftY + 75,
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
    const hasTorso = this.outfit.superior || this.outfit.conjunto;
    const hasLegs = this.outfit.inferior || this.outfit.conjunto;
    const hasShoes = this.outfit.calzado;

    // Optional but requested by user: Force one of EVERY type if they said "de cada tipo", 
    // but usually accessory and layer are optional. Let's force at least the body to be covered.
    // However, the user said "escoja una prenda de cada tipo". Let's enforce everything except capa/accesorio, 
    // or if they meant everything, we enforce it. We'll enforce torso, legs, and shoes as the bare minimum.
    if (!hasTorso || !hasLegs || !hasShoes) {
      this.showWarning(
        getLang() === 'es' ? '¡Vístete por completo!\n(Torso, Piernas y Calzado)' : 'Dress completely!\n(Torso, Legs & Shoes)'
      );
      return;
    }

    if (Object.keys(this.outfit).length === 0) return;
    const outfitArray = Object.values(this.outfit).map(g => {
      const entry = this.mannequinGarments[g.category];
      const customOffset = entry && entry.image ? { x: entry.image.x - this.mannequinX, y: entry.image.y - this.mannequinY } : null;
      const customScale = entry && entry.image ? entry.image.scale : null;
      return {
        id: g.id,
        category: g.category,
        name: g.name,
        tags: g.tags,
        customOffset,
        customScale
      };
    });
    this.registry.set('playerOutfit', outfitArray);
    this.cameras.main.fadeOut(500, 74, 55, 40);
    this.time.delayedCall(500, () => this.goToScene('QuizScene'));
  }

  showWarning(text) {
    const audioManager = this.registry.get('audioManager');
    if (audioManager) audioManager.playSFX('remove');

    const { width, height } = this.cameras.main;
    const warnBg = this.add.rectangle(width / 2, height / 2, 400, 100, 0x882222, 0.9)
      .setStrokeStyle(4, 0x551111).setDepth(2000);
    const warnTxt = this.add.text(width / 2, height / 2, text, {
      fontFamily: 'Inter',
      fontSize: '20px',
      color: '#FFFFFF',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2001);

    this.tweens.add({
      targets: [warnBg, warnTxt],
      y: '-=20',
      alpha: 0,
      delay: 1500,
      duration: 500,
      onComplete: () => {
        warnBg.destroy();
        warnTxt.destroy();
      }
    });
  }

  goToScene(key) {
    this.scene.start(key);
  }

  createRemoveButton() {
    const { width, height } = this.cameras.main;
    const removeLabel = getLang() === 'es' ? 'Quitar prenda' : 'Remove garment';

    this.removeBtn = new UIButton(this, width - 100, height - 90, 160, 32, removeLabel, {
      sfx: 'remove',
      fillColor: 0xAA4444,
      hoverColor: 0x883333,
      strokeColor: 0x882222,
      fontSize: '13px',
      depth: 100,
      callback: () => this.onRemove()
    });
  }

  createExitButton() {
    const exitLabel = getLang() === 'es' ? 'Salir' : 'Exit';
    
    this.exitBtn = new UIButton(this, 90, 40, 120, 32, exitLabel, {
      sfx: 'click',
      fillColor: 0x8B7355,
      hoverColor: 0x7A6345,
      strokeColor: 0x6B5335,
      fontSize: '14px',
      depth: 100,
      callback: () => this.scene.start('MenuScene')
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

  createTipsButton() {
    const { width } = this.cameras.main;
    const tipsLabel = getLang() === 'es' ? '💡 Tips' : '💡 Tips';
    
    this.tipsBtn = new UIButton(this, width - 200, 40, 100, 32, tipsLabel, {
      sfx: 'click',
      fillColor: 0xDAA520,
      hoverColor: 0xC4941A,
      strokeColor: 0xB8860B,
      textColor: '#4A3728',
      fontSize: '14px',
      depth: 100,
      callback: () => this.toggleTips()
    });

    const tipsText = getLang() === 'es' 
      ? '¡Usa la ruedita del mouse\npara ajustar el tamaño\nde la ropa seleccionada!'
      : 'Use the mouse wheel\nto resize the\nselected clothing!';

    this.tipsContainer = this.add.container(width - 200, 105).setDepth(200).setAlpha(0);
    
    const bg = this.add.rectangle(0, 0, 240, 80, 0x2A1F16, 0.95).setStrokeStyle(2, 0xDAA520);
    const txt = this.add.text(0, 0, tipsText, {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#FFF8E7',
      align: 'center',
      wordWrap: { width: 220 }
    }).setOrigin(0.5);

    this.tipsContainer.add([bg, txt]);
    this.tipsVisible = false;
  }

  toggleTips() {
    this.tipsVisible = !this.tipsVisible;
    this.tweens.add({
      targets: this.tipsContainer,
      alpha: this.tipsVisible ? 1 : 0,
      duration: 200
    });
  }
}
