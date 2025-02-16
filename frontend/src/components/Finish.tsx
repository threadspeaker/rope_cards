import React, { useEffect } from 'react';
import { useSignalR } from './SignalRContext';
import { useGame } from './GameContext';
import SidePanel from './SidePanel';
import { MiniHandDisplay, ScoreDisplay } from './PlayerInfo';

export const Finish: React.FC = () => {
  const { connection } = useSignalR();
  const {
    gameState,
  } = useGame();

  useEffect(() => {
    if (!connection) return;

    return () => {
    };
  }, [connection]);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading game...</h2>
        </div>
      </div>
    );
  }

  let max_score = -10000;
  gameState.Players.forEach(player => {
      if (player.Points > max_score) {
        max_score = player.Points;
      }
  });
  let winners = gameState.Players.filter(p => p.Points === max_score).map(p => p.Name);

  return (
    <div className="flex w-full h-screen">
      <div className="w-full max-w-screen-2xl mx-auto p-4 flex flex-col gap-8">
        <div className="flex justify-between items-start px-8">
          {gameState.Players.map(player => (
            <div key={player.Name} className="flex flex-col items-center gap-2">
              <h2 className={"`text-xl font-bold"}>
                {player.Name}
              </h2>
              <ScoreDisplay score={player.Points} />
              <MiniHandDisplay count={player.Cards.length} />
            </div>
          ))}
        </div>
        <div className="flex w-full h-full items-center">
          <h1 className="mx-auto text-9xl font-black">
            {winners.length === 1 && `${winners[0]} is the winner!`}
            {winners.length > 1 && `${winners.join(", ")} have tied with the highest score`}
          </h1>
        </div>
      </div>
      <SidePanel />
    </div>
  );
};