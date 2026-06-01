import Phaser from 'phaser';
import { t, getLang, setLang } from '../utils/i18n.js';

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

    const playBtn = this.add.text(width / 2, 320, t('play'), {
      fontFamily: 'Inter',
      fontSize: '28px',
      color: '#FFFFFF',
      backgroundColor: '#2E8B57',
      padding: { x: 40, y: 15 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setStyle({ backgroundColor: '#257045' }));
    playBtn.on('pointerout', () => playBtn.setStyle({ backgroundColor: '#2E8B57' }));
    playBtn.on('pointerdown', () => {
      audioManager.playSFX('click');
      this.scene.start('BuilderScene');
    });

    const historyBtn = this.add.text(width / 2, 400, t('history'), {
      fontFamily: 'Inter',
      fontSize: '22px',
      color: '#4A3728',
      backgroundColor: '#DAA520',
      padding: { x: 30, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    historyBtn.on('pointerover', () => historyBtn.setStyle({ backgroundColor: '#C4941A' }));
    historyBtn.on('pointerout', () => historyBtn.setStyle({ backgroundColor: '#DAA520' }));
    historyBtn.on('pointerdown', () => {
      audioManager.playSFX('click');
      this.scene.start('HistoryScene');
    });

    const langText = this.add.text(width - 100, height - 50, getLang().toUpperCase(), {
      fontFamily: 'Inter',
      fontSize: '16px',
      color: '#4A3728',
      backgroundColor: '#E8D5C0',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    langText.on('pointerdown', () => {
      const newLang = getLang() === 'es' ? 'en' : 'es';
      setLang(newLang);
      audioManager.playSFX('click');
      this.scene.restart();
    });

    this.add.text(100, height - 50, `♪ ${t('volume')}`, {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#7A6B5D'
    }).setOrigin(0.5);

    audioManager.playMusic('main');
  }
}
