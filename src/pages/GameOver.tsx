import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, RotateCcw, Home } from 'lucide-react';

export default function GameOver() {
  const navigate = useNavigate();
  const location = useLocation();
  const { score = 0, highScore = 0 } = (location.state as { score: number; highScore: number }) || {};
  const isNewHighScore = score >= highScore && score > 0;

  // Animated counter
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (score === 0) return;
    const duration = 1000;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.floor(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 40%, #0d1b2a 70%, #0a0a1a 100%)',
      }}
    >
      <Card className="w-full max-w-md bg-slate-900/80 border-slate-700 text-white backdrop-blur">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-rose-400">
            Game Over
          </CardTitle>

          {isNewHighScore && (
            <Badge className="mx-auto bg-yellow-400/10 text-yellow-400 border-yellow-400/20 animate-pulse">
              <Trophy className="w-3.5 h-3.5 mr-1" />
              New High Score!
            </Badge>
          )}
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <div>
            <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Score</p>
            <p className="text-6xl font-bold text-yellow-400 tabular-nums">
              {displayScore}
            </p>
          </div>

          {!isNewHighScore && highScore > 0 && (
            <p className="text-slate-500 text-sm">
              Best: {highScore}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={() => navigate('/play')}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full h-12 text-base border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Main Menu
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
