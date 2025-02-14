import React, { useState, useEffect, useCallback } from 'react';
import { useSignalR } from './SignalRContext';
import { useGame } from './GameContext';

export const Lobby: React.FC = () => {
    const {
        playerName, setPlayerName,
        lobbyId, setLobbyId,
        players, setPlayers,
        isHost, setIsHost,
        setPageState
    } = useGame();

    const [error, setError] = useState('');
    const [inLobby, setInLobby] = useState(false);
    const { connection } = useSignalR();

    const handleLobbyCreated = useCallback((lobbyId: string, hostName: string) => {
        setLobbyId(lobbyId);
        setInLobby(true);
        setIsHost(true);
        setPlayers(prev => [...prev, { name: hostName, isHost: true }]);
        setError('');
    }, [isHost]);

    const handlePlayerJoined = useCallback((playerName: string, isHost: boolean) => {
        setPlayers(prev => [...prev, { name: playerName, isHost: isHost }]);
        setError('');
    }, []); // No dependencies needed since we're using functional updates

    const handlePlayerLeft = useCallback((playerName: string) => {
        setPlayers(prev => prev.filter(p => p.name !== playerName));
    }, []); // No dependencies needed since we're using functional updates

    const handleNewHost = useCallback((hostName: string) => {
        setPlayers(prev => prev.map(p => ({
            ...p,
            isHost: p.name === hostName
        })));
        setIsHost(playerName === hostName);
    }, []); // No dependencies needed since we're using functional updates

    useEffect(() => {
        if (!connection) return;

        // Set up event handlers
        connection.on('LobbyCreated', handleLobbyCreated);
        connection.on('PlayerJoined', handlePlayerJoined);
        connection.on('PlayerLeft', handlePlayerLeft);
        connection.on('NewHost', handleNewHost);
        connection.on('GameStarted', () => {
            setPageState('game');
        });
        connection.on('Error', (message: string) => {
            setError(message);
        });
        return () => {
            connection.off('LobbyCreated');
            connection.off('PlayerJoined');
            connection.off('PlayerLeft');
            connection.off('NewHost');
            connection.off('GameStarted');
            connection.off('Error');
        };
    }, [connection]);

    const createLobby = useCallback(async () => {
        if (!playerName.trim()) {
            setError('Please enter your name');
            return;
        }

        try {
            await connection?.invoke('CreateLobby', playerName);
        } catch (err) {
            console.error('Error creating lobby: ', err);
            setError('Failed to create lobby');
        }
    }, [connection, playerName]);

    const joinLobby = useCallback(async () => {
        if (!playerName.trim()) {
            setError('Please enter your name');
            return;
        }

        if (!lobbyId.trim()) {
            setError('Please enter a lobby code');
            return;
        }

        try {
            const success = await connection?.invoke('JoinLobby', lobbyId.toUpperCase(), playerName);
            if (success) {
                setInLobby(true);
            }
        } catch (err) {
            console.error('Error joining lobby: ', err);
            setError('Failed to join lobby');
        }
    }, [connection, playerName, lobbyId]);

    const startGame = useCallback(async () => {
        if (players.length < 3) {
            setError('Minimum 3 players');
            return;
        }
        if (!isHost) {
            setError('Only the game host can start the game')
            return;
        }
        try {
            const success = await connection?.invoke('StartGame', lobbyId.toUpperCase());
            if (success) {
                // start the game here
                console.log('Time to Begin!');
            }
        } catch (err) {
            console.error('Error starting the game: ', err);
            setError('Failed to start the game');
        }
    }, [connection, players, isHost, lobbyId]);

    if (inLobby) {
        return (
            <div className="p-4">
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">
                            Lobby Code: <span className="text-blue-600">{lobbyId}</span>
                        </h2>
                        {isHost && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                Host
                            </span>
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="border rounded-lg p-4">
                        <h3 className="font-bold mb-2">Players</h3>
                        <ul className="space-y-2">
                            {players.map((player, index) => (
                                <li key={index} className="flex items-center justify-between">
                                    <span>{player.name}</span>
                                    {player.isHost && (
                                        <span className="text-blue-600">👑</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {isHost && (
                        <div className='flex justify-center'>
                            <button
                                className="bg-blue-500 text-white m-4 p-2 rounded hover:bg-blue-600 transition-colors"
                                onClick={startGame}
                            >
                                Start Scouting!
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-6 text-center">Game Lobby</h1>

                {error && (
                    <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Enter your name"
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
                            onClick={createLobby}
                        >
                            Create Lobby
                        </button>

                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                placeholder="LOBBY CODE"
                                className="flex-1 p-2 border rounded uppercase focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={lobbyId}
                                onChange={(e) => setLobbyId(e.target.value.toUpperCase())}
                                maxLength={6}
                            />
                            <button
                                className="bg-green-500 text-white px-4 rounded hover:bg-green-600 transition-colors"
                                onClick={joinLobby}
                            >
                                Join
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};