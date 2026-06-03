import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';

import MenuScene from './scenes/MenuScene.js';
import BuilderScene from './scenes/BuilderScene.js';
import QuizScene from './scenes/QuizScene.js';
import RevealScene from './scenes/RevealScene.js';
import HistoryScene from './scenes/HistoryScene.js';
import AlignScene from './scenes/AlignScene.js';
import ChromaKeyPipeline from './shaders/ChromaKeyPipeline.js';

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
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  pipeline: { 'ChromaKeyPipeline': ChromaKeyPipeline },
  scene: [BootScene, MenuScene, BuilderScene, QuizScene, RevealScene, HistoryScene, AlignScene]
};

const game = new Phaser.Game(config);

export default game;
