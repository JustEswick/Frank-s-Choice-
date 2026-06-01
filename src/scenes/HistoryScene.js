import Phaser from 'phaser';
import { t } from '../utils/i18n.js';
import PersistenceManager from '../systems/PersistenceManager.js';

const BEIGE = 0xF5E6D3;
const BROWN = 0x4A3728;
const GREEN = 0x2E8B57;
const GOLD = 0xDAA520;
const RED = 0xCC3333;
const MAX_VISIBLE_ROUNDS = 8;

export default class HistoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HistoryScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    this.add.rectangle(width / 2, height / 2, width, height, BEIGE);

    this.add.text(width / 2, 40, 'HISTORIAL', {
      fontFamily: 'Playfair Display',
      fontSize: '42px',
      color: '#4A3728',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const profile = PersistenceManager.getProfile();
    const roundsPlayed = profile.rounds_played || 0;
    const avgScore = Math.round(profile.avg_score || 0);

    this.add.text(width / 2, 90, `${t('round')}: ${roundsPlayed}  |  ${t('score')}: ${avgScore}%`, {
      fontFamily: 'Inter',
      fontSize: '16px',
      color: '#7A6B5D'
    }).setOrigin(0.5);

    const history = PersistenceManager.getHistory();
    const startY = 130;

    if (history.length === 0) {
      this.add.text(width / 2, height / 2, t('no_history'), {
        fontFamily: 'Inter',
        fontSize: '20px',
        color: '#7A6B5D'
      }).setOrigin(0.5);
    } else {
      const visibleRounds = history.slice(0, MAX_VISIBLE_ROUNDS);
      const rowHeight = 60;

      visibleRounds.forEach((round, i) => {
        const y = startY + i * rowHeight;
        this.createRoundRow(width, y, round, i + 1);
      });
    }

    const backBtn = this.add.rectangle(width / 2, height - 40, 180, 44, BROWN)
      .setStrokeStyle(2, 0x2E1F14)
      .setInteractive({ useHandCursor: true });

    const backText = this.add.text(width / 2, height - 40, t('back'), {
      fontFamily: 'Inter',
      fontSize: '18px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    backBtn.on('pointerover', () => backBtn.setFillStyle(0x5C4536));
    backBtn.on('pointerout', () => backBtn.setFillStyle(BROWN));
    backBtn.on('pointerdown', () => {
      audioManager.playSFX('click');
      this.scene.start('MenuScene');
    });

    audioManager.playMusic('main');
  }

  createRoundRow(width, y, round, roundNum) {
    const rowBg = this.add.rectangle(width / 2, y, width * 0.85, 50, 0xE8D5C0)
      .setStrokeStyle(1, 0xBBAA88);

    const score = round.score || 0;
    const scoreColor = score >= 70 ? GREEN : score >= 40 ? GOLD : RED;

    this.add.text(30, y, `${t('round')} #${roundNum}`, {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#4A3728',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    const date = new Date(round.date);
    const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    this.add.text(160, y, dateStr, {
      fontFamily: 'Inter',
      fontSize: '12px',
      color: '#7A6B5D'
    }).setOrigin(0, 0.5);

    if (round.playerOutfit && round.playerOutfit.length > 0) {
      const miniIds = round.playerOutfit.slice(0, 3);
      miniIds.forEach((garmentId, i) => {
        const miniX = 300 + i * 36;
        const spriteKey = `garment_${garmentId.replace(/_/g, '-')}`;
        if (this.textures.exists(spriteKey)) {
          const img = this.add.image(miniX, y, spriteKey);
          img.setDisplaySize(30, 22);
        } else {
          this.add.rectangle(miniX, y, 30, 22, 0xCCCCFF, 0.6)
            .setStrokeStyle(1, 0xBBBBBB);
        }
      });
    }

    const scoreStr = `${score}%`;
    this.add.text(width - 60, y, scoreStr, {
      fontFamily: 'Inter',
      fontSize: '16px',
      color: '#' + scoreColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }
}
