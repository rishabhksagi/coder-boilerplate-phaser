import Phaser from 'phaser';
import { COLORS, HEX, FONT } from '../ui/theme';
import {
  createButton,
  createPanel,
  createStarfield,
  updateStarfield,
  type StarfieldStar,
} from '../ui/components';

export class GameOver extends Phaser.Scene {
  private starfield: StarfieldStar[] = [];

  constructor() {
    super('GameOver');
  }

  create(data: { score: number; highScore: number }) {
    const { width, height } = this.cameras.main;
    const isNewHighScore = data.score >= data.highScore && data.score > 0;

    // Background
    this.starfield = createStarfield(this, 40);

    // Panel
    createPanel(this, width / 2, height / 2, 420, 400, { alpha: 0.95 });

    // Game Over title
    this.add
      .text(width / 2, height / 2 - 140, 'GAME OVER', {
        ...FONT.TITLE,
        color: HEX.SECONDARY,
      })
      .setOrigin(0.5);

    // Score label
    this.add
      .text(width / 2, height / 2 - 80, 'SCORE', {
        ...FONT.SUBTITLE,
      })
      .setOrigin(0.5);

    // Score value with count-up animation
    const scoreText = this.add
      .text(width / 2, height / 2 - 35, '0', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '52px',
        color: HEX.ACCENT,
      })
      .setOrigin(0.5);

    if (data.score > 0) {
      this.tweens.addCounter({
        from: 0,
        to: data.score,
        duration: 1000,
        ease: 'Cubic.out',
        onUpdate: (tween) => {
          const val = tween.getValue();
          if (val != null) scoreText.setText(`${Math.floor(val)}`);
        },
      });
    }

    // High score indicator
    if (isNewHighScore) {
      const newRecord = this.add
        .text(width / 2, height / 2 + 15, '\u2605 NEW HIGH SCORE! \u2605', {
          ...FONT.HUD,
          color: HEX.ACCENT,
        })
        .setOrigin(0.5);

      this.tweens.add({
        targets: newRecord,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      this.add
        .text(width / 2, height / 2 + 15, `Best: ${data.highScore}`, {
          ...FONT.SMALL,
          fontSize: '16px',
        })
        .setOrigin(0.5);
    }

    // Play Again button
    createButton(
      this,
      width / 2,
      height / 2 + 75,
      '\u21BB  PLAY AGAIN',
      () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('Game');
        });
      },
      { width: 240, bgColor: COLORS.PRIMARY_DARK, hoverColor: COLORS.PRIMARY },
    );

    // Main Menu button
    createButton(
      this,
      width / 2,
      height / 2 + 140,
      'MAIN MENU',
      () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('MainMenu');
        });
      },
    );

    // Fade in
    this.cameras.main.fadeIn(500);
  }

  update(_time: number, delta: number) {
    const { width, height } = this.cameras.main;
    updateStarfield(this.starfield, width, height, delta);
  }
}
