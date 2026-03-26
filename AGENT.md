# 2D Game Boilerplate — Quick Reference

## Stack
- React 18 + TypeScript + Vite
- HTML5 Canvas (`CanvasRenderingContext2D`) for game rendering
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
    const ctx = canvas.getContext('2d')!;
    let lastTime = 0;

    function loop(timestamp: number) {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
      lastTime = timestamp;

      // Update game state
      update(dt);
      // Render
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
- Use `requestAnimationFrame` for the game loop
- Delta time (`dt`) for frame-rate-independent movement

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

### Sprite-quality characters
```ts
function drawCharacter(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  // Body with gradient
  const bodyGrad = ctx.createLinearGradient(0, -10, 0, 10);
  bodyGrad.addColorStop(0, '#4a90d9');
  bodyGrad.addColorStop(1, '#2a5098');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-12, -10, 24, 20, 4);
  ctx.fill();
  // Eyes, details, etc.
  ctx.restore();
}
```

## Collision Detection

### AABB (axis-aligned bounding box)
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

// In game loop:
if (keys.current.has('arrowleft') || keys.current.has('a')) { /* move left */ }
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
| Sound | Web Audio API |

## Game Feel ("Juice")
- **Screen shake**: Offset canvas translate by random px for N frames
- **Particles**: Spawn small circles with velocity + fade on events
- **Score popups**: Floating text that rises and fades
- **Player flash**: Toggle alpha on damage
- **Fade transitions**: Draw black rect with decreasing alpha
- **Smooth movement**: Always multiply by `dt` (delta time)

## Simple Physics
```ts
// Velocity + gravity
entity.vy += gravity * dt;
entity.y += entity.vy * dt;

// Ground collision
if (entity.y + entity.height > groundY) {
  entity.y = groundY - entity.height;
  entity.vy = 0;
  entity.grounded = true;
}

// Jump
if (keys.has('arrowup') && entity.grounded) {
  entity.vy = -jumpForce;
  entity.grounded = false;
}
```

## Web Audio API (Sound)
```ts
const audioCtx = new AudioContext();
function playSound(freq: number, duration: number, type: OscillatorType = 'sine') {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
// Collect sound: playSound(880, 0.1, 'square');
// Hit sound: playSound(200, 0.2, 'sawtooth');
```

## Pre-installed shadcn/ui Components
Accordion, Alert, AlertDialog, Avatar, Badge, Button, Calendar, Card, Carousel, Checkbox, Collapsible, Command, Dialog, DropdownMenu, Form, HoverCard, Input, Label, Menubar, NavigationMenu, Pagination, Popover, Progress, RadioGroup, Resizable, ScrollArea, Select, Separator, Sidebar, Skeleton, Slider, Sonner, Switch, Tabs, Textarea, Toast, Toggle, Tooltip, and more.

Import from `@/components/ui/<component>`.
