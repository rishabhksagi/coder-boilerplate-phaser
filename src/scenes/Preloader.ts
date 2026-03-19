import Phaser from 'phaser';
import { COLORS, HEX, FONT } from '../ui/theme';

export class Preloader extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    const { width, height } = this.cameras.main;

    // Title
    this.add
      .text(width / 2, height / 2 - 60, 'My Game', {
        ...FONT.TITLE,
        fontSize: '28px',
      })
      .setOrigin(0.5);

    // Loading label
    const loadingText = this.add
      .text(width / 2, height / 2 + 40, 'Loading...', {
        ...FONT.SMALL,
      })
      .setOrigin(0.5);

    // Progress bar background
    const barWidth = 280;
    const barHeight = 8;
    const barX = (width - barWidth) / 2;
    const barY = height / 2;

    const bgBar = this.add.graphics();
    bgBar.fillStyle(0x1e293b, 1);
    bgBar.fillRoundedRect(barX, barY, barWidth, barHeight, 4);

    // Progress bar fill
    const progressBar = this.add.graphics();

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(COLORS.PRIMARY, 1);
      progressBar.fillRoundedRect(
        barX,
        barY,
        barWidth * value,
        barHeight,
        4,
      );
      loadingText.setText(`Loading... ${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      bgBar.destroy();
      loadingText.setText('Ready!');
    });

    // Load game assets here in the future
    // this.load.image('key', 'assets/image.png');
  }

  create() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MainMenu');
    });
  }
}
