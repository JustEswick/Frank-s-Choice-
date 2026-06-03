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
      height / 2 - 45,
      'Loading...',
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '20px',
        color: '#4A3728',
        fontStyle: 'bold'
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
        color: '#4A3728',
        fontStyle: 'bold'
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

    // Backgrounds
    this.load.image('bg-menu',    'assets/backgrounds/menu.png');
    this.load.image('bg-builder', 'assets/backgrounds/builder.png');
    this.load.image('bg-quiz',    'assets/backgrounds/quiz.png');
    this.load.image('bg-reveal',  'assets/backgrounds/reveal.png');

    // Frank sprites (mixed: vertical 320x568 for intro/writing/close, horizontal 320x180 for talk/idle)
    this.load.spritesheet('frank-idle', 'assets/frank/idle.png', {
      frameWidth: 320,
      frameHeight: 180,
      frameMax: 56
    });
    this.load.spritesheet('frank-talk', 'assets/frank/talk.png', {
      frameWidth: 320,
      frameHeight: 180,
      frameMax: 60
    });
    this.load.spritesheet('frank-intro', 'assets/frank/intro.png', {
      frameWidth: 320,
      frameHeight: 568,
      frameMax: 82
    });
    this.load.spritesheet('frank-writing', 'assets/frank/writing.png', {
      frameWidth: 320,
      frameHeight: 568,
      frameMax: 120
    });
    this.load.spritesheet('frank-close', 'assets/frank/close.png', {
      frameWidth: 320,
      frameHeight: 568,
      frameMax: 82
    });

    // Mannequin
    this.load.image('mannequin', 'assets/mannequin/mannequin.png');

    // Garments
    const garments = [
      'camisa-formal', 'camiseta', 'polo', 'blazer', 'sueter',
      'pantalon-formal', 'jeans', 'bermudas', 'falda', 'pantalon-lino',
      'zapatos-vestir', 'mocasines', 'zapatillas', 'sandalias', 'botas',
      'corbata', 'reloj', 'gafas-sol', 'abrigo', 'chaleco',
      'vestido-formal', 'vestido-casual', 'blusa-seda', 'blusa-casual',
      'tacones-vestir', 'tacones-casual'
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
      frames: this.anims.generateFrameNumbers('frank-idle', { start: 0, end: 55 }),
      frameRate: 18,
      repeat: -1
    });

    this.anims.create({
      key: 'frank_talk',
      frames: this.anims.generateFrameNumbers('frank-talk', { start: 0, end: 59 }),
      frameRate: 20,
      repeat: -1
    });

    this.anims.create({
      key: 'frank_intro',
      frames: this.anims.generateFrameNumbers('frank-intro', { start: 0, end: 81 }),
      frameRate: 24,
      repeat: 0
    });

    this.anims.create({
      key: 'frank_writing',
      frames: this.anims.generateFrameNumbers('frank-writing', { start: 0, end: 119 }),
      frameRate: 24,
      repeat: -1
    });

    this.anims.create({
      key: 'frank_close',
      frames: this.anims.generateFrameNumbers('frank-close', { start: 0, end: 81 }),
      frameRate: 24,
      repeat: 0
    });

    this.scene.start('MenuScene');
  }
}
