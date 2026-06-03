import Phaser from 'phaser';
import garmentsData from '../data/garments.json';
import UIButton from '../utils/UIButton.js';

export default class AlignScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AlignScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    
    this.add.rectangle(0, 0, width, height, 0x333333).setOrigin(0, 0);

    const mannequinX = width / 2;
    const mannequinY = height / 2;
    
    this.mannequin = this.add.image(mannequinX, mannequinY, 'mannequin');
    this.mannequin.setDisplaySize(180, 525);
    this.mannequin.setOrigin(0.5, 0.5);

    this.garments = garmentsData.garments;
    this.currentIndex = 0;
    this.savedData = {};

    this.titleText = this.add.text(width / 2, 40, 'Modo de Ajuste de Prendas', {
      fontFamily: 'Inter', fontSize: '24px', color: '#FFF'
    }).setOrigin(0.5);

    this.infoText = this.add.text(width / 2, 80, '', {
      fontFamily: 'Inter', fontSize: '16px', color: '#FFF'
    }).setOrigin(0.5);

    this.currentImg = null;

    new UIButton(this, width / 2 - 100, height - 60, 150, 40, 'Anterior', {
      fillColor: 0x555555,
      callback: () => this.prevGarment()
    });

    new UIButton(this, width / 2 + 100, height - 60, 150, 40, 'Siguiente', {
      fillColor: 0x2E8B57,
      callback: () => this.nextGarment()
    });

    new UIButton(this, width - 150, 100, 250, 40, 'Agregar Posición Alternativa', {
      fillColor: 0x4A708B,
      callback: () => this.addVariant()
    });

    new UIButton(this, width - 100, 40, 120, 40, 'Descargar JSON', {
      fillColor: 0xDAA520,
      callback: () => this.exportJSON()
    });

    new UIButton(this, 100, 40, 100, 40, 'Salir', {
      fillColor: 0xCC3333,
      callback: () => this.scene.start('MenuScene')
    });

    this.loadGarment(this.currentIndex);
  }

  loadGarment(index) {
    if (this.currentImg) {
      // Save current state before switching
      const garment = this.garments[this.currentIndex];
      this.savedData[garment.id] = {
        x: Math.round(this.currentImg.x - this.mannequin.x),
        y: Math.round(this.currentImg.y - this.mannequin.y),
        scale: parseFloat(this.currentImg.scale.toFixed(2))
      };
      this.currentImg.destroy();
    }

    this.currentIndex = index;
    const garment = this.garments[index];
    const spriteKey = `garment_${garment.id.replace(/_/g, '-')}`;

    let savedTarget = this.savedData[garment.id];
    if (Array.isArray(savedTarget)) {
      savedTarget = savedTarget[0]; // Load the first variant by default when revisiting
    }

    // Load saved or default
    let offX = 0, offY = 0, scale = 1.2;
    if (savedTarget) {
      offX = savedTarget.x;
      offY = savedTarget.y;
      scale = savedTarget.scale;
    }

    this.currentImg = this.add.image(this.mannequin.x + offX, this.mannequin.y + offY, spriteKey);
    this.currentImg.setScale(scale);
    this.currentImg.setInteractive({ draggable: true });
    this.input.setDraggable(this.currentImg);

    this.currentImg.on('drag', (pointer, dragX, dragY) => {
      this.currentImg.x = dragX;
      this.currentImg.y = dragY;
      this.updateInfoText();
    });

    this.currentImg.on('wheel', (pointer, dx, dy, dz) => {
      const newScale = this.currentImg.scale + (dy > 0 ? -0.05 : 0.05);
      this.currentImg.setScale(Math.max(0.1, newScale));
      this.updateInfoText();
    });

    this.updateInfoText();
  }

  updateInfoText() {
    const garment = this.garments[this.currentIndex];
    const offX = Math.round(this.currentImg.x - this.mannequin.x);
    const offY = Math.round(this.currentImg.y - this.mannequin.y);
    const varCount = Array.isArray(this.savedData[garment.id]) ? this.savedData[garment.id].length : 1;
    this.infoText.setText(`Prenda ${this.currentIndex + 1}/${this.garments.length} : ${garment.name.es} (Variantes guardadas: ${this.savedData[garment.id] ? varCount : 0})\nOffset: { x: ${offX}, y: ${offY} } | Escala: ${this.currentImg.scale.toFixed(2)}`);
  }

  addVariant() {
    const garment = this.garments[this.currentIndex];
    const newVariant = {
      x: Math.round(this.currentImg.x - this.mannequin.x),
      y: Math.round(this.currentImg.y - this.mannequin.y),
      scale: parseFloat(this.currentImg.scale.toFixed(2))
    };

    if (!this.savedData[garment.id]) {
      this.savedData[garment.id] = [newVariant];
    } else {
      if (!Array.isArray(this.savedData[garment.id])) {
        this.savedData[garment.id] = [this.savedData[garment.id]];
      }
      this.savedData[garment.id].push(newVariant);
    }
    
    this.updateInfoText();
  }

  nextGarment() {
    if (this.currentIndex < this.garments.length - 1) {
      this.loadGarment(this.currentIndex + 1);
    }
  }

  prevGarment() {
    if (this.currentIndex > 0) {
      this.loadGarment(this.currentIndex - 1);
    }
  }

  exportJSON() {
    // Save current one if it doesn't exist
    const garment = this.garments[this.currentIndex];
    if (!this.savedData[garment.id]) {
      this.savedData[garment.id] = {
        x: Math.round(this.currentImg.x - this.mannequin.x),
        y: Math.round(this.currentImg.y - this.mannequin.y),
        scale: parseFloat(this.currentImg.scale.toFixed(2))
      };
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.savedData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "garment_offsets.json");
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();
  }
}
