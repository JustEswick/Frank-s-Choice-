import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Frank\'s Outfit Game', {
      fontFamily: 'Playfair Display, serif',
      fontSize: '48px',
      color: '#3a2a1a'
    }).setOrigin(0.5);
  }
}
