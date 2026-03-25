import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, Trophy } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const highScore = parseInt(localStorage.getItem('highScore') || '0');

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 40%, #0d1b2a 70%, #0a0a1a 100%)',
      }}
    >
      <Card className="w-full max-w-md bg-slate-900/80 border-slate-700 text-white backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            My Game
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Collect stars. Dodge asteroids. How far can you go?
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {highScore > 0 && (
            <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-slate-300 text-sm">High Score</span>
              <Badge variant="secondary" className="bg-yellow-400/10 text-yellow-400 border-yellow-400/20">
                {highScore}
              </Badge>
            </div>
          )}

          <Button
            onClick={() => navigate('/play')}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0"
            size="lg"
          >
            Play
          </Button>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-xs text-slate-500">Arrow keys / WASD to move</p>
        </CardFooter>
      </Card>
    </div>
  );
}
