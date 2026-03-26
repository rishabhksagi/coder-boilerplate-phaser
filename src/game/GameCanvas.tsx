import { useEffect, useRef, useCallback } from 'react';
import { EventBus } from './EventBus';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

interface GameCanvasProps {
  onScoreChange?: (score: number) => void;
  onLivesChange?: (lives: number) => void;
  onLevelChange?: (level: number) => void;
  onGameOver?: (score: number, highScore: number) => void;
}

interface Star {
  x: number;
  y: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  active: boolean;
}

interface Asteroid {
  x: number;
  y: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  vertices: { angle: number; r: number }[];
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  active: boolean;
}

interface ScorePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  active: boolean;
}

interface BgStar {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

// --- Pre-render sprites to offscreen canvases (drawn once, reused every frame) ---

function createSpriteCanvas(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx);
  return c;
}

function createPlayerSprite(): HTMLCanvasElement {
  return createSpriteCanvas(40, 40, (ctx) => {
    ctx.translate(20, 20);
    // Engine glow
    const glowGrad = ctx.createRadialGradient(0, 15, 0, 0, 15, 10);
    glowGrad.addColorStop(0, 'rgba(255, 107, 0, 0.6)');
    glowGrad.addColorStop(1, 'rgba(255, 107, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 15, 10, 0, Math.PI * 2);
    ctx.fill();
    // Ship body
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-16, 14);
    ctx.lineTo(-8, 10);
    ctx.lineTo(0, 16);
    ctx.lineTo(8, 10);
    ctx.lineTo(16, 14);
    ctx.closePath();
    ctx.fill();
    // Wing accents
    ctx.fillStyle = '#00b8d4';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-12, 10);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(12, 10);
    ctx.lineTo(6, 8);
    ctx.closePath();
    ctx.fill();
    // Cockpit
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(0, -4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(102, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(0, -5, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function createStarSprite(): HTMLCanvasElement {
  return createSpriteCanvas(30, 30, (ctx) => {
    ctx.translate(15, 15);
    const drawShape = (outerR: number, innerR: number) => {
      const points = 5;
      const step = Math.PI / points;
      ctx.beginPath();
      for (let i = 0; i < 2 * points; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = i * step - Math.PI / 2;
        if (i === 0) ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
        else ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
    };
    ctx.fillStyle = 'rgba(255, 217, 61, 0.2)';
    drawShape(14, 6);
    ctx.fillStyle = '#ffd93d';
    drawShape(10, 4);
    ctx.fillStyle = 'rgba(255, 245, 204, 0.8)';
    drawShape(5, 2);
  });
}

function createBgCanvas(bgStars: BgStar[]): HTMLCanvasElement {
  return createSpriteCanvas(GAME_WIDTH, GAME_HEIGHT, (ctx) => {
    // Static gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bgGrad.addColorStop(0, '#0a0a1a');
    bgGrad.addColorStop(0.4, '#1a1a3e');
    bgGrad.addColorStop(0.7, '#0d1b2a');
    bgGrad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  });
}

export default function GameCanvas({
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const gameStateRef = useRef({
    playerX: GAME_WIDTH / 2,
    playerY: GAME_HEIGHT - 60,
    score: 0,
    lives: 3,
    level: 1,
    isGameOver: false,
    consecutiveCatches: 0,
    multiplier: 1,
    shakeTime: 0,
    shakeIntensity: 0,
    playerFlashTime: 0,
    fadeIn: 1,
  });
  const keysRef = useRef<Set<string>>(new Set());
  const starsRef = useRef<Star[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<ScorePopup[]>([]);
  const bgStarsRef = useRef<BgStar[]>([]);
  const timersRef = useRef({ starElapsed: 0, asteroidElapsed: 0, difficultyElapsed: 0 });
  const lastTimeRef = useRef(0);

  // Cached sprite canvases
  const spritesRef = useRef<{
    player: HTMLCanvasElement;
    star: HTMLCanvasElement;
    bg: HTMLCanvasElement;
  } | null>(null);

  const initBgStars = useCallback(() => {
    const stars: BgStar[] = [];
    for (let i = 0; i < 80; i++) {
      const size = 0.3 + Math.random() * 0.7;
      stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size,
        speed: size * 30,
        alpha: size,
      });
    }
    bgStarsRef.current = stars;
  }, []);

  // Subscribe to EventBus
  useEffect(() => {
    const unsubs: (() => void)[] = [];
    if (onScoreChange) unsubs.push(EventBus.on('score-change', onScoreChange));
    if (onLivesChange) unsubs.push(EventBus.on('lives-change', onLivesChange));
    if (onLevelChange) unsubs.push(EventBus.on('level-change', onLevelChange));
    if (onGameOver) unsubs.push(EventBus.on('game-over', onGameOver));
    return () => unsubs.forEach((fn) => fn());
  }, [onScoreChange, onLivesChange, onLevelChange, onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    // Reset state
    const state = gameStateRef.current;
    state.playerX = GAME_WIDTH / 2;
    state.playerY = GAME_HEIGHT - 60;
    state.score = 0;
    state.lives = 3;
    state.level = 1;
    state.isGameOver = false;
    state.consecutiveCatches = 0;
    state.multiplier = 1;
    state.fadeIn = 0;
    starsRef.current = [];
    asteroidsRef.current = [];
    particlesRef.current = [];
    popupsRef.current = [];
    timersRef.current = { starElapsed: 0, asteroidElapsed: 0, difficultyElapsed: 0 };

    initBgStars();

    // Pre-render sprites once
    spritesRef.current = {
      player: createPlayerSprite(),
      star: createStarSprite(),
      bg: createBgCanvas(bgStarsRef.current),
    };

    EventBus.emit('score-change', 0);
    EventBus.emit('lives-change', 3);
    EventBus.emit('level-change', 1);

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // --- Object pools (swap-remove instead of splice for O(1) removal) ---
    function removeAt<T extends { active: boolean }>(arr: T[], i: number) {
      arr[i].active = false;
      arr[i] = arr[arr.length - 1];
      arr.pop();
    }

    function spawnStar() {
      const x = 30 + Math.random() * (GAME_WIDTH - 60);
      const speed = 80 + state.level * 20;
      starsRef.current.push({
        x, y: -20,
        vy: speed + Math.random() * 60,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 2,
        active: true,
      });
    }

    function spawnAsteroid() {
      const x = 30 + Math.random() * (GAME_WIDTH - 60);
      const speed = 100 + state.level * 25;
      const segments = 8;
      const vertices = [];
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const r = 1 + (Math.sin(i * 7.3 + 2.1) * 0.25);
        vertices.push({ angle, r });
      }
      asteroidsRef.current.push({
        x, y: -20,
        vy: speed + Math.random() * 80,
        radius: 14 + Math.random() * 4,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 3,
        vertices,
        active: true,
      });
    }

    function spawnParticles(x: number, y: number, color: string, count: number) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 180;
        particlesRef.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.4, maxLife: 0.4,
          color, size: 2 + Math.random() * 4,
          active: true,
        });
      }
    }

    function addPopup(x: number, y: number, text: string, color: string) {
      popupsRef.current.push({ x, y, text, color, life: 0.7, maxLife: 0.7, active: true });
    }

    function checkCollision(ax: number, ay: number, ar: number, bx: number, by: number, br: number) {
      const dx = ax - bx;
      const dy = ay - by;
      return dx * dx + dy * dy < (ar + br) * (ar + br);
    }

    function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation);
      const verts = a.vertices;
      const r = a.radius;
      // Shadow
      ctx.fillStyle = '#2a2a3a';
      drawJagged(ctx, verts, r, 1, 1);
      // Body
      ctx.fillStyle = '#6b7280';
      drawJagged(ctx, verts, r, 0, 0);
      // Highlight
      ctx.fillStyle = 'rgba(156, 163, 175, 0.6)';
      drawJagged(ctx, verts, r * 0.6, -2, -2);
      // Craters
      ctx.fillStyle = '#4b5563';
      ctx.beginPath();
      ctx.arc(3, 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-4, -3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawJagged(ctx: CanvasRenderingContext2D, vertices: { angle: number; r: number }[], radius: number, ox: number, oy: number) {
      ctx.beginPath();
      for (let i = 0; i < vertices.length; i++) {
        const v = vertices[i];
        const x = ox + v.r * radius * Math.cos(v.angle);
        const y = oy + v.r * radius * Math.sin(v.angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }

    function triggerGameOver() {
      state.isGameOver = true;
      const prev = parseInt(localStorage.getItem('highScore') || '0');
      const highScore = Math.max(state.score, prev);
      if (state.score > prev) {
        localStorage.setItem('highScore', state.score.toString());
      }
      setTimeout(() => {
        EventBus.emit('game-over', state.score, highScore);
      }, 600);
    }

    // --- GAME LOOP ---
    function gameLoop(timestamp: number) {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      if (state.isGameOver) {
        animFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Fade in
      if (state.fadeIn < 1) {
        state.fadeIn = Math.min(1, state.fadeIn + dt * 3);
      }

      const keys = keysRef.current;
      const timers = timersRef.current;
      const sprites = spritesRef.current!;

      // Player movement
      const speed = 320;
      if (keys.has('arrowleft') || keys.has('a')) state.playerX -= speed * dt;
      if (keys.has('arrowright') || keys.has('d')) state.playerX += speed * dt;
      state.playerX = Math.max(20, Math.min(GAME_WIDTH - 20, state.playerX));

      // Spawn timers
      timers.starElapsed += dt;
      const starInterval = Math.max(0.35, 0.8 - state.level * 0.05);
      if (timers.starElapsed >= starInterval) {
        timers.starElapsed = 0;
        spawnStar();
      }

      timers.asteroidElapsed += dt;
      const asteroidInterval = Math.max(0.8, 2.5 - state.level * 0.18);
      if (timers.asteroidElapsed >= asteroidInterval) {
        timers.asteroidElapsed = 0;
        spawnAsteroid();
      }

      timers.difficultyElapsed += dt;
      if (timers.difficultyElapsed >= 15) {
        timers.difficultyElapsed = 0;
        state.level++;
        EventBus.emit('level-change', state.level);
      }

      // Update stars (swap-remove for O(1))
      const stars = starsRef.current;
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.y += s.vy * dt;
        s.rotation += s.rotationSpeed * dt;

        if (checkCollision(s.x, s.y, 10, state.playerX, state.playerY, 14)) {
          removeAt(stars, i);
          state.consecutiveCatches++;
          state.multiplier = 1 + Math.floor(state.consecutiveCatches / 5);
          const points = 10 * state.multiplier;
          state.score += points;
          EventBus.emit('score-change', state.score);
          spawnParticles(s.x, s.y, '#ffd93d', 10);
          addPopup(s.x, s.y, `+${points}`, '#ffd93d');
          continue;
        }

        if (s.y > GAME_HEIGHT + 30) removeAt(stars, i);
      }

      // Update asteroids
      const asteroids = asteroidsRef.current;
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const a = asteroids[i];
        a.y += a.vy * dt;
        a.rotation += a.rotationSpeed * dt;

        if (checkCollision(a.x, a.y, a.radius, state.playerX, state.playerY, 14)) {
          removeAt(asteroids, i);
          state.lives--;
          state.consecutiveCatches = 0;
          state.multiplier = 1;
          EventBus.emit('lives-change', state.lives);
          spawnParticles(a.x, a.y, '#ef4444', 20);
          addPopup(a.x, a.y, '-1 \u2665', '#ef4444');
          state.shakeTime = 0.2;
          state.shakeIntensity = 4;
          state.playerFlashTime = 0.4;
          if (state.lives <= 0) triggerGameOver();
          continue;
        }

        if (a.y > GAME_HEIGHT + 40) removeAt(asteroids, i);
      }

      // Update particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) removeAt(particles, i);
      }

      // Update popups
      const popups = popupsRef.current;
      for (let i = popups.length - 1; i >= 0; i--) {
        const p = popups[i];
        p.life -= dt;
        p.y -= 50 * dt;
        if (p.life <= 0) removeAt(popups, i);
      }

      // Update bg stars
      const bgStars = bgStarsRef.current;
      for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        s.y += s.speed * dt;
        if (s.y > GAME_HEIGHT) {
          s.y = 0;
          s.x = Math.random() * GAME_WIDTH;
        }
      }

      // Shake timer
      if (state.shakeTime > 0) state.shakeTime -= dt;
      if (state.playerFlashTime > 0) state.playerFlashTime -= dt;

      // ===== RENDER =====
      ctx.save();

      // Screen shake
      if (state.shakeTime > 0) {
        ctx.translate(
          (Math.random() - 0.5) * state.shakeIntensity * 2,
          (Math.random() - 0.5) * state.shakeIntensity * 2,
        );
      }

      // Background (cached — no per-frame gradient)
      ctx.drawImage(sprites.bg, 0, 0);

      // Background stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Stars (pre-rendered sprite)
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.drawImage(sprites.star, -15, -15);
        ctx.restore();
      }

      // Asteroids (still drawn procedurally — varied sizes)
      for (let i = 0; i < asteroids.length; i++) {
        drawAsteroid(ctx, asteroids[i]);
      }

      // Player (pre-rendered sprite)
      if (state.playerFlashTime > 0) {
        ctx.globalAlpha = Math.sin(state.playerFlashTime * 25) > 0 ? 1 : 0.3;
      }
      ctx.drawImage(sprites.player, state.playerX - 20, state.playerY - 20);
      ctx.globalAlpha = 1;

      // Particles (batch by color to reduce state changes)
      let lastColor = '';
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        if (p.color !== lastColor) {
          ctx.fillStyle = p.color;
          lastColor = p.color;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Score popups
      ctx.textAlign = 'center';
      for (let i = 0; i < popups.length; i++) {
        const p = popups[i];
        const alpha = p.life / p.maxLife;
        const scale = 1 + (1 - alpha) * 0.5;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.font = `bold ${18 * scale}px "Arial Black", Arial, sans-serif`;
        ctx.fillText(p.text, p.x, p.y);
      }
      ctx.globalAlpha = 1;

      // Fade in overlay
      if (state.fadeIn < 1) {
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - state.fadeIn})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(gameLoop);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      EventBus.removeAll();
    };
  }, [initBgStars]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="rounded-lg shadow-2xl"
      style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
    />
  );
}
