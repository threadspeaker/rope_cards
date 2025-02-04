import React from 'react';
import { SignalRProvider } from './components/SignalRContext';
import { GameProvider, useGame } from './components/GameContext';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';

export const App: React.FC = () => {
  return (
    <SignalRProvider>
      <GameProvider>
        <GameStateRouter />
      </GameProvider>
    </SignalRProvider>
  );
};

const GameStateRouter: React.FC = () => {
  const { gameState } = useGame();
  return gameState === 'lobby' ? <Lobby /> : <Game />;
};