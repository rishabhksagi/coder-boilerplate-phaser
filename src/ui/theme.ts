/**
 * Game Theme - Colors, fonts, and sizes.
 * Update these values to reskin the entire game.
 */

// Hex-number colors for Phaser drawing APIs (Graphics, tint, backgroundColor)
export const COLORS = {
  BG_DARK: 0x0a0a1a,
  BG_PANEL: 0x1a1a2e,
  BG_PANEL_LIGHT: 0x16213e,

  PRIMARY: 0x00e5ff,
  PRIMARY_DARK: 0x00b8d4,
  SECONDARY: 0xff6b9d,
  ACCENT: 0xffd93d,

  SUCCESS: 0x4ade80,
  DANGER: 0xef4444,
  WARNING: 0xfbbf24,

  TEXT_WHITE: 0xffffff,
  TEXT_SECONDARY: 0x94a3b8,

  BUTTON_BG: 0x1e293b,
  BUTTON_HOVER: 0x334155,
  BUTTON_PRESS: 0x0f172a,
  BORDER: 0x334155,
} as const;

// Hex-string colors for Phaser Text style objects
export const HEX = {
  PRIMARY: '#00e5ff',
  SECONDARY: '#ff6b9d',
  ACCENT: '#ffd93d',
  TEXT: '#ffffff',
  TEXT_SECONDARY: '#94a3b8',
  TEXT_MUTED: '#64748b',
  SUCCESS: '#4ade80',
  DANGER: '#ef4444',
} as const;

// Reusable text style presets
export const FONT = {
  TITLE: { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '42px', color: HEX.PRIMARY },
  SUBTITLE: { fontFamily: 'Arial, sans-serif', fontSize: '24px', color: HEX.TEXT_SECONDARY },
  BODY: { fontFamily: 'Arial, sans-serif', fontSize: '18px', color: HEX.TEXT },
  BUTTON: { fontFamily: 'Arial, sans-serif', fontSize: '20px', color: HEX.TEXT },
  HUD_LARGE: { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '24px', color: HEX.TEXT },
  HUD: { fontFamily: 'Arial, sans-serif', fontSize: '18px', color: HEX.TEXT },
  SMALL: { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: HEX.TEXT_MUTED },
} as const;

export const SIZES = {
  BUTTON_WIDTH: 220,
  BUTTON_HEIGHT: 52,
  BUTTON_RADIUS: 10,
  PANEL_RADIUS: 12,
  PADDING: 16,
} as const;
