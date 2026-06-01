import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import BuilderScene from './scenes/BuilderScene.js';
import QuizScene from './scenes/QuizScene.js';
import RevealScene from './scenes/RevealScene.js';
import HistoryScene from './scenes/HistoryScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#F5E6D3',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, BuilderScene, QuizScene, RevealScene, HistoryScene]
};

const game = new Phaser.Game(config);
