import { Howl, Howler } from 'howler';

const MUSIC_PATH = 'assets/audio/music/';
const SFX_PATH = 'assets/audio/sfx/';
const STORAGE_KEY = 'frank_audio_settings';

const MUSIC_FILES = {
  'jazz-main': 'jazz-main.mp3',
  'jazz-quiz': 'jazz-quiz.mp3'
  // 'jazz-reveal': 'jazz-reveal.mp3'  // TODO: add jazz-reveal.mp3
};

const SFX_FILES = {
  'select': 'select.mp3',
  'remove': 'remove.mp3',
  'typewriter': 'typewriter.mp3',
  'match': 'match.mp3',
  'mismatch': 'mismatch.mp3',
  'transition': 'transition.mp3',
  'click': 'click.mp3',
  'reveal': 'reveal.mp3'
};

const DEFAULT_MUSIC_VOLUME = 0.7;
const DEFAULT_SFX_VOLUME = 0.8;
const DEFAULT_MASTER_VOLUME = 1.0;

export default class AudioManager {
  static music = {};
  static sfx = {};
  static currentMusic = null;
  static musicVolume = DEFAULT_MUSIC_VOLUME;
  static sfxVolume = DEFAULT_SFX_VOLUME;
  static masterVolume = DEFAULT_MASTER_VOLUME;

  static preload(scene) {
    Object.entries(MUSIC_FILES).forEach(([key, file]) => {
      scene.load.audio(key, MUSIC_PATH + file);
    });

    Object.entries(SFX_FILES).forEach(([key, file]) => {
      scene.load.audio(key, SFX_PATH + file);
    });
  }

  static init(scene) {
    AudioManager.loadSettings();

    Object.keys(MUSIC_FILES).forEach((key) => {
      AudioManager.music[key] = new Howl({
        src: [MUSIC_PATH + MUSIC_FILES[key]],
        loop: true,
        volume: AudioManager.musicVolume,
        preload: true
      });
    });

    Object.keys(SFX_FILES).forEach((key) => {
      AudioManager.sfx[key] = new Howl({
        src: [SFX_PATH + SFX_FILES[key]],
        volume: AudioManager.sfxVolume,
        preload: true
      });
    });

    Howler.volume(AudioManager.masterVolume);
  }

  static loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        AudioManager.masterVolume = settings.master ?? DEFAULT_MASTER_VOLUME;
        AudioManager.musicVolume = settings.music ?? DEFAULT_MUSIC_VOLUME;
        AudioManager.sfxVolume = settings.sfx ?? DEFAULT_SFX_VOLUME;
      }
    } catch (e) {
      console.warn('Failed to load audio settings:', e);
    }
  }

  static saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        master: AudioManager.masterVolume,
        music: AudioManager.musicVolume,
        sfx: AudioManager.sfxVolume
      }));
    } catch (e) {
      console.warn('Failed to save audio settings:', e);
    }
  }

  static playMusic(track) {
    if (AudioManager.currentMusic) {
      AudioManager.currentMusic.stop();
    }

    const howl = AudioManager.music[track];
    if (howl) {
      AudioManager.currentMusic = howl;
      AudioManager.currentMusic.volume(AudioManager.musicVolume * AudioManager.masterVolume);
      AudioManager.currentMusic.play();
    }
  }

  static stopMusic() {
    if (AudioManager.currentMusic) {
      AudioManager.currentMusic.stop();
      AudioManager.currentMusic = null;
    }
  }

  static playSFX(name) {
    const howl = AudioManager.sfx[name];
    if (howl) {
      howl.volume(AudioManager.sfxVolume * AudioManager.masterVolume);
      const stack = new Error().stack;
      const caller = stack ? stack.split('\n')[2]?.trim() || 'unknown' : 'unknown';
      console.log(`[AUDIO] playSFX('${name}') @ ${Date.now()} | from: ${caller}`);
      if (AudioManager._debugOverlay) {
        AudioManager._debugOverlay(name);
      }
      howl.play();
    }
  }

  static setDebugOverlay(fn) {
    AudioManager._debugOverlay = fn;
  }

  static setMusicVolume(vol) {
    AudioManager.musicVolume = Math.max(0, Math.min(1, vol));
    if (AudioManager.currentMusic) {
      AudioManager.currentMusic.volume(AudioManager.musicVolume * AudioManager.masterVolume);
    }
    AudioManager.saveSettings();
  }

  static setSFXVolume(vol) {
    AudioManager.sfxVolume = Math.max(0, Math.min(1, vol));
    AudioManager.saveSettings();
  }

  static setMasterVolume(vol) {
    AudioManager.masterVolume = Math.max(0, Math.min(1, vol));
    Howler.volume(AudioManager.masterVolume);
    if (AudioManager.currentMusic) {
      AudioManager.currentMusic.volume(AudioManager.musicVolume * AudioManager.masterVolume);
    }
    AudioManager.saveSettings();
  }
}
