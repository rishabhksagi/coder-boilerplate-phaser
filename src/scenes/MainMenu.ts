import Phaser from 'phaser';
import { COLORS, HEX, FONT } from '../ui/theme';
import {
  createButton,
  createPanel,
  createStarfield,
  updateStarfield,
  type StarfieldStar,
} from '../ui/components';

export class MainMenu extends Phaser.Scene {
  private starfield: StarfieldStar[] = [];

  constructor() {
    super('MainMenu');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Parallax starfield background
    this.starfield = createStarfield(this, 60);

    // Center panel
    createPanel(this, width / 2, height / 2, 400, 360, {
      fillColor: COLORS.BG_PANEL,
      alpha: 0.9,
    });

    // Title
    const title = this.add
      .text(width / 2, height / 2 - 110, 'My Game', {
        ...FONT.TITLE,
      })
      .setOrigin(0.5);

    // Title shimmer
    this.tweens.add({
      targets: title,
      alpha: 0.7,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Decorative spinning star
    const star = this.add.image(width / 2, height / 2 - 40, 'star').setScale(2.5);
    this.tweens.add({
      targets: star,
      angle: 360,
      duration: 4000,
      repeat: -1,
    });
    this.tweens.add({
      targets: star,
      scaleX: 3,
      scaleY: 3,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle
    this.add
      .text(width / 2, height / 2 + 15, 'Collect stars. Dodge asteroids.', {
        ...FONT.SUBTITLE,
        fontSize: '16px',
      })
      .setOrigin(0.5);

    // Play button
    createButton(
      this,
      width / 2,
      height / 2 + 65,
      '\u25B6  PLAY',
      () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('Game');
        });
      },
      { width: 240, bgColor: COLORS.PRIMARY_DARK, hoverColor: COLORS.PRIMARY },
    );

    // High score
    const highScore = localStorage.getItem('highScore') || '0';
    if (parseInt(highScore) > 0) {
      this.add
        .text(width / 2, height / 2 + 120, `HIGH SCORE: ${highScore}`, {
          ...FONT.HUD,
          color: HEX.ACCENT,
        })
        .setOrigin(0.5);
    }

    // Controls hint
    this.add
      .text(width / 2, height / 2 + 155, 'Arrow keys / WASD to move', {
        ...FONT.SMALL,
      })
      .setOrigin(0.5);

    // Fade in
    this.cameras.main.fadeIn(400);
  }

  update(_time: number, delta: number) {
    const { width, height } = this.cameras.main;
    updateStarfield(this.starfield, width, height, delta);
  }
}
