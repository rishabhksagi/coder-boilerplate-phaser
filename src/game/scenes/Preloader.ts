import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    // Load game assets here in the future
    // this.load.image('key', 'assets/image.png');
  }

  create() {
    // Go straight to the game scene — menu is handled by React
    this.scene.start('Game');
  }
}
