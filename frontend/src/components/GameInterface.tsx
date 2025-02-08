import React, { useState } from 'react';
import { CardRow } from './CardRow';
import { MiniHandDisplay, ScoreDisplay } from './PlayerInfo';
import type { GameState, GameCard } from '../types/Types';

type GameInterfaceProps = {
    gameState: GameState;
    currentUserName: string;
    onPlay: (cards: GameCard[]) => void;
    onScout: (card: GameCard) => void;
};

const GameInterface: React.FC<GameInterfaceProps> = ({
    gameState,
    currentUserName,
    onPlay,
    onScout
}) => {
    
    const [selectedHandCards, setSelectedHandCards] = useState<GameCard[]>([]);
    const [selectedPlayCard, setSelectedPlayCard] = useState<GameCard | null>(null);
    
    // Don't try rendering stuff if we don't have a proper game state yet
    if (!gameState?.Players) {
        return <div>Invalid game state</div>;
    }
    const currentPlayer = gameState.Players.find(p => p.IsTurn);
    const currentUserInfo = gameState.Players.find(p => p.Name === currentUserName);

    const handlePlayCardClick = (card: GameCard) => {
        if (!currentUserInfo?.IsTurn) return;
        if (!gameState.CurrentPlay?.Cards || !gameState.CurrentPlay.Cards.length) return;

        // At this point, we know CurrentPlay.Cards exists and has length
        const currentPlay = gameState.CurrentPlay.Cards; // store in variable to help TypeScript

        setSelectedPlayCard(prev => {
            const permittedIndexes = [0, currentPlay.length - 1] // Only allow selecting end cards
            const selectedIndex = currentPlay.findIndex(
                c => c.Primary === card.Primary && c.Secondary === card.Secondary
            );

            let prevIndex = null;
            if (prev) {
                prevIndex = currentPlay.findIndex(
                    c => c.Primary === prev.Primary && c.Secondary === prev.Secondary
                );
            }

            if (prevIndex === selectedIndex) return null; // deselect
            else if (selectedIndex === permittedIndexes[0] || selectedIndex === permittedIndexes[1]) {
                // selecting a card from the play. Deselect anything in the user's hand as well.
                setSelectedHandCards([]);
                return currentPlay[selectedIndex];
            }
            else return prev; // invalid selection. Keep things as they are.
        });
    };

    const handleHandCardClick = (card: GameCard) => {
        if (!currentUserInfo?.IsTurn) return;

        setSelectedHandCards(prev => {
            const cardIndex = currentUserInfo.Cards.findIndex(c =>
                c.Primary === card.Primary && c.Secondary === card.Secondary
            );
            const selectedIndex = prev.findIndex(c =>
                c.Primary === card.Primary && c.Secondary === card.Secondary
            );

            if (selectedIndex === -1) {
                // selecting a new card.
                // Check if it is adjacent to already selected cards
                const isAdjacent = prev.some(selectedCard => {
                    const selectedIndex = currentUserInfo.Cards.findIndex(c =>
                        c.Primary === selectedCard.Primary && c.Secondary === selectedCard.Secondary
                    );
                    return Math.abs(selectedIndex - cardIndex) === 1;
                });

                // Add the new card iff there were no previous selections, or the previous ones are adjacent
                if (prev.length === 0 || isAdjacent) {
                    // deselect any cards of the central play when selecting from the hand
                    setSelectedPlayCard(null);
                    // Note: the order of cards in prev might not match the order of cards in the hand.
                    // If the user plays the cards, we will need to at that time reorder prev.
                    return [...prev, card];
                }
            } else {
                // deselecting. When deselecting, we can't allow the remaining cards to not be adjacent.
                // TODO: allow deselecting of edge cards to keep the rest of the selection.
                // For now, we will deselect everything to be safe.
                return [];
                /* return prev.filter(c =>
                    !(c.Primary === card.Primary && c.Secondary === card.Secondary)
                ); **/
            }

            return prev;
        });
    };

    const canPlay = selectedHandCards.length > 0;
    const canScout = selectedPlayCard !== null && selectedHandCards.length === 0;

    return (
        <div className="w-full max-w-6xl mx-auto p-4 flex flex-col gap-8">
            <div className="flex justify-between items-start px-8">
                {gameState.Players.map(player => (
                    <div key={player.Name} className="flex flex-col items-center gap-2">
                        <h2 className={`text-xl font-bold ${player.IsTurn ? 'underline' : ''}`}>
                            {player.Name}
                        </h2>
                        <ScoreDisplay score={player.Points} />
                        <MiniHandDisplay count={player.Cards.length} />
                    </div>
                ))}
            </div>

            <div className="text-center text-xl">
                It is {currentPlayer?.Name}'s turn
            </div>

            {gameState.CurrentPlay && (
                <CardRow
                    cards={gameState.CurrentPlay.Cards}
                    label={`${gameState.CurrentPlay.PlayerName}'s Play`}
                    selectable={currentUserInfo?.IsTurn || false}
                    selectedCards={selectedPlayCard ? [selectedPlayCard] : []}
                    onCardClick={handlePlayCardClick}
                />
            )}

            {currentUserInfo?.IsTurn && (
                <div className="flex justify-center gap-4">
                    <button
                        className={`px-4 py-2 rounded ${canPlay ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
                        disabled={!canPlay}
                        onClick={() => onPlay(selectedHandCards)}
                    >
                        Play
                    </button>
                    <button
                        className={`px-4 py-2 rounded ${canScout ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
                        disabled={!canScout}
                        onClick={() => selectedPlayCard && onScout(selectedPlayCard)}
                    >
                        Scout
                    </button>
                </div>
            )}

            {currentUserInfo && (
                <CardRow
                    cards={currentUserInfo.Cards}
                    label="Your Hand"
                    selectable={currentUserInfo.IsTurn}
                    selectedCards={selectedHandCards}
                    onCardClick={handleHandCardClick}
                    overlap={true}
                />
            )}
        </div>
    );
};

export default GameInterface;