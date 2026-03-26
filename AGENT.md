# 2D Game Boilerplate — Quick Reference

## Stack
- React 18 + TypeScript + Vite
- HTML5 Canvas (`CanvasRenderingContext2D`) for game rendering
- **Matter.js** — 2D rigid body physics (collisions, forces, constraints)
- **Howler.js** — Audio playback (sprites, pooling, mobile support)
- Tailwind CSS + shadcn/ui for menus, HUD, overlays
- Lucide React for icons
- No game engine — all rendering via Canvas API and `requestAnimationFrame`

## Project Structure
```
src/
├── main.tsx              # React entry point
├── App.tsx               # Router with /, /play, /game-over routes
├── index.css             # Tailwind + design tokens
├── game/
│   ├── GameCanvas.tsx    # Main game canvas component (game loop + rendering)
│   └── EventBus.ts       # Game ↔ React event bridge
├── pages/
│   ├── Home.tsx          # Title screen (React + shadcn/ui)
│   ├── Play.tsx          # Game page with HUD + GameCanvas
│   └── GameOver.tsx      # Results screen
├── components/ui/        # shadcn/ui components (55+ pre-installed)
├── hooks/
└── lib/
```

## Game Architecture Pattern

### Canvas Game Loop (in a React component)
```tsx
import { useEffect, useRef } from 'react';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({ /* mutable game state */ });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!; // alpha:false = faster

    let lastTime = 0;

    function loop(timestamp: number) {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
      lastTime = timestamp;

      update(dt);
      render(ctx);

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return <canvas ref={canvasRef} width={800} height={600} />;
}
```

### Key patterns:
- Use `useRef` for mutable game state (not `useState` — avoids re-renders)
- Use `useState` only for React UI that needs to re-render (HUD scores, etc.)
- Use `EventBus` to send game events to React (score changes, game over)
- Delta time (`dt`) for frame-rate-independent movement

## Performance Best Practices

### Pre-render sprites to offscreen canvases
```ts
// Create once at init, reuse every frame
function createSprite(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  return c;
}

const playerSprite = createSprite(40, 40, (ctx) => { /* draw player */ });

// In render loop — drawImage is faster than redrawing paths
ctx.drawImage(playerSprite, x - 20, y - 20);
```

### Cache static backgrounds
```ts
// Draw gradient/stars once to an offscreen canvas
const bgCanvas = createSprite(800, 600, (ctx) => {
  const grad = ctx.createLinearGradient(0, 0, 800, 600);
  grad.addColorStop(0, '#0a0a1a');
  grad.addColorStop(1, '#1a1a3e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 600);
});
// In loop: ctx.drawImage(bgCanvas, 0, 0);
```

### Use swap-remove for arrays (O(1) instead of O(n) splice)
```ts
function removeAt<T>(arr: T[], i: number) {
  arr[i] = arr[arr.length - 1];
  arr.pop();
}
```

### Minimize state changes
```ts
// Batch draws by color — set fillStyle once, draw many
ctx.fillStyle = '#ffd93d';
for (const p of particles) { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); }
```

### Use `{ alpha: false }` for opaque canvases
```ts
const ctx = canvas.getContext('2d', { alpha: false })!;
```

## Matter.js — Physics Engine

Use Matter.js for games needing realistic physics (pool, pinball, angry birds, marble games).

### Setup
```ts
import Matter from 'matter-js';

const engine = Matter.Engine.create();
const world = engine.world;

// Create bodies
const ball = Matter.Bodies.circle(400, 300, 15, {
  restitution: 0.9,  // Bounciness
  friction: 0.05,
  density: 0.01,
});
const ground = Matter.Bodies.rectangle(400, 590, 800, 20, { isStatic: true });

Matter.Composite.add(world, [ball, ground]);
```

### Update in game loop
```ts
function update(dt: number) {
  Matter.Engine.update(engine, dt * 1000); // Matter uses ms
}
```

### Render Matter bodies with Canvas
```ts
function render(ctx: CanvasRenderingContext2D) {
  for (const body of Matter.Composite.allBodies(world)) {
    ctx.beginPath();
    const vertices = body.vertices;
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }
}
```

### Common patterns
```ts
// Apply force (e.g., cue stick hit)
Matter.Body.applyForce(ball, ball.position, { x: 0.05, y: 0 });

// Set velocity directly (e.g., jump)
Matter.Body.setVelocity(player, { x: 0, y: -10 });

// Collision events
Matter.Events.on(engine, 'collisionStart', (event) => {
  for (const pair of event.pairs) {
    // pair.bodyA, pair.bodyB
  }
});

// Constraints (e.g., rope, joint)
const rope = Matter.Constraint.create({
  bodyA: anchor, bodyB: ball,
  length: 100, stiffness: 0.01,
});

// Walls
const walls = [
  Matter.Bodies.rectangle(400, 0, 800, 20, { isStatic: true }),   // top
  Matter.Bodies.rectangle(400, 600, 800, 20, { isStatic: true }), // bottom
  Matter.Bodies.rectangle(0, 300, 20, 600, { isStatic: true }),   // left
  Matter.Bodies.rectangle(800, 300, 20, 600, { isStatic: true }), // right
];
```

### When to use Matter.js vs simple math
| Game type | Use |
|-----------|-----|
| Platformer, shooter, arcade | Simple math (velocity + gravity + AABB) |
| Pool, billiards, marble | Matter.js (elastic collisions) |
| Angry birds, destruction | Matter.js (rigid bodies, forces) |
| Pinball | Matter.js (bouncing, flippers as constraints) |
| Ragdoll, rope physics | Matter.js (constraints, composite bodies) |
| Top-down RPG, puzzle | Simple math |

## Howler.js — Audio

### Setup
```ts
import { Howl } from 'howler';

// Procedural sounds with sprite sheet
const sfx = new Howl({
  src: ['data:audio/wav;base64,...'], // or URL
  sprite: {
    collect: [0, 200],
    hit: [300, 400],
    jump: [800, 150],
  },
  volume: 0.5,
});

sfx.play('collect');
```

### Quick procedural sound (no audio files needed)
```ts
import { Howl } from 'howler';

function createToneBuffer(freq: number, duration: number, type: OscillatorType = 'square'): string {
  const ctx = new OfflineAudioContext(1, 44100 * duration, 44100);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.3, 0);
  gain.gain.exponentialRampToValueAtTime(0.001, duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(duration);
  // Render and convert to data URL — use Howl for playback
  return ''; // See Howler docs for buffer loading
}

// Simpler: use Web Audio API directly for procedural, Howler for file-based
const audioCtx = new AudioContext();
function playTone(freq: number, dur: number, type: OscillatorType = 'sine') {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}
```

### Background music
```ts
const bgm = new Howl({
  src: ['/assets/music.mp3'],
  loop: true,
  volume: 0.3,
});
bgm.play();
// bgm.pause(); bgm.stop();
```

## Canvas 2D Rendering

### Drawing with detail (NOT flat rectangles)
```ts
// Gradients
const grad = ctx.createLinearGradient(x, y, x, y + h);
grad.addColorStop(0, '#4a90d9');
grad.addColorStop(1, '#2a5098');
ctx.fillStyle = grad;

// Glow effects
const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
glow.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
glow.addColorStop(1, 'rgba(255, 200, 0, 0)');

// Shadows
ctx.shadowColor = 'rgba(0, 229, 255, 0.5)';
ctx.shadowBlur = 15;
ctx.fillRect(x, y, w, h);
ctx.shadowBlur = 0; // Reset after use

// Rounded rectangles
ctx.beginPath();
ctx.roundRect(x, y, w, h, radius);
ctx.fill();
```

## Collision Detection (Simple — when not using Matter.js)

### AABB
```ts
function aabb(a: {x:number,y:number,w:number,h:number}, b: {x:number,y:number,w:number,h:number}) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
```

### Circle-circle
```ts
function circleCollision(x1:number, y1:number, r1:number, x2:number, y2:number, r2:number) {
  const dx = x1 - x2, dy = y1 - y2;
  return dx*dx + dy*dy < (r1+r2)*(r1+r2);
}
```

## Input Handling
```ts
const keys = useRef(new Set<string>());
useEffect(() => {
  const down = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase());
  const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
}, []);
```

## Game → React Communication (EventBus)
```ts
// In game loop — emit to React
EventBus.emit('score-change', score);

// In React component — subscribe
useEffect(() => {
  const unsub = EventBus.on('score-change', setScore);
  return unsub;
}, []);
```

## UI Split
| Element | Technology |
|---------|-----------|
| Game rendering | Canvas API |
| Title screen, game over | React + shadcn/ui |
| In-game HUD (score, lives) | React (positioned above canvas) |
| Pause menu, settings | React overlay |
| Particles, effects | Canvas API |
| Sound | Howler.js (files) or Web Audio API (procedural) |
| Physics | Matter.js (complex) or simple math (basic) |

## Game Feel ("Juice")
- **Screen shake**: Offset canvas translate by random px for N frames
- **Particles**: Spawn small circles with velocity + fade on events
- **Score popups**: Floating text that rises and fades
- **Player flash**: Toggle alpha on damage
- **Fade transitions**: Draw black rect with decreasing alpha
- **Smooth movement**: Always multiply by `dt` (delta time)

## Pre-installed Packages
- react, react-dom, react-router-dom
- matter-js (@types/matter-js)
- howler (@types/howler)
- tailwindcss, shadcn/ui components (55+)
- lucide-react, recharts, zod, react-hook-form

Import shadcn components from `@/components/ui/<component>`.
