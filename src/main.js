import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#F5E6D3',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 375, height: 667 },
    max: { width: 1920, height: 1080 }
  },
  scene: [BootScene]
};

const game = new Phaser.Game(config);

export default game;
