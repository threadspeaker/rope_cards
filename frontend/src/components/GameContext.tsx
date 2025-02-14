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
    pageState: 'lobby' | 'game' | 'finish';
    setPageState: React.Dispatch<React.SetStateAction<'lobby' | 'game' | 'finish'>>;
    gameState: GameState | null;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    gameMode: number;
    setGameMode: React.Dispatch<React.SetStateAction<number>>;
    playerError: string | null;
    setPlayerError: React.Dispatch<React.SetStateAction<string | null>>;
    logExpanded: boolean;
    setLogExpanded: React.Dispatch<React.SetStateAction<boolean>>;
    log: string[];
    setLog: React.Dispatch<React.SetStateAction<string[]>>;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [playerName, setPlayerName] = useState('');
    const [lobbyId, setLobbyId] = useState('');
    const [players, setPlayers] = useState<Player[]>([]);
    const [isHost, setIsHost] = useState(false);
    const [pageState, setPageState] = useState<'lobby' | 'game' | 'finish'>('lobby');
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [gameMode, setGameMode] = useState<number>(0);
    const [playerError, setPlayerError] = useState<string | null>(null);
    const [logExpanded, setLogExpanded] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    return (
        <GameContext.Provider value={{
            playerName, setPlayerName,
            lobbyId, setLobbyId,
            players, setPlayers,
            isHost, setIsHost,
            pageState: pageState, setPageState,
            gameState, setGameState,
            gameMode, setGameMode,
            playerError, setPlayerError,
            logExpanded, setLogExpanded,
            log, setLog
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