import Phaser from 'phaser';

export class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.text(width / 2, height / 2 - 50, 'My Game', {
      fontFamily: 'Arial',
      fontSize: '48px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const clickText = this.add.text(width / 2, height / 2 + 30, 'Click to Play', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Pulsing animation on the click text
    this.tweens.add({
      targets: clickText,
      alpha: 0.4,
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.input.once('pointerdown', () => {
      this.scene.start('Game');
    });
  }
}
