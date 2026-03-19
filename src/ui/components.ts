/**
 * UI Components — reusable helpers built on rexUI + Phaser.
 * Use these to create polished buttons, panels, toasts, and popups.
 */
import { COLORS, HEX, FONT, SIZES } from './theme';

// ─── rexUI accessor ──────────────────────────────────────────────
function rex(scene: Phaser.Scene): any {
  return (scene as any).rexUI;
}

// ─── Button ──────────────────────────────────────────────────────
export interface ButtonConfig {
  width?: number;
  height?: number;
  fontSize?: string;
  bgColor?: number;
  hoverColor?: number;
  textColor?: string;
}

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  onClick: () => void,
  config?: ButtonConfig,
) {
  const ui = rex(scene);
  const w = config?.width ?? SIZES.BUTTON_WIDTH;
  const h = config?.height ?? SIZES.BUTTON_HEIGHT;
  const bgColor = config?.bgColor ?? COLORS.BUTTON_BG;
  const hoverColor = config?.hoverColor ?? COLORS.BUTTON_HOVER;

  const button = ui.add
    .label({
      x,
      y,
      width: w,
      height: h,
      background: ui.add
        .roundRectangle(0, 0, w, h, SIZES.BUTTON_RADIUS, bgColor)
        .setStrokeStyle(2, COLORS.BORDER),
      text: scene.add.text(0, 0, text, {
        ...FONT.BUTTON,
        ...(config?.fontSize ? { fontSize: config.fontSize } : {}),
        ...(config?.textColor ? { color: config.textColor } : {}),
      }),
      align: 'center',
    })
    .setInteractive({ useHandCursor: true })
    .layout();

  button.on('pointerover', () => {
    button.getElement('background').setFillStyle(hoverColor);
    scene.tweens.add({
      targets: button,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 100,
      ease: 'Back.out',
    });
  });

  button.on('pointerout', () => {
    button.getElement('background').setFillStyle(bgColor);
    scene.tweens.add({ targets: button, scaleX: 1, scaleY: 1, duration: 100 });
  });

  button.on('pointerdown', () => {
    button.getElement('background').setFillStyle(COLORS.BUTTON_PRESS);
    scene.tweens.add({
      targets: button,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 50,
    });
  });

  button.on('pointerup', () => {
    button.getElement('background').setFillStyle(hoverColor);
    scene.tweens.add({
      targets: button,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 50,
    });
    onClick();
  });

  return button;
}

// ─── Panel (rounded rectangle background) ────────────────────────
export function createPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  config?: {
    radius?: number;
    fillColor?: number;
    strokeColor?: number;
    alpha?: number;
  },
) {
  const ui = rex(scene);
  return ui.add
    .roundRectangle(
      x,
      y,
      width,
      height,
      config?.radius ?? SIZES.PANEL_RADIUS,
      config?.fillColor ?? COLORS.BG_PANEL,
    )
    .setStrokeStyle(2, config?.strokeColor ?? COLORS.BORDER)
    .setAlpha(config?.alpha ?? 1);
}

// ─── Toast (auto-dismiss notification) ───────────────────────────
export function showToast(
  scene: Phaser.Scene,
  message: string,
  duration: number = 2000,
) {
  const { width } = scene.cameras.main;
  const container = scene.add.container(width / 2, -50).setDepth(200);

  const text = scene.add
    .text(0, 0, message, { ...FONT.BODY })
    .setOrigin(0.5);
  const pad = 16;
  const bg = scene.add.graphics();
  const tw = text.width + pad * 2;
  const th = text.height + pad;
  bg.fillStyle(COLORS.BG_PANEL_LIGHT, 0.95);
  bg.lineStyle(1, COLORS.BORDER);
  bg.fillRoundedRect(-tw / 2, -th / 2, tw, th, 8);
  bg.strokeRoundedRect(-tw / 2, -th / 2, tw, th, 8);

  container.add([bg, text]);

  scene.tweens.add({
    targets: container,
    y: 50,
    duration: 300,
    ease: 'Back.out',
  });

  scene.time.delayedCall(duration, () => {
    scene.tweens.add({
      targets: container,
      y: -50,
      alpha: 0,
      duration: 300,
      ease: 'Back.in',
      onComplete: () => container.destroy(),
    });
  });
}

// ─── Score Popup (floating +points text) ─────────────────────────
export function createScorePopup(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string = HEX.ACCENT,
) {
  const popup = scene.add
    .text(x, y, text, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      color,
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(100);

  scene.tweens.add({
    targets: popup,
    y: y - 50,
    alpha: 0,
    scaleX: 1.5,
    scaleY: 1.5,
    duration: 700,
    ease: 'Cubic.out',
    onComplete: () => popup.destroy(),
  });
}

// ─── Starfield (parallax background) ─────────────────────────────
export interface StarfieldStar {
  sprite: Phaser.GameObjects.Image;
  speed: number;
}

export function createStarfield(
  scene: Phaser.Scene,
  count: number = 80,
): StarfieldStar[] {
  const { width, height } = scene.cameras.main;
  const stars: StarfieldStar[] = [];

  for (let i = 0; i < count; i++) {
    const x = Phaser.Math.Between(0, width);
    const y = Phaser.Math.Between(0, height);
    const size = Phaser.Math.FloatBetween(0.3, 1);
    const sprite = scene.add.image(x, y, 'bg-star').setAlpha(size).setScale(size);
    stars.push({ sprite, speed: size * 30 });
  }

  return stars;
}

export function updateStarfield(
  stars: StarfieldStar[],
  width: number,
  height: number,
  delta: number,
) {
  for (const star of stars) {
    star.sprite.y += star.speed * (delta / 1000);
    if (star.sprite.y > height) {
      star.sprite.y = 0;
      star.sprite.x = Phaser.Math.Between(0, width);
    }
  }
}
