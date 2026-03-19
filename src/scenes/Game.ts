import Phaser from 'phaser';
import { COLORS, HEX, FONT } from '../ui/theme';
import {
  showToast,
  createScorePopup,
  createStarfield,
  updateStarfield,
  type StarfieldStar,
} from '../ui/components';

export class Game extends Phaser.Scene {
  // Player
  private player!: Phaser.Physics.Arcade.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    A: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  // Collectibles & hazards
  private stars!: Phaser.Physics.Arcade.Group;
  private asteroids!: Phaser.Physics.Arcade.Group;

  // Game state
  private score = 0;
  private lives = 3;
  private multiplier = 1;
  private consecutiveCatches = 0;
  private difficulty = 1;
  private isGameOver = false;

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private heartImages: Phaser.GameObjects.Image[] = [];

  // Background
  private starfield: StarfieldStar[] = [];

  // Timers
  private starTimer!: Phaser.Time.TimerEvent;
  private asteroidTimer!: Phaser.Time.TimerEvent;
  private difficultyTimer!: Phaser.Time.TimerEvent;

  // Particles
  private collectParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hitParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super('Game');
  }

  create() {
    this.resetState();
    const { width, height } = this.cameras.main;

    // ── Background ──────────────────────────────────────────────
    this.starfield = createStarfield(this, 80);

    // ── Player ──────────────────────────────────────────────────
    this.player = this.physics.add.image(width / 2, height - 60, 'player');
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(28, 28);

    // ── Input ───────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      A: this.input.keyboard!.addKey('A'),
      D: this.input.keyboard!.addKey('D'),
    };

    // ── Groups ──────────────────────────────────────────────────
    this.stars = this.physics.add.group();
    this.asteroids = this.physics.add.group();

    // ── Collisions ──────────────────────────────────────────────
    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar as any,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.asteroids,
      this.hitAsteroid as any,
      undefined,
      this,
    );

    // ── Spawn timers ────────────────────────────────────────────
    this.starTimer = this.time.addEvent({
      delay: 800,
      callback: this.spawnStar,
      callbackScope: this,
      loop: true,
    });

    this.asteroidTimer = this.time.addEvent({
      delay: 2500,
      callback: this.spawnAsteroid,
      callbackScope: this,
      loop: true,
    });

    this.difficultyTimer = this.time.addEvent({
      delay: 15000,
      callback: this.increaseDifficulty,
      callbackScope: this,
      loop: true,
    });

    // ── Particles ───────────────────────────────────────────────
    this.collectParticles = this.add.particles(0, 0, 'particle', {
      speed: { min: 60, max: 180 },
      lifespan: 400,
      scale: { start: 1.2, end: 0 },
      tint: COLORS.ACCENT,
      emitting: false,
    });

    this.hitParticles = this.add.particles(0, 0, 'particle', {
      speed: { min: 100, max: 250 },
      lifespan: 500,
      scale: { start: 1.5, end: 0 },
      tint: COLORS.DANGER,
      emitting: false,
    });

    // ── HUD ─────────────────────────────────────────────────────
    this.createHUD();

    // Fade in
    this.cameras.main.fadeIn(300);
  }

  // ═══════════════════════════════════════════════════════════════
  //  HUD
  // ═══════════════════════════════════════════════════════════════
  private createHUD() {
    const { width } = this.cameras.main;

    // Score (top-left)
    this.scoreText = this.add
      .text(20, 16, 'SCORE: 0', { ...FONT.HUD_LARGE })
      .setDepth(100);

    // Multiplier (below score)
    this.multiplierText = this.add
      .text(20, 46, '', {
        ...FONT.HUD,
        color: HEX.ACCENT,
      })
      .setDepth(100)
      .setAlpha(0);

    // Level (top-center)
    this.levelText = this.add
      .text(width / 2, 16, 'LEVEL 1', {
        ...FONT.HUD,
        color: HEX.TEXT_SECONDARY,
      })
      .setOrigin(0.5, 0)
      .setDepth(100);

    // Hearts (top-right)
    this.heartImages = [];
    for (let i = 0; i < 3; i++) {
      const heart = this.add
        .image(width - 24 - i * 28, 24, 'heart')
        .setDepth(100);
      this.heartImages.push(heart);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  Spawning
  // ═══════════════════════════════════════════════════════════════
  private spawnStar() {
    if (this.isGameOver) return;
    const x = Phaser.Math.Between(30, this.cameras.main.width - 30);
    const star = this.stars.create(x, -20, 'star') as Phaser.Physics.Arcade.Image;
    const speed = 80 + this.difficulty * 20;
    star.setVelocityY(Phaser.Math.Between(speed, speed + 60));
    star.setAngularVelocity(Phaser.Math.Between(-60, 60));
  }

  private spawnAsteroid() {
    if (this.isGameOver) return;
    const x = Phaser.Math.Between(30, this.cameras.main.width - 30);
    const asteroid = this.asteroids.create(x, -20, 'asteroid') as Phaser.Physics.Arcade.Image;
    const speed = 100 + this.difficulty * 25;
    asteroid.setVelocityY(Phaser.Math.Between(speed, speed + 80));
    asteroid.setAngularVelocity(Phaser.Math.Between(-90, 90));
  }

  // ═══════════════════════════════════════════════════════════════
  //  Collisions
  // ═══════════════════════════════════════════════════════════════
  private collectStar(
    _player: Phaser.Physics.Arcade.Image,
    star: Phaser.Physics.Arcade.Image,
  ) {
    const sx = star.x, sy = star.y;
    star.destroy();

    // Scoring
    this.consecutiveCatches++;
    this.multiplier = 1 + Math.floor(this.consecutiveCatches / 5);
    const points = 10 * this.multiplier;
    this.score += points;

    // Update HUD
    this.scoreText.setText(`SCORE: ${this.score}`);
    if (this.multiplier > 1) {
      this.multiplierText.setText(`x${this.multiplier} COMBO`);
      this.multiplierText.setAlpha(1);
    }

    // Effects
    this.collectParticles.explode(10, sx, sy);
    createScorePopup(this, sx, sy, `+${points}`);
  }

  private hitAsteroid(
    _player: Phaser.Physics.Arcade.Image,
    asteroid: Phaser.Physics.Arcade.Image,
  ) {
    const ax = asteroid.x, ay = asteroid.y;
    asteroid.destroy();

    this.lives--;
    this.consecutiveCatches = 0;
    this.multiplier = 1;
    this.multiplierText.setAlpha(0);

    // Remove heart with animation
    const heartIdx = this.lives;
    if (this.heartImages[heartIdx]) {
      this.tweens.add({
        targets: this.heartImages[heartIdx],
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 300,
        ease: 'Back.in',
      });
    }

    // Effects
    this.hitParticles.explode(20, ax, ay);
    this.cameras.main.shake(200, 0.012);
    createScorePopup(this, ax, ay, '-1 \u2665', HEX.DANGER);

    // Player flash
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 4,
    });

    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  Difficulty
  // ═══════════════════════════════════════════════════════════════
  private increaseDifficulty() {
    if (this.isGameOver) return;
    this.difficulty++;

    // Speed up spawn rates — remove old timers and create new ones
    this.starTimer.remove();
    this.starTimer = this.time.addEvent({
      delay: Math.max(350, 800 - this.difficulty * 50),
      callback: this.spawnStar,
      callbackScope: this,
      loop: true,
    });

    this.asteroidTimer.remove();
    this.asteroidTimer = this.time.addEvent({
      delay: Math.max(800, 2500 - this.difficulty * 180),
      callback: this.spawnAsteroid,
      callbackScope: this,
      loop: true,
    });

    // HUD
    this.levelText.setText(`LEVEL ${this.difficulty}`);

    // Notification
    showToast(this, `Level ${this.difficulty}!`, 1500);
  }

  // ═══════════════════════════════════════════════════════════════
  //  Game Over
  // ═══════════════════════════════════════════════════════════════
  private triggerGameOver() {
    this.isGameOver = true;
    this.starTimer.remove();
    this.asteroidTimer.remove();
    this.difficultyTimer.remove();

    // Save high score
    const prev = parseInt(localStorage.getItem('highScore') || '0');
    const highScore = Math.max(this.score, prev);
    if (this.score > prev) {
      localStorage.setItem('highScore', this.score.toString());
    }

    // Slow-mo + fade
    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameOver', { score: this.score, highScore });
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  Helpers
  // ═══════════════════════════════════════════════════════════════
  private resetState() {
    this.score = 0;
    this.lives = 3;
    this.multiplier = 1;
    this.consecutiveCatches = 0;
    this.difficulty = 1;
    this.isGameOver = false;
    this.heartImages = [];
    this.starfield = [];
  }

  // ═══════════════════════════════════════════════════════════════
  //  Update loop
  // ═══════════════════════════════════════════════════════════════
  update(_time: number, delta: number) {
    if (this.isGameOver) return;

    // ── Player movement ─────────────────────────────────────────
    const speed = 320;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      body.setVelocityX(speed);
    }

    // ── Starfield scroll ────────────────────────────────────────
    const { width, height } = this.cameras.main;
    updateStarfield(this.starfield, width, height, delta);

    // ── Clean up off-screen objects ─────────────────────────────
    const killY = height + 60;
    this.stars.children.each((child) => {
      const img = child as Phaser.Physics.Arcade.Image;
      if (img.y > killY) img.destroy();
      return true;
    });
    this.asteroids.children.each((child) => {
      const img = child as Phaser.Physics.Arcade.Image;
      if (img.y > killY) img.destroy();
      return true;
    });
  }
}
