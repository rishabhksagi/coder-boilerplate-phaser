import Phaser from 'phaser';

/**
 * Boot scene — generates all game textures programmatically.
 * No external asset files needed; everything works out of the box.
 */
export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.generatePlayerTexture();
    this.generateStarTexture();
    this.generateAsteroidTexture();
    this.generateParticleTexture();
    this.generateBgStarTexture();
    this.scene.start('Preloader');
  }

  private generatePlayerTexture() {
    const g = this.make.graphics({});
    // Engine glow
    g.fillStyle(0xff6b00, 0.4);
    g.fillCircle(20, 35, 7);
    g.fillStyle(0xffd93d, 0.3);
    g.fillCircle(20, 33, 5);
    // Ship body
    g.fillStyle(0x00e5ff, 1);
    g.beginPath();
    g.moveTo(20, 2);
    g.lineTo(4, 34);
    g.lineTo(12, 30);
    g.lineTo(20, 36);
    g.lineTo(28, 30);
    g.lineTo(36, 34);
    g.closePath();
    g.fillPath();
    // Wing accents
    g.fillStyle(0x00b8d4, 1);
    g.fillTriangle(20, 10, 8, 30, 14, 28);
    g.fillTriangle(20, 10, 32, 30, 26, 28);
    // Cockpit
    g.fillStyle(0x1a1a2e, 1);
    g.fillCircle(20, 16, 3);
    g.fillStyle(0x66ffff, 0.6);
    g.fillCircle(20, 15, 2);
    g.generateTexture('player', 40, 40);
    g.destroy();
  }

  private generateStarTexture() {
    const g = this.make.graphics({});
    const cx = 14, cy = 14;
    // Outer glow
    g.fillStyle(0xffd93d, 0.2);
    this.drawStarShape(g, cx, cy, 5, 14, 6);
    // Main star
    g.fillStyle(0xffd93d, 1);
    this.drawStarShape(g, cx, cy, 5, 10, 4);
    // Inner highlight
    g.fillStyle(0xfff5cc, 0.8);
    this.drawStarShape(g, cx, cy, 5, 5, 2);
    g.generateTexture('star', 28, 28);
    g.destroy();
  }

  private generateAsteroidTexture() {
    const g = this.make.graphics({});
    const cx = 18, cy = 18, segments = 10;
    // Shadow
    g.fillStyle(0x2a2a3a, 1);
    this.drawJaggedCircle(g, cx + 1, cy + 1, 15, segments);
    // Main body
    g.fillStyle(0x6b7280, 1);
    this.drawJaggedCircle(g, cx, cy, 14, segments);
    // Highlight
    g.fillStyle(0x9ca3af, 0.6);
    this.drawJaggedCircle(g, cx - 2, cy - 2, 8, segments);
    // Crater
    g.fillStyle(0x4b5563, 1);
    g.fillCircle(cx + 3, cy + 2, 3);
    g.fillCircle(cx - 4, cy - 3, 2);
    g.generateTexture('asteroid', 36, 36);
    g.destroy();
  }

  private generateParticleTexture() {
    const g = this.make.graphics({});
    g.fillStyle(0xffffff, 1);
    g.fillCircle(6, 6, 6);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(6, 6, 4);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(6, 6, 2);
    g.generateTexture('particle', 12, 12);
    g.destroy();
  }

  private generateBgStarTexture() {
    const g = this.make.graphics({});
    g.fillStyle(0xffffff, 1);
    g.fillCircle(2, 2, 2);
    g.generateTexture('bg-star', 4, 4);
    g.destroy();
  }

  private drawStarShape(
    g: Phaser.GameObjects.Graphics,
    cx: number, cy: number,
    points: number, outerR: number, innerR: number,
  ) {
    const step = Math.PI / points;
    g.beginPath();
    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = i * step - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fillPath();
  }

  private drawJaggedCircle(
    g: Phaser.GameObjects.Graphics,
    cx: number, cy: number,
    radius: number, segments: number,
  ) {
    g.beginPath();
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const jitter = Math.sin(i * 7.3 + 2.1) * 0.25;
      const r = radius * (1 + jitter);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fillPath();
  }
}
