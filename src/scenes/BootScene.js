import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Progress box
    const boxWidth = 320;
    const boxHeight = 50;
    const boxX = (width - boxWidth) / 2;
    const boxY = (height - boxHeight) / 2;
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Loading text
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

    // Percent text
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

    // Progress events
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
  }

  create() {
    this.scene.start('MenuScene');
  }
}
