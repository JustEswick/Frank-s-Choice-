import Phaser from 'phaser';
import { t, getLang, setLang } from '../utils/i18n.js';
import UIButton from '../utils/UIButton.js';
import VolumeButton from '../utils/VolumeButton.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    this.add.image(0, 0, 'bg-menu').setOrigin(0, 0).setDisplaySize(width, height);

    this.add.text(width / 2, 120, t('title'), {
      fontFamily: 'Playfair Display',
      fontSize: '52px',
      color: '#F5E6D3',
      stroke: '#4A3728',
      strokeThickness: 5,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, 180, t('subtitle'), {
      fontFamily: 'Inter',
      fontSize: '18px',
      color: '#FFF8E7',
      stroke: '#4A3728',
      strokeThickness: 2
    }).setOrigin(0.5);

    new UIButton(this, width / 2, 320, 200, 60, t('play'), {
      sfx: 'click',
      fontSize: '28px',
      callback: () => this.goToScene('BuilderScene')
    });

    new UIButton(this, width / 2, height / 2 + 70, 200, 40, t('history'), {
      sfx: 'click',
      fillColor: 0x8B7355,
      hoverColor: 0xA08A6B,
      strokeColor: 0x5C4B37,
      fontSize: '20px',
      callback: () => this.goToScene('HistoryScene')
    });

    new UIButton(this, width / 2, height / 2 + 130, 200, 40, getLang() === 'es' ? 'Tutorial' : 'Tutorial', {
      sfx: 'click',
      fillColor: 0x6B8E23,
      hoverColor: 0x556B2F,
      strokeColor: 0x4A5D23,
      fontSize: '20px',
      callback: () => this.showTutorial()
    });

    new UIButton(this, width - 100, height - 50, 60, 30, getLang().toUpperCase(), {
      sfx: 'click',
      fillColor: 0xE8D5C0,
      hoverColor: 0xD8C5B0,
      strokeColor: 0xBBAA88,
      textColor: '#4A3728',
      fontSize: '16px',
      callback: () => {
        const newLang = getLang() === 'es' ? 'en' : 'es';
        setLang(newLang);
        this.scene.restart();
      }
    });

    new VolumeButton(this, 100, height - 50);

    audioManager.playMusic('jazz-main');
  }

  goToScene(key) {
    this.scene.start(key);
  }

  showTutorial() {
    if (this.tutorialContainer) return;
    const { width, height } = this.cameras.main;
    const audioManager = this.registry.get('audioManager');

    this.tutorialContainer = this.add.container(width / 2, height / 2).setDepth(200);
    
    const bg = this.add.rectangle(0, 0, 580, 420, 0x2A1F16, 0.95).setStrokeStyle(3, 0xDAA520);
    
    const title = getLang() === 'es' ? '¿Cómo jugar?' : 'How to play?';
    const text = getLang() === 'es' 
      ? '1. Viste al maniquí con la ropa que prefieras. Usa la ruedita del mouse para ajustar su tamaño.\n\n2. Tu objetivo es engañar a Frank. Él intentará adivinar tu estilo, ¡evita que lo descubra mintiendo estratégicamente!\n\n3. Frank te hará preguntas. ¡Responde rápido o te dará un strike!\n\n4. Sobrevive 3 minutos sin recibir 3 strikes.'
      : '1. Dress the mannequin. Use the mouse wheel to resize clothes.\n\n2. Your goal is to deceive Frank. He will try to guess your style, avoid it by lying strategically!\n\n3. Frank will ask you questions. Answer quickly or get a strike!\n\n4. Survive for 3 minutes without getting 3 strikes.';

    const titleText = this.add.text(0, -170, title, {
      fontFamily: 'Playfair Display', fontSize: '28px', color: '#DAA520', fontStyle: 'bold'
    }).setOrigin(0.5);

    const descText = this.add.text(0, -130, text, {
      fontFamily: 'Inter', fontSize: '16px', color: '#FFF8E7', align: 'center', wordWrap: { width: 520 }, lineSpacing: 5
    }).setOrigin(0.5, 0); // Anchor to the top to grow downwards without overlapping the title

    const closeBtn = new UIButton(this, 0, 160, 120, 36, getLang() === 'es' ? 'Entendido' : 'Got it', {
      sfx: 'click', fillColor: 0x8B7355, hoverColor: 0x7A6345, fontSize: '16px',
      callback: () => {
        this.tutorialContainer.destroy();
        this.tutorialContainer = null;
      }
    });

    this.tutorialContainer.add([bg, titleText, descText, closeBtn.bg, closeBtn.label]);
    
    this.tutorialContainer.setAlpha(0);
    this.tweens.add({ targets: this.tutorialContainer, alpha: 1, duration: 200 });
  }
}
