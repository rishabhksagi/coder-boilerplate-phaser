import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    // Create a loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const barWidth = 320;
    const barHeight = 20;
    const barX = (width - barWidth) / 2;
    const barY = (height - barHeight) / 2;

    // Background of the loading bar
    const bgBar = this.add.graphics();
    bgBar.fillStyle(0x222222, 1);
    bgBar.fillRect(barX, barY, barWidth, barHeight);

    // Progress fill
    const progressBar = this.add.graphics();

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1);
      progressBar.fillRect(barX, barY, barWidth * value, barHeight);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      bgBar.destroy();
    });

    // Load game assets here in the future
    // this.load.image('key', 'assets/image.png');
  }

  create() {
    this.scene.start('MainMenu');
  }
}
