import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '@/pages/Home'
import Play from '@/pages/Play'
import GameOver from '@/pages/GameOver'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play" element={<Play />} />
      <Route path="/game-over" element={<GameOver />} />
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      {/* Add more routes here */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
