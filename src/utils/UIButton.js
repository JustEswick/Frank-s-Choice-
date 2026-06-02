export default class UIButton {
  constructor(scene, x, y, width, height, text, config = {}) {
    this.scene = scene;
    this.sfx = config.sfx ?? 'click';
    this.callback = config.callback ?? (() => {});
    this.fillColor = config.fillColor ?? 0x2E8B57;
    this.hoverColor = config.hoverColor ?? 0x257045;
    this.strokeColor = config.strokeColor ?? 0x1A5C3A;
    this.textColor = config.textColor ?? '#FFFFFF';
    this.fontSize = config.fontSize ?? '16px';
    this.disabled = false;

    this.bg = scene.add.rectangle(x, y, width, height, this.fillColor)
      .setStrokeStyle(2, this.strokeColor)
      .setInteractive({ useHandCursor: true })
      .setDepth(config.depth ?? 100);

    this.label = scene.add.text(x, y, text, {
      fontFamily: 'Inter',
      fontSize: this.fontSize,
      color: this.textColor,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth((config.depth ?? 100) + 1);

    this.bg.on('pointerover', () => {
      if (this.disabled) return;
      this.bg.setFillStyle(this.hoverColor);
    });
    this.bg.on('pointerout', () => {
      if (this.disabled) return;
      this.bg.setFillStyle(this.fillColor);
    });
    this.bg.on('pointerdown', () => {
      if (this.disabled) return;
      const audioManager = scene.registry.get('audioManager');
      if (audioManager) audioManager.playSFX(this.sfx);
      this.callback();
    });
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    this.bg.setFillStyle(disabled ? 0x888888 : this.fillColor);
    if (disabled) this.bg.disableInteractive();
    else this.bg.setInteractive({ useHandCursor: true });
  }

  setVisible(visible) {
    this.bg.setVisible(visible);
    this.label.setVisible(visible);
  }

  destroy() {
    this.bg.destroy();
    this.label.destroy();
  }
}
