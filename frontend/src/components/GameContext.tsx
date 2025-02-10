import React, { createContext, useContext, useState } from 'react';
import { GameState } from '../types/Types';

export interface Player {
    name: string;
    isHost: boolean;
}

interface GameContextType {
    playerName: string;
    setPlayerName: React.Dispatch<React.SetStateAction<string>>;
    lobbyId: string;
    setLobbyId: React.Dispatch<React.SetStateAction<string>>;
    players: Player[];
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    isHost: boolean;
    setIsHost: React.Dispatch<React.SetStateAction<boolean>>;
    pageState: 'lobby' | 'game';
    setPageState: React.Dispatch<React.SetStateAction<'lobby' | 'game'>>;
    gameState: GameState | null;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    gameMode: number;
    setGameMode: React.Dispatch<React.SetStateAction<number>>;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [playerName, setPlayerName] = useState('');
    const [lobbyId, setLobbyId] = useState('');
    const [players, setPlayers] = useState<Player[]>([]);
    const [isHost, setIsHost] = useState(false);
    const [pageState, setPageState] = useState<'lobby' | 'game'>('lobby');
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [gameMode, setGameMode] = useState<number>(0);

    return (
        <GameContext.Provider value={{
            playerName, setPlayerName,
            lobbyId, setLobbyId,
            players, setPlayers,
            isHost, setIsHost,
            pageState: pageState, setPageState: setPageState,
            gameState, setGameState,
            gameMode, setGameMode
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within a GameProvider');
    return context;
};