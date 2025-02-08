import React from 'react';
import GameCard from './Card';
import { GameCard as Card } from '../types/Types';

type CardRowProps = {
    cards: Card[];
    label?: string;
    selectable?: boolean;
    selectedCards?: Card[];
    onCardClick?: (card: Card) => void;
    overlap?: boolean;
};

export const CardRow = ({
    cards,
    label,
    selectable = false,
    selectedCards = [],
    onCardClick,
    overlap = false
}: CardRowProps) => {
    const cardWidth = 128;
    const overlapOffset = overlap ? cardWidth * 0.7 : cardWidth + 16;
    const totalWidth = Math.max(cardWidth, cards.length * overlapOffset - (overlap ? overlapOffset * 0.3 : 16));

    return (
        <div className="w-full flex flex-col items-center gap-2">
            {label && <div className="text-lg font-semibold">{label}</div>}
            <div
                className="relative h-48 flex items-center"
                style={{ width: `${totalWidth}px` }}
            >
                {cards.map((card, index) => {
                    const isSelected = selectedCards.some(
                        selectedCard =>
                            selectedCard.Primary === card.Primary &&
                            selectedCard.Secondary === card.Secondary
                    );

                    return (
                        <div
                            key={`${card.Primary}-${card.Secondary}`}
                            className={`absolute transition-transform ${selectable ? 'cursor-pointer hover:translate-y-[-8px]' : ''} 
                                ${isSelected ? 'translate-y-[-8px]' : ''}`}
                            style={{ left: `${index * overlapOffset}px` }}
                            onClick={() => onCardClick?.(card)}
                        >
                            <GameCard
                                primaryValue={card.Primary}
                                secondaryValue={card.Secondary}
                                isSelected={isSelected}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};