import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Minimal boot — no assets to load here
  }

  create() {
    this.scene.start('Preloader');
  }
}
