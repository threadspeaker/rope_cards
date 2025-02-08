// Mini card for player hand count display
const MiniHandDisplay: React.FC<{ count: number }> = ({ count }) => (
  <div className="relative w-16 h-24 rounded-lg border-2 border-black bg-gray-100 flex items-center justify-center">
    <span className="text-2xl font-bold">{count}</span>
  </div>
);

// Score display with dollar sign icon
const ScoreDisplay: React.FC<{ score: number }> = ({ score }) => (
  <div className="flex items-center gap-1">
    <span className="font-semibold">Score: {score}</span>
  </div>
);

export { MiniHandDisplay, ScoreDisplay };