import React, { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Dot } from 'lucide-react';
import { useSignalR } from './SignalRContext';
import { useGame } from './GameContext';

interface SidePanelProps {
    children?: React.ReactNode;
}

const SidePanel: React.FC<SidePanelProps> = ({ children }) => {
    const { connection } = useSignalR();
    const { logExpanded, setLogExpanded, log, setLog } = useGame();

    const addMessageToGameLog = useCallback((message: string) => {
        setLog(prev => [...prev, message]);
    }, [setLog]);

    useEffect(() => {
        if (!connection) return;

        connection.on('GameLog', (message: string) => {
            addMessageToGameLog(message);
        });

        return () => {
            connection.off('GameLog');
        };
    }, [connection, addMessageToGameLog]);

    return (
        <div
            className={`
        fixed top-0 right-0 h-full bg-white shadow-lg
        transition-all duration-300 ease-in-out
        flex
        ${logExpanded ? 'w-80' : 'w-12'}
        md:relative
      `}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setLogExpanded(!logExpanded)}
                className="absolute left-0 top-1/2 -translate-x-full
                   bg-white p-2 rounded-l-lg shadow-lg
                   hover:bg-gray-100 transition-colors
                   md:flex"
            >
                {logExpanded ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>

            {/* Panel Content */}
            <div className={`
        w-full p-4 overflow-y-auto
        ${logExpanded ? 'opacity-100' : 'opacity-0'}
        transition-opacity duration-300
      `}>
                <h2 className="text-lg font-semibold mb-4">Game Log</h2>
                {log.map(msg => (
                    <div className="flex gap-2" key={msg}>
                        <Dot className="flex-shrink-0" />
                        {msg}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SidePanel;
