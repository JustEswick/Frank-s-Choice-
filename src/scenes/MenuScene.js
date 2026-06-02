import Phaser from 'phaser';
import { t, getLang, setLang } from '../utils/i18n.js';
import UIButton from '../utils/UIButton.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    this.add.rectangle(width / 2, height / 2, width, height, 0xF5E6D3);

    this.add.text(width / 2, 120, t('title'), {
      fontFamily: 'Playfair Display',
      fontSize: '52px',
      color: '#4A3728',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, 180, t('subtitle'), {
      fontFamily: 'Inter',
      fontSize: '18px',
      color: '#7A6B5D'
    }).setOrigin(0.5);

    new UIButton(this, width / 2, 320, 200, 60, t('play'), {
      sfx: 'click',
      fontSize: '28px',
      callback: () => this.goToScene('BuilderScene')
    });

    new UIButton(this, width / 2, 400, 200, 50, t('history'), {
      sfx: 'click',
      fillColor: 0xDAA520,
      hoverColor: 0xC4941A,
      strokeColor: 0xB8860B,
      fontSize: '22px',
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

    this.add.text(100, height - 50, `♪ ${t('volume')}`, {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#7A6B5D'
    }).setOrigin(0.5);

    audioManager.playMusic('jazz-main');
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
}
