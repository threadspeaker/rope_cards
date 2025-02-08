export type ScoutMode = {
    selectedCard: GameCard;
} | null;

export type GameCard = {
    isInsertion?: boolean;
    Primary: number;
    Secondary: number;
};

export type PlayerInfo = {
    Name: string;
    IsTurn: boolean;
    Cards: GameCard[];
    Points: number;
};

export type GameState = {
    Players: PlayerInfo[];
    CurrentPlay?: {
        PlayerName: string;
        Cards: GameCard[];
    };
};

export const parseGameState = (serverState: any): GameState => {
    return {
        Players: serverState.players.map((player: any) => ({
            Name: player.name,
            IsTurn: player.isTurn,
            Cards: player.cards.map((card: any) => ({
                Primary: card.primary,
                Secondary: card.secondary
            })),
            Points: player.points
        })),
        CurrentPlay: serverState.currentPlay ? {
            PlayerName: serverState.currentPlay.playerName,
            Cards: serverState.currentPlay.cards.map((card: any) => ({
                Primary: card.primary,
                Secondary: card.secondary
            }))
        } : undefined
    };
}