import type { GameCard, ScoutMode } from '../types/Types';

type TurnControlsParameters = {
    scoutMode: ScoutMode;
    canPlay: boolean;
    onPlay: (cards: GameCard[]) => void;
    selectedHandCards: GameCard[];
    canScout: boolean;
    onScout: () => void;
    selectedPlayCard: GameCard | null;
    confirmScout: (reverse: boolean, insertionPoint: number) => void;
    cancelScoutMode: () => void;
    tokenMode: boolean;
    endTurn: () => void;
}

export const PlayerControls = ({
    scoutMode,
    canPlay,
    onPlay,
    selectedHandCards,
    canScout,
    onScout,
    selectedPlayCard,
    confirmScout,
    cancelScoutMode,
    tokenMode,
    endTurn,
}: TurnControlsParameters) => {
    return (
        <>
            {scoutMode && (
                <>
                    {!tokenMode && (
                        <div className="flex justify-center gap-4">
                            <button
                                className={`px-4 py-2 rounded ${selectedHandCards.length ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
                                disabled={selectedHandCards.length < 1}
                                onClick={() => {
                                    if (selectedHandCards.length === 1 && selectedHandCards[0].Primary === -1) {
                                        confirmScout(false, selectedHandCards[0].Secondary);
                                    }
                                }}
                            >
                                Scout as a {scoutMode.selectedCard.Primary}
                            </button>
                            <button
                                className={`px-4 py-2 rounded ${selectedHandCards.length ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
                                disabled={selectedHandCards.length < 1}
                                onClick={() => {
                                    if (selectedHandCards.length === 1 && selectedHandCards[0].Primary === -1) {
                                        confirmScout(true, selectedHandCards[0].Secondary);
                                    }
                                }}
                            >
                                Scout as a {scoutMode.selectedCard.Secondary}
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-red-500 text-white"
                                onClick={() => cancelScoutMode()}
                            >
                                Cancel Scout
                            </button>
                        </div>
                    )}
                </>
            )}

            {!scoutMode && (
                <>
                    {!tokenMode && (
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
                                onClick={() => selectedPlayCard && onScout()}
                            >
                                Scout
                            </button>
                        </div>
                    )}
                    {tokenMode && (
                        <div className="flex justify-center gap-4">
                            <button
                                className={`px-4 py-2 rounded ${selectedHandCards.length ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
                                disabled={selectedHandCards.length < 1}
                                onClick={() => onPlay(selectedHandCards)}
                            >
                                Play (Uses 1 Scout & Play token)
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-green-500 text-white"
                                onClick={() => endTurn()}
                            >
                                End Turn
                            </button>
                        </div>
                    )}
                </>
            )}

        </>
    )
};