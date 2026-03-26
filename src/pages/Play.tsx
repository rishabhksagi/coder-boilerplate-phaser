import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameCanvas from '@/game/GameCanvas';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, Layers } from 'lucide-react';

export default function Play() {
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);

  const handleGameOver = useCallback(
    (finalScore: number, highScore: number) => {
      navigate('/game-over', { state: { score: finalScore, highScore } });
    },
    [navigate],
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 gap-4"
      style={{
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 40%, #0d1b2a 70%, #0a0a1a 100%)',
      }}
    >
      {/* HUD */}
      <div className="w-[800px] flex items-center justify-between">
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm bg-slate-900/80 border-slate-700 text-white">
          <Star className="w-4 h-4 text-yellow-400" />
          {score}
        </Badge>

        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm bg-slate-900/80 border-slate-700 text-white">
          <Layers className="w-4 h-4 text-cyan-400" />
          Level {level}
        </Badge>

        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-5 h-5 transition-all duration-300 ${
                i < lives
                  ? 'text-red-500 fill-red-500 scale-100'
                  : 'text-slate-700 scale-75'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Game Canvas */}
      <GameCanvas
        onScoreChange={setScore}
        onLivesChange={setLives}
        onLevelChange={setLevel}
        onGameOver={handleGameOver}
      />
    </div>
  );
}
