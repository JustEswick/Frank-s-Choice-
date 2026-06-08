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
      frameMax: 70
    });
    this.load.spritesheet('frank-talk', 'assets/frank/talk.png', {
      frameWidth: 320,
      frameHeight: 180,
      frameMax: 75
    });
    this.load.spritesheet('frank-intro', 'assets/frank/intro.png', {
      frameWidth: 320,
      frameHeight: 568,
      frameMax: 103
    });
    this.load.spritesheet('frank-writing', 'assets/frank/writing.png', {
      frameWidth: 320,
      frameHeight: 568,
      frameMax: 87
    });
    this.load.spritesheet('frank-close', 'assets/frank/close.png', {
      frameWidth: 320,
      frameHeight: 568,
      frameMax: 103
    });
    this.load.spritesheet('frank-duda', 'assets/frank/duda.png', {
      frameWidth: 320,
      frameHeight: 568,
      frameMax: 131
    });
    this.load.spritesheet('frank-enojado', 'assets/frank/enojado.png', {
      frameWidth: 320,
      frameHeight: 568,
      frameMax: 31
    });
    this.load.spritesheet('frank-tiralibreta', 'assets/frank/tiralibreta.png', {
      frameWidth: 320,
      frameHeight: 568,
      frameMax: 104
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

    // Audio via AudioManager
    AudioManager.preload(this);
  }

  async create() {
    AudioManager.init(this);
    this.registry.set('audioManager', AudioManager);

    this.anims.create({
      key: 'frank_idle',
      frames: this.anims.generateFrameNumbers('frank-idle', { start: 0, end: 69 }),
      frameRate: 18,
      repeat: -1
    });

    this.anims.create({
      key: 'frank_talk',
      frames: this.anims.generateFrameNumbers('frank-talk', { start: 0, end: 74 }),
      frameRate: 20,
      repeat: -1
    });

    this.anims.create({
      key: 'frank_intro',
      frames: this.anims.generateFrameNumbers('frank-intro', { start: 0, end: 102 }),
      frameRate: 24,
      repeat: 0
    });

    this.anims.create({
      key: 'frank_writing',
      frames: this.anims.generateFrameNumbers('frank-writing', { start: 0, end: 86 }),
      frameRate: 24,
      repeat: -1
    });

    this.anims.create({
      key: 'frank_close',
      frames: this.anims.generateFrameNumbers('frank-close', { start: 0, end: 102 }),
      frameRate: 24,
      repeat: 0
    });

    this.anims.create({
      key: 'frank_duda',
      frames: this.anims.generateFrameNumbers('frank-duda', { start: 0, end: 130 }),
      frameRate: 24,
      repeat: 0
    });

    this.anims.create({
      key: 'frank_enojado',
      frames: this.anims.generateFrameNumbers('frank-enojado', { start: 0, end: 30 }),
      frameRate: 24,
      repeat: 0
    });

    this.anims.create({
      key: 'frank_tiralibreta',
      frames: this.anims.generateFrameNumbers('frank-tiralibreta', { start: 0, end: 103 }),
      frameRate: 24,
      repeat: 0
    });

    this.scene.start('MenuScene');
  }
}
