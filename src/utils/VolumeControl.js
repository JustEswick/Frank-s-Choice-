import Phaser from 'phaser';
import AudioManager from './AudioManager.js';

const BTN_SIZE = 44;
const SLIDER_W = 6;
const SLIDER_H = 100;
const PANEL_W = 70;
const PANEL_H = 170;
const PANEL_PAD = 12;
const OPEN_DURATION = 180;
const CLOSE_DURATION = 140;

const ICON_SPEAKER = '\u{1F50A}';
const ICON_MUTED = '\u{1F507}';
const LABEL_TEXT = 'Vol';

export default class VolumeControl {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.depth = config.depth ?? 95;
    this.isOpen = false;
    this.closedAlpha = 0.85;
    this.openAlpha = 1.0;

    this.container = scene.add.container(x, y);
    this.container.setDepth(this.depth);

    this.muted = AudioManager.masterVolume <= 0.001;
    this.volume = AudioManager.masterVolume;

    this.createMuteButton();
    this.createPanel();
    this.panel.setVisible(false);
    this.panel.setAlpha(0);
  }

  createMuteButton() {
    const btnX = 0;
    const btnY = 0;

    this.muteBg = this.scene.add.rectangle(btnX, btnY, BTN_SIZE, BTN_SIZE, 0x2A1F18, 0.85)
      .setStrokeStyle(2, 0xDAA520)
      .setInteractive({ useHandCursor: true });
    this.muteBg.setDepth(this.depth);

    this.muteIcon = this.scene.add.text(btnX, btnY, this.muted ? ICON_MUTED : ICON_SPEAKER, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '22px',
      color: '#DAA520'
    }).setOrigin(0.5).setDepth(this.depth + 1);

    this.muteLabel = this.scene.add.text(btnX, btnY + BTN_SIZE / 2 + 10, LABEL_TEXT, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '9px',
      color: '#DAA520',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(this.depth + 1);

    this.muteBg.on('pointerover', () => {
      this.muteBg.setFillStyle(0x3A2D24, 0.95);
    });
    this.muteBg.on('pointerout', () => {
      this.muteBg.setFillStyle(0x2A1F18, 0.85);
    });
    this.muteBg.on('pointerdown', (pointer, lx, ly, event) => {
      if (event && event.stopPropagation) event.stopPropagation();
      this.togglePanel();
    });

    this.container.add([this.muteBg, this.muteIcon, this.muteLabel]);
  }

  createPanel() {
    const panelX = 0;
    const panelY = BTN_SIZE / 2 + PANEL_H / 2 + 10; // below the button

    // Fix: add panel coordinates relative to the icon's position
    this.panel = this.scene.add.container(this.x + panelX, this.y + panelY);
    this.panel.setDepth(this.depth + 10);

    this.panelBg = this.scene.add.rectangle(0, 0, PANEL_W, PANEL_H, 0x2A1F18, 0.95)
      .setStrokeStyle(2, 0xDAA520);

    const titleY = -PANEL_H / 2 + 18;
    this.panelTitle = this.scene.add.text(0, titleY, 'Volumen', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      color: '#DAA520',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const sliderX = 0;
    const sliderTopY = -PANEL_H / 2 + 36;
    this.sliderTrack = this.scene.add.rectangle(sliderX, sliderTopY + SLIDER_H / 2,
      SLIDER_W, SLIDER_H, 0x4A3728)
      .setStrokeStyle(1, 0x6B5335);

    const fillRatio = this.muted ? 0 : this.volume;
    const fillH = SLIDER_H * fillRatio;
    const fillY = sliderTopY + SLIDER_H - fillH;
    this.sliderFill = this.scene.add.rectangle(sliderX, fillY, SLIDER_W, fillH, 0xDAA520)
      .setOrigin(0, 0);

    this.sliderKnob = this.scene.add.circle(sliderX, fillY, 9, 0xDAA520)
      .setStrokeStyle(2, 0xF5E6D3)
      .setInteractive({ useHandCursor: true, draggable: true });

    this.volumeText = this.scene.add.text(0, sliderTopY + SLIDER_H + 18,
      this.muted ? 'Mudo' : `${Math.round(this.volume * 100)}%`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      color: '#F5E6D3',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.sliderKnob.on('drag', (pointer, dragX, dragY) => {
      const knobMaxY = sliderTopY + SLIDER_H;
      const knobMinY = sliderTopY;
      let newY = Phaser.Math.Clamp(dragY, knobMinY, knobMaxY);
      const ratio = 1 - (newY - knobMinY) / SLIDER_H;
      this.setVolume(ratio);
    });

    this.sliderTrack.setInteractive({ useHandCursor: true });
    this.sliderTrack.on('pointerdown', (pointer, lx, ly, event) => {
      if (event && event.stopPropagation) event.stopPropagation();
      this.setVolume(1 - ly / SLIDER_H);
    });

    this.sliderKnob.on('pointerdown', (pointer, lx, ly, event) => {
      if (event && event.stopPropagation) event.stopPropagation();
    });

    this.panel.add([this.panelBg, this.panelTitle, this.sliderTrack,
      this.sliderFill, this.sliderKnob, this.volumeText]);
  }

  togglePanel() {
    if (this.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  openPanel() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.panel.setVisible(true);
    this.scene.tweens.add({
      targets: this.panel,
      alpha: { from: 0, to: this.openAlpha },
      y: { from: this.panel.y - 14, to: this.panel.y },
      duration: OPEN_DURATION,
      ease: 'Power2'
    });
  }

  closePanel() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.scene.tweens.add({
      targets: this.panel,
      alpha: { from: this.panel.alpha, to: 0 },
      y: { from: this.panel.y, to: this.panel.y - 14 },
      duration: CLOSE_DURATION,
      ease: 'Power2',
      onComplete: () => this.panel.setVisible(false)
    });
  }

  setVolume(ratio) {
    ratio = Phaser.Math.Clamp(ratio, 0, 1);
    this.volume = ratio;
    this.muted = ratio <= 0.001;
    AudioManager.setMasterVolume(ratio);
    this.updateSliderVisual();
    this.updateMuteButton();
  }

  toggleMute() {
    if (this.muted) {
      const restore = this.lastNonZeroVolume || 0.7;
      this.setVolume(restore);
      this.lastNonZeroVolume = restore;
    } else {
      this.lastNonZeroVolume = this.volume;
      this.setVolume(0);
    }
  }

  updateSliderVisual() {
    const sliderTopY = -PANEL_H / 2 + 36;
    const fillH = SLIDER_H * this.volume;
    const fillY = sliderTopY + SLIDER_H - fillH;
    this.sliderFill.setSize(SLIDER_W, fillH);
    this.sliderFill.setY(fillY);
    this.sliderKnob.setPosition(0, fillY);
    this.volumeText.setText(this.muted ? 'Mudo' : `${Math.round(this.volume * 100)}%`);
  }

  updateMuteButton() {
    this.muteIcon.setText(this.muted ? ICON_MUTED : ICON_SPEAKER);
  }

  setVisible(visible) {
    this.container.setVisible(visible);
    if (!visible) this.closePanel();
  }

  destroy() {
    if (this.panel) this.panel.destroy();
    this.container.destroy();
  }
}
