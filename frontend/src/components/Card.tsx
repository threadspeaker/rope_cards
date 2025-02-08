import React from 'react';

type GameCardProps = {
    primaryValue: number;
    secondaryValue: number;
    isSelected: boolean;
};

type ColorMap = {
    [key: number]: string;
};

const GameCard: React.FC<GameCardProps> = ({
    primaryValue,
    secondaryValue,
    isSelected = false
}) => {
    const getBackgroundColor = (value: number): string => {
        const colors: ColorMap = {
            1: 'bg-red-500',
            2: 'bg-red-600',
            3: 'bg-orange-500',
            4: 'bg-orange-600',
            5: 'bg-yellow-500',
            6: 'bg-green-500',
            7: 'bg-blue-500',
            8: 'bg-blue-600',
            9: 'bg-purple-500',
            10: 'bg-purple-600'
        };
        return colors[value] || 'bg-gray-500';
    };

    return (
        <div className={`
            relative w-32 h-48 rounded-xl border-2
            flex flex-col items-center justify-center
            transition-all duration-200
            ${getBackgroundColor(primaryValue)}
            ${isSelected ? 'border-yellow-300 shadow-[0_0_15px_5px_rgba(253,224,71,0.8)]' : 'border-black'}
        `}>
            {/* Corner numbers - top left */}
            <div className="absolute top-2 left-2 text-white font-bold">
                <div className="text-lg leading-none">{primaryValue}</div>
                <div className="text-sm leading-none">{secondaryValue}</div>
            </div>

            {/* Corner numbers - top right */}
            <div className="absolute top-2 right-2 text-white font-bold">
                <div className="text-lg leading-none">{primaryValue}</div>
                <div className="text-sm leading-none">{secondaryValue}</div>
            </div>

            {/* Center circle with numbers */}
            <div className="absolute w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center">
                <span className="text-5xl font-bold">{primaryValue}</span>
                <span className="text-2xl mt-1">{secondaryValue}</span>
            </div>
        </div>
    );
};

export default GameCard;
