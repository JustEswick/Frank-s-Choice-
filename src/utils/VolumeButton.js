import AudioManager from './AudioManager.js';

const LEVELS = [
  { vol: 0.0, icon: '×', label: 'Mute',  fill: 0xCC4444, hover: 0xAA3333 },
  { vol: 0.33, icon: '♪', label: 'Bajo',   fill: 0xE8C585, hover: 0xD8B575 },
  { vol: 0.66, icon: '♫', label: 'Medio',  fill: 0xDAA520, hover: 0xC4941A },
  { vol: 1.0, icon: '♬', label: 'Alto',   fill: 0x2E8B57, hover: 0x257045 }
];

export default class VolumeButton {
  constructor(scene, x, y, size = 40) {
    this.scene = scene;
    this.audioManager = scene.registry.get('audioManager') || AudioManager;
    this.currentLevel = this.findClosestLevel(AudioManager.masterVolume);

    this.bg = scene.add.rectangle(x, y, size * 1.6, size, LEVELS[this.currentLevel].fill)
      .setStrokeStyle(2, 0x4A3728)
      .setInteractive({ useHandCursor: true });

    this.icon = scene.add.text(x, y, LEVELS[this.currentLevel].icon, {
      fontFamily: 'Inter',
      fontSize: `${Math.round(size * 0.6)}px`,
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tooltip = scene.add.text(x, y - size * 0.9, LEVELS[this.currentLevel].label, {
      fontFamily: 'Inter',
      fontSize: '11px',
      color: '#4A3728',
      backgroundColor: '#F5E6D3',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setAlpha(0);

    this.bg.on('pointerover', () => {
      this.bg.setFillStyle(LEVELS[this.currentLevel].hover);
      this.tweens.add({ targets: this.tooltip, alpha: 1, duration: 150 });
    });
    this.bg.on('pointerout', () => {
      this.bg.setFillStyle(LEVELS[this.currentLevel].fill);
      this.tweens.add({ targets: this.tooltip, alpha: 0, duration: 150 });
    });
    this.bg.on('pointerdown', () => this.cycle());
  }

  findClosestLevel(vol) {
    let bestIdx = 0;
    let bestDiff = Infinity;
    LEVELS.forEach((l, i) => {
      const diff = Math.abs(l.vol - vol);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    });
    return bestIdx;
  }

  cycle() {
    this.currentLevel = (this.currentLevel + 1) % LEVELS.length;
    const level = LEVELS[this.currentLevel];

    this.bg.setFillStyle(level.fill);
    this.icon.setText(level.icon);
    this.tooltip.setText(level.label);

    AudioManager.setMasterVolume(level.vol);

    this.tweens.add({
      targets: this.bg,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 80,
      yoyo: true,
      ease: 'Power2'
    });
  }

  destroy() {
    this.bg.destroy();
    this.icon.destroy();
    this.tooltip.destroy();
  }
}
