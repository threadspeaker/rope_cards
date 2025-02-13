import React, { useEffect, useCallback } from 'react';
import { useSignalR } from './SignalRContext';
import { GameCard, GameState, PlayerInfo } from '../types/Types';
import { useGame } from './GameContext';
import GameInterface from './GameInterface';

export const Game: React.FC = () => {
  const { connection } = useSignalR();
  const {
    lobbyId,
    playerName,
    gameState,
    setGameState,
    setGameMode,
    setPlayerError
  } = useGame();

  const orderCardList = (sourceCardList: GameCard[], selection: GameCard[]): GameCard[] => {
    const indexMap = new Map<string, number>();
    sourceCardList.forEach((c, i) => {
      let key = `${c.Primary}-${c.Secondary}`;
      indexMap.set(key, i);
    });

    return selection.sort((a, b) => {
      let keyA = `${a.Primary}-${a.Secondary}`;
      let keyB = `${b.Primary}-${b.Secondary}`;
      const indexA = indexMap.get(keyA) ?? -1;
      const indexB = indexMap.get(keyB) ?? -1;
      return indexA - indexB;
    });
  };


  const parsePlayersInfosToGameState = useCallback((playerInfos: PlayerInfo[]) => {
    let newGameState: GameState = {
      Players: playerInfos.map((player: any) => ({
        Name: player.name,
        IsTurn: player.isTurn,
        Cards: player.cards.map((card: any) => ({
          Primary: card.primary,
          Secondary: card.secondary
        })),
        Points: player.points
      }))
    };

    setGameState(newGameState);
  }, [setGameState]);

  useEffect(() => {
    if (!connection) return;

    connection.on('InitialGameState', (playerInfos: PlayerInfo[]) => {
      parsePlayersInfosToGameState(playerInfos);
    });

    connection.on("GameMode", (mode: number) => {
      setGameMode(mode);
    });

    connection.on("UpdateGameState", (playerInfos: PlayerInfo[]) => {
      parsePlayersInfosToGameState(playerInfos);
    });

    connection.on("SetPlay", (playerName: string, cards: any[]) => {
      setPlayerError(null);
      setGameState(prev => {
        if (!prev) return prev;

        const newState = { ...prev };

        if (!playerName || !cards) {
          newState.CurrentPlay = undefined;
        }
        else if (playerName === "" || cards.length === 0) {
          newState.CurrentPlay = undefined;
        }
        else {
          newState.CurrentPlay = {
            Cards: cards.map((c) => {
              return {
                Primary: c.primary,
                Secondary: c.secondary
              } as GameCard;
            }),
            PlayerName: playerName
          };
        }
        return newState;
      });
    });

    connection.on("PlayerError", (message: string) => {
      setPlayerError(message);
    });

    return () => {
      connection.off('InitialGameState');
      connection.off('GameEvent');
      connection.off('UpdateGameState');
      connection.off('SetPlay');
      connection.off('PlayerError');
    };
  }, [connection, parsePlayersInfosToGameState]);

  const handlePlay = (cards: GameCard[]) => {
    if (!gameState) return;
    let user = gameState.Players.find(p => p.Name === playerName)
    if (!user) return;

    cards = orderCardList(user.Cards, cards);

    // Stub for testing locally without server
    // setGameState({
    //   ...gameState,
    //   CurrentPlay: {
    //     PlayerName: playerName,
    //     Cards: cards
    //   }
    // });

    connection?.invoke('PlayCards', lobbyId, cards);
  };

  const handleScout = (card: GameCard, insertionPoint: number) => {
    setPlayerError(null);
    connection?.invoke('ScoutCard', lobbyId.toUpperCase(), card, insertionPoint);
  };

  const handleFlip = () => {
    connection?.invoke('FlipPlayerHand', lobbyId.toUpperCase());
  };

  const handleKeep = () => {
    connection?.invoke('KeepPlayerHand', lobbyId.toUpperCase());
  };

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

  return (
    <GameInterface
      gameState={gameState}
      currentUserName={playerName}
      onPlay={handlePlay}
      onScout={handleScout}
      onFlip={handleFlip}
      onKeep={handleKeep}
    />
  );
};