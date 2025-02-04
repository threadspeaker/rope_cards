import React, { createContext, useContext, useState } from 'react';

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
    gameState: 'lobby' | 'game';
    setGameState: React.Dispatch<React.SetStateAction<'lobby' | 'game'>>;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [playerName, setPlayerName] = useState('');
    const [lobbyId, setLobbyId] = useState('');
    const [players, setPlayers] = useState<Player[]>([]);
    const [isHost, setIsHost] = useState(false);
    const [gameState, setGameState] = useState<'lobby' | 'game'>('lobby');

    return (
        <GameContext.Provider value={{
            playerName, setPlayerName,
            lobbyId, setLobbyId,
            players, setPlayers,
            isHost, setIsHost,
            gameState, setGameState
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