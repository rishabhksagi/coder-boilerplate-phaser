import Phaser from 'phaser';
import { EventBus } from '../EventBus';

interface StarfieldStar {
  sprite: Phaser.GameObjects.Image;
  speed: number;
}

export class Game extends Phaser.Scene {
  // Player
  private player!: Phaser.Physics.Arcade.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

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

    // Background starfield
    this.starfield = this.createStarfield(80);

    // Player
    this.player = this.physics.add.image(width / 2, height - 60, 'player');
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(28, 28);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      A: this.input.keyboard!.addKey('A'),
      D: this.input.keyboard!.addKey('D'),
    };

    // Groups
    this.stars = this.physics.add.group();
    this.asteroids = this.physics.add.group();

    // Collisions
    this.physics.add.overlap(this.player, this.stars, this.collectStar as any, undefined, this);
    this.physics.add.overlap(this.player, this.asteroids, this.hitAsteroid as any, undefined, this);

    // Spawn timers
    this.starTimer = this.time.addEvent({
      delay: 800, callback: this.spawnStar, callbackScope: this, loop: true,
    });
    this.asteroidTimer = this.time.addEvent({
      delay: 2500, callback: this.spawnAsteroid, callbackScope: this, loop: true,
    });
    this.difficultyTimer = this.time.addEvent({
      delay: 15000, callback: this.increaseDifficulty, callbackScope: this, loop: true,
    });

    // Particles
    this.collectParticles = this.add.particles(0, 0, 'particle', {
      speed: { min: 60, max: 180 }, lifespan: 400,
      scale: { start: 1.2, end: 0 }, tint: 0xffd93d, emitting: false,
    });
    this.hitParticles = this.add.particles(0, 0, 'particle', {
      speed: { min: 100, max: 250 }, lifespan: 500,
      scale: { start: 1.5, end: 0 }, tint: 0xef4444, emitting: false,
    });

    // Emit initial state to React
    EventBus.emit('score-change', this.score);
    EventBus.emit('lives-change', this.lives);
    EventBus.emit('level-change', this.difficulty);

    this.cameras.main.fadeIn(300);
  }

  // ── Spawning ──────────────────────────────────────────────────
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

  // ── Collisions ────────────────────────────────────────────────
  private collectStar(_player: Phaser.Physics.Arcade.Image, star: Phaser.Physics.Arcade.Image) {
    const sx = star.x, sy = star.y;
    star.destroy();

    this.consecutiveCatches++;
    this.multiplier = 1 + Math.floor(this.consecutiveCatches / 5);
    const points = 10 * this.multiplier;
    this.score += points;

    EventBus.emit('score-change', this.score);

    // Score popup
    this.createScorePopup(sx, sy, `+${points}`);
    this.collectParticles.explode(10, sx, sy);
  }

  private hitAsteroid(_player: Phaser.Physics.Arcade.Image, asteroid: Phaser.Physics.Arcade.Image) {
    const ax = asteroid.x, ay = asteroid.y;
    asteroid.destroy();

    this.lives--;
    this.consecutiveCatches = 0;
    this.multiplier = 1;

    EventBus.emit('lives-change', this.lives);

    this.hitParticles.explode(20, ax, ay);
    this.cameras.main.shake(200, 0.012);
    this.createScorePopup(ax, ay, '-1 \u2665', '#ef4444');

    // Player flash
    this.tweens.add({ targets: this.player, alpha: 0.3, duration: 80, yoyo: true, repeat: 4 });

    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }

  // ── Difficulty ────────────────────────────────────────────────
  private increaseDifficulty() {
    if (this.isGameOver) return;
    this.difficulty++;

    this.starTimer.remove();
    this.starTimer = this.time.addEvent({
      delay: Math.max(350, 800 - this.difficulty * 50),
      callback: this.spawnStar, callbackScope: this, loop: true,
    });

    this.asteroidTimer.remove();
    this.asteroidTimer = this.time.addEvent({
      delay: Math.max(800, 2500 - this.difficulty * 180),
      callback: this.spawnAsteroid, callbackScope: this, loop: true,
    });

    EventBus.emit('level-change', this.difficulty);
  }

  // ── Game Over ─────────────────────────────────────────────────
  private triggerGameOver() {
    this.isGameOver = true;
    this.starTimer.remove();
    this.asteroidTimer.remove();
    this.difficultyTimer.remove();

    const prev = parseInt(localStorage.getItem('highScore') || '0');
    const highScore = Math.max(this.score, prev);
    if (this.score > prev) {
      localStorage.setItem('highScore', this.score.toString());
    }

    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        EventBus.emit('game-over', this.score, highScore);
      });
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  private resetState() {
    this.score = 0;
    this.lives = 3;
    this.multiplier = 1;
    this.consecutiveCatches = 0;
    this.difficulty = 1;
    this.isGameOver = false;
    this.starfield = [];
  }

  private createScorePopup(x: number, y: number, text: string, color = '#ffd93d') {
    const popup = this.add
      .text(x, y, text, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '18px',
        color,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.tweens.add({
      targets: popup, y: y - 50, alpha: 0, scaleX: 1.5, scaleY: 1.5,
      duration: 700, ease: 'Cubic.out', onComplete: () => popup.destroy(),
    });
  }

  private createStarfield(count: number): StarfieldStar[] {
    const { width, height } = this.cameras.main;
    const stars: StarfieldStar[] = [];
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(0.3, 1);
      const sprite = this.add.image(x, y, 'bg-star').setAlpha(size).setScale(size);
      stars.push({ sprite, speed: size * 30 });
    }
    return stars;
  }

  // ── Update loop ───────────────────────────────────────────────
  update(_time: number, delta: number) {
    if (this.isGameOver) return;

    // Player movement
    const speed = 320;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      body.setVelocityX(speed);
    }

    // Starfield scroll
    const { width, height } = this.cameras.main;
    for (const star of this.starfield) {
      star.sprite.y += star.speed * (delta / 1000);
      if (star.sprite.y > height) {
        star.sprite.y = 0;
        star.sprite.x = Phaser.Math.Between(0, width);
      }
    }

    // Clean up off-screen objects
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
