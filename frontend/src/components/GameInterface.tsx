import React, { useState } from 'react';
import { CardRow } from './CardRow';
import { MiniHandDisplay, ScoreDisplay } from './PlayerInfo';
import type { GameState, GameCard, ScoutMode } from '../types/Types';
import { PlayerControls } from './PlayerControls';
import { SetupControls } from './SetupControls';
import { useGame } from './GameContext';

type GameInterfaceProps = {
    gameState: GameState;
    currentUserName: string;
    onPlay: (cards: GameCard[]) => void;
    onScout: (card: GameCard, insertionPoint: number) => void;
    onFlip: () => void;
    onKeep: () => void;
};

const GameInterface: React.FC<GameInterfaceProps> = ({
    gameState,
    currentUserName,
    onPlay,
    onScout,
    onFlip,
    onKeep
}) => {
    const { gameMode } = useGame();
    const [selectedHandCards, setSelectedHandCards] = useState<GameCard[]>([]);
    const [selectedPlayCard, setSelectedPlayCard] = useState<GameCard | null>(null);
    const [scoutMode, setScoutMode] = useState<ScoutMode>(null);
    const [keepMode, setKeepMode] = useState<boolean>(false);

    // Don't try rendering stuff if we don't have a proper game state yet
    if (!gameState?.Players) {
        return <div>Invalid game state</div>;
    }
    const currentPlayer = gameState.Players.find(p => p.IsTurn);
    const currentUserInfo = gameState.Players.find(p => p.Name === currentUserName);

    const handleKeepClick = () => {
        setKeepMode(true);
        onKeep();
    };

    // When scout button is clicked:
    const handleScoutClick = () => {
        if (selectedPlayCard) {
            setScoutMode({
                selectedCard: selectedPlayCard,
            });
            setSelectedPlayCard(null);
        }
    };

    const confirmPlay = (cards: GameCard[]) => {
        setSelectedHandCards(prev => []);
        onPlay(cards);
    };

    const confirmScout = (reverse: boolean, insertionPoint: number) => {
        if (!scoutMode) return;
        let resultCard = scoutMode.selectedCard;
        if (reverse) {
            resultCard = {
                Primary: resultCard.Secondary,
                Secondary: resultCard.Primary
            }
        }
        setSelectedPlayCard(null);
        onScout(resultCard, insertionPoint);
    };

    const cancelScoutMode = () => {
        setScoutMode(null);
        setSelectedHandCards(_ => []);
        setSelectedPlayCard(_ => null);
    };

    const userHandDisplayCards = (): GameCard[] => {
        if (!currentUserInfo) return [];
        if (!scoutMode) return currentUserInfo.Cards;

        let handCards = currentUserInfo.Cards;

        const result: (GameCard & { isInsertionPoint?: boolean })[] = [];
        // Add insertion point before first card
        result.push({ Primary: -1, Secondary: 0, isInsertion: true });

        handCards.forEach((card, index) => {
            result.push(card);
            // Add insertion point after each card
            // Set Secondary to the insertion point's index, for later reference
            result.push({ Primary: -1, Secondary: (index + 1), isInsertion: true });
        });

        return result
    };

    const handlePlayCardClick = (card: GameCard) => {
        if (scoutMode) return;
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

        if (scoutMode) {
            if (card.Primary !== -1) return;
            setSelectedHandCards(prev => {
                const selectedIndex = prev.findIndex(c =>
                    c.Primary === card.Primary && c.Secondary === card.Secondary
                );
                if (selectedIndex !== -1) {
                    // Card was already selected; So deselect it.
                    // Only one selection allowed during scout mode
                    // so deselect means nothing is selected.
                    return [];
                }
                return [card];
            });
        }
        else {
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
        }
    };

    const canPlay = selectedHandCards.length > 0;
    const canScout = selectedPlayCard !== null && selectedHandCards.length === 0;

    return (
        <div className="w-full max-w-screen-2xl mx-auto p-4 flex flex-col gap-8">
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

            {gameMode === 2 && (
                <div className="text-center text-xl">
                    It is {currentPlayer?.Name}'s turn
                </div>
            )}

            {gameState.CurrentPlay && gameMode === 2 && (
                <CardRow
                    cards={gameState.CurrentPlay.Cards}
                    label={`${gameState.CurrentPlay.PlayerName}'s Play`}
                    selectable={currentUserInfo?.IsTurn || false}
                    selectedCards={selectedPlayCard ? [selectedPlayCard] : []}
                    onCardClick={handlePlayCardClick}
                />
            )}

            {gameMode === 1 && (
                <SetupControls
                    onFlip={onFlip}
                    onKeep={handleKeepClick}
                    keepMode={keepMode}
                />
            )}

            {currentUserInfo?.IsTurn && gameMode === 2 && (
                <PlayerControls
                    scoutMode={scoutMode}
                    canPlay={canPlay}
                    onPlay={confirmPlay}
                    selectedHandCards={selectedHandCards}
                    canScout={canScout}
                    onScout={handleScoutClick}
                    selectedPlayCard={selectedPlayCard}
                    confirmScout={confirmScout}
                    cancelScoutMode={cancelScoutMode}
                />
            )}

            {currentUserInfo && (
                <CardRow
                    cards={userHandDisplayCards()}
                    label="Your Hand"
                    selectable={currentUserInfo.IsTurn}
                    selectedCards={selectedHandCards}
                    onCardClick={handleHandCardClick}
                />
            )}
        </div>
    );
};

export default GameInterface;