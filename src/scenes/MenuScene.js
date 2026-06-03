import Phaser from 'phaser';
import { t, getLang, setLang } from '../utils/i18n.js';
import UIButton from '../utils/UIButton.js';
import VolumeButton from '../utils/VolumeButton.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    this.add.image(0, 0, 'bg-menu').setOrigin(0, 0).setDisplaySize(width, height);

    this.add.text(width / 2, 120, t('title'), {
      fontFamily: 'Playfair Display',
      fontSize: '52px',
      color: '#F5E6D3',
      stroke: '#4A3728',
      strokeThickness: 5,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, 180, t('subtitle'), {
      fontFamily: 'Inter',
      fontSize: '18px',
      color: '#FFF8E7',
      stroke: '#4A3728',
      strokeThickness: 2
    }).setOrigin(0.5);

    new UIButton(this, width / 2, 320, 200, 60, t('play'), {
      sfx: 'click',
      fontSize: '28px',
      callback: () => this.goToScene('BuilderScene')
    });

    new UIButton(this, width / 2, height / 2 + 90, 200, 40, t('history'), {
      sfx: 'click',
      fillColor: 0x8B7355,
      hoverColor: 0xA08A6B,
      strokeColor: 0x5C4B37,
      fontSize: '20px',
      callback: () => this.goToScene('HistoryScene')
    });

    new UIButton(this, width - 100, height - 50, 60, 30, getLang().toUpperCase(), {
      sfx: 'click',
      fillColor: 0xE8D5C0,
      hoverColor: 0xD8C5B0,
      strokeColor: 0xBBAA88,
      textColor: '#4A3728',
      fontSize: '16px',
      callback: () => {
        const newLang = getLang() === 'es' ? 'en' : 'es';
        setLang(newLang);
        this.scene.restart();
      }
    });

    new VolumeButton(this, 100, height - 50);

    audioManager.playMusic('jazz-main');
  }

  goToScene(key) {
    this.scene.start(key);
  }
}
