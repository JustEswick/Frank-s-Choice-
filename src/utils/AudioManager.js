import { Howl, Howler } from 'howler';

const MUSIC_PATH = 'assets/audio/music/';
const SFX_PATH = 'assets/audio/sfx/';

const MUSIC_FILES = {
  'jazz-main': 'jazz-main.mp3',
  'jazz-quiz': 'jazz-quiz.mp3',
  'jazz-reveal': 'jazz-reveal.mp3'
};

const SFX_FILES = {
  'select': 'select.mp3',
  'remove': 'remove.mp3',
  'typewriter': 'typewriter.mp3',
  'match': 'match.mp3',
  'mismatch': 'mismatch.mp3',
  'transition': 'transition.mp3',
  'click': 'click.mp3'
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

  static preload(scene) {
    Object.entries(MUSIC_FILES).forEach(([key, file]) => {
      scene.load.audio(key, MUSIC_PATH + file);
    });

    Object.entries(SFX_FILES).forEach(([key, file]) => {
      scene.load.audio(key, SFX_PATH + file);
    });
  }

  static init(scene) {
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
  }

  static playMusic(track) {
    if (AudioManager.currentMusic) {
      AudioManager.currentMusic.stop();
    }

    const howl = AudioManager.music[track];
    if (howl) {
      AudioManager.currentMusic = howl;
      AudioManager.currentMusic.volume(AudioManager.musicVolume);
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
      howl.volume(AudioManager.sfxVolume);
      howl.play();
    }
  }

  static setMusicVolume(vol) {
    AudioManager.musicVolume = vol;
    Object.values(AudioManager.music).forEach((howl) => {
      howl.volume(vol);
    });
    if (AudioManager.currentMusic) {
      AudioManager.currentMusic.volume(vol);
    }
  }

  static setSFXVolume(vol) {
    AudioManager.sfxVolume = vol;
    Object.values(AudioManager.sfx).forEach((howl) => {
      howl.volume(vol);
    });
  }

  static setMasterVolume(vol) {
    Howler.volume(vol);
  }
}
