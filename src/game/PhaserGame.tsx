import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './config';
import { EventBus } from './EventBus';

interface PhaserGameProps {
  onScoreChange?: (score: number) => void;
  onLivesChange?: (lives: number) => void;
  onLevelChange?: (level: number) => void;
  onGameOver?: (score: number, highScore: number) => void;
}

export default function PhaserGame({
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: PhaserGameProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || gameInstance.current) return;

    const config = createGameConfig(gameRef.current);
    gameInstance.current = new Phaser.Game(config);

    return () => {
      EventBus.removeAll();
      gameInstance.current?.destroy(true);
      gameInstance.current = null;
    };
  }, []);

  // Subscribe to game events
  useEffect(() => {
    const unsubs: (() => void)[] = [];
    if (onScoreChange) unsubs.push(EventBus.on('score-change', onScoreChange));
    if (onLivesChange) unsubs.push(EventBus.on('lives-change', onLivesChange));
    if (onLevelChange) unsubs.push(EventBus.on('level-change', onLevelChange));
    if (onGameOver) unsubs.push(EventBus.on('game-over', onGameOver));
    return () => unsubs.forEach((fn) => fn());
  }, [onScoreChange, onLivesChange, onLevelChange, onGameOver]);

  return (
    <div
      ref={gameRef}
      className="rounded-lg overflow-hidden shadow-2xl"
      style={{ width: 800, height: 600 }}
    />
  );
}
