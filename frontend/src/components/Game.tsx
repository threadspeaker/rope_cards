import React, { useEffect } from 'react';
import { useSignalR } from './SignalRContext';

export const Game: React.FC = () => {
  const { connection } = useSignalR();
  
  useEffect(() => {
    if (!connection) return;
    
    connection.on('GameEvent', (data) => {
      // Handle game events
    });
    
    return () => {
      connection.off('GameEvent');
    };
  }, [connection]);

  return (
    <div>Game Component</div>
  );
};