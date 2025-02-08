import React, { useEffect, useRef, useState } from 'react';
import GameCard from './Card';
import { GameCard as Card } from '../types/Types';

type CardRowProps = {
    cards: Card[];
    label?: string;
    selectable?: boolean;
    selectedCards?: Card[];
    onCardClick?: (card: Card) => void;
};

export const CardRow = ({
    cards,
    label,
    selectable = false,
    selectedCards = [],
    onCardClick
}: CardRowProps) => {
    const cardWidth = 128; // Width of a single card
    const cardGap = 16; // Desired gap between cards when not overlapping;
    const minOverlapOffset = cardWidth * 0.20; // Maximum amount cards can overlap (80% overlap, just enough to still see card number in corner)
    const containerRef = useRef<HTMLDivElement>(null);
    const [overlapOffset, setOverlapOffset] = useState(cardWidth + cardGap);

    useEffect(() => {
        const calculateOverlap = () => {
            if (!containerRef.current) return;

            const containerWidth = containerRef.current.clientWidth;
            const totalCardsWidth = cards.length * cardWidth;
            const totalGapsWidth = (cards.length - 1) * cardGap;

            // If cards fit without overlap, use full spacing
            if (totalCardsWidth + totalGapsWidth <= containerWidth) {
                setOverlapOffset(cardWidth + cardGap);
                return;
            }

            // Otherwise, calculate required overlap
            // Available space for gaps = container width - width of first and last card fully shown
            const availableSpace = containerWidth - cardWidth;
            // Each card after the first needs at least minOverlapOffset space
            const requiredOffset = availableSpace / (cards.length - 1);

            // Use maximum of minimum overlap and calculated required overlap
            setOverlapOffset(Math.max(minOverlapOffset, requiredOffset));
        };

        calculateOverlap();
        window.addEventListener('resize', calculateOverlap);
        return () => window.removeEventListener('resize', calculateOverlap);
    }, [cards.length, minOverlapOffset]);

    // Calculate total width based on number of cards and overlap
    const totalWidth = Math.min(
        cards.length * cardWidth - (cards.length - 1) * (cardWidth - overlapOffset),
        containerRef.current?.clientWidth ?? Infinity
    );

    return (
        <div className="w-full px-8 flex flex-col items-center gap-2">
            {label && <div className="text-lg font-semibold">{label}</div>}
            <div
                ref={containerRef}
                className="w-full" // Container takes full width
            >
                <div
                    className="relative h-48 flex items-center mx-auto"
                    style={{
                        width: `${totalWidth}px`,
                        maxWidth: '100%'
                    }}
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
                                    isInsertion={card.isInsertion}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};