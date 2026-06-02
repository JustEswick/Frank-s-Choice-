import Phaser from 'phaser';
import AudioManager from '../utils/AudioManager';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const boxWidth = 320;
    const boxHeight = 50;
    const boxX = (width - boxWidth) / 2;
    const boxY = (height - boxHeight) / 2;
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(boxX, boxY, boxWidth, boxHeight);

    const loadingText = this.add.text(
      width / 2,
      height / 2 - 25,
      'Loading...',
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '20px',
        color: '#ffffff'
      }
    );
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.add.text(
      width / 2,
      height / 2,
      '0%',
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        color: '#ffffff'
      }
    );
    percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x8B4513, 1);
      progressBar.fillRect(boxX + 5, boxY + 5, (boxWidth - 10) * value, boxHeight - 10);
      percentText.setText(Math.round(value * 100) + '%');
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Frank sprites
    this.load.spritesheet('frank-idle', 'assets/frank/idle.png', {
      frameWidth: 200,
      frameHeight: 300,
      frameMax: 2
    });
    this.load.spritesheet('frank-talk', 'assets/frank/talk.png', {
      frameWidth: 200,
      frameHeight: 300,
      frameMax: 4
    });

    // Mannequin
    this.load.image('mannequin', 'assets/mannequin/mannequin.png');

    // Garments
    const garments = [
      'camisa-formal', 'camiseta', 'polo', 'blazer', 'sueter',
      'pantalon-formal', 'jeans', 'bermudas', 'falda', 'pantalon-lino',
      'zapatos-vestir', 'mocasines', 'zapatillas', 'sandalias', 'botas',
      'corbata', 'reloj', 'gafas-sol', 'abrigo', 'chaleco'
    ];
    garments.forEach((id) => {
      this.load.image(`garment_${id}`, `assets/garments/${id}.png`);
    });

    // UI elements
    const uiElements = [
      'btn-play', 'btn-history', 'btn-back', 'btn-ready',
      'panel-dialogue', 'tab-bg', 'tab-active'
    ];
    uiElements.forEach((name) => {
      this.load.image(name, `assets/ui/${name}.png`);
    });

    // Audio via AudioManager
    AudioManager.preload(this);
  }

  async create() {
    AudioManager.init(this);
    this.registry.set('audioManager', AudioManager);

    this.anims.create({
      key: 'frank_idle',
      frames: this.anims.generateFrameNumbers('frank-idle', { start: 0, end: 1 }),
      frameRate: 2,
      repeat: -1
    });

    this.anims.create({
      key: 'frank_talk',
      frames: this.anims.generateFrameNumbers('frank-talk', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    const { default: MenuScene } = await import('./MenuScene.js');
    this.scene.add('MenuScene', MenuScene, true);

    const otherScenes = ['BuilderScene', 'QuizScene', 'RevealScene', 'HistoryScene'];
    otherScenes.forEach((key) => {
      import(`./${key}.js`)
        .then((m) => this.scene.add(key, m.default, false))
        .catch((err) => console.error(`Failed to preload ${key}:`, err));
    });
  }
}
