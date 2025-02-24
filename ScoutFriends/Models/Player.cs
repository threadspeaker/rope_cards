namespace ScoutFriends.Models
{
    public class Player
    {
        public required string ConnectionId { get; set; }
        public required string Name { get; set; }
        public bool IsHost { get; set; }
        public List<Card> Cards { get; set; } = [];
        public int Points { get; set; } = 0;
        public bool IsTurn { get; set; } = false;
        public bool Keep { get; set; } = false;
        public int Tokens { get; set; } = 1;
        public bool IsTokenMode { get; set; } = false;
    }

    // DTO
    public class PlayerGameState
    {
        public required string Name { get; set; }
        public required bool IsTurn { get; set; }
        public required int Points { get; set; }
        public required List<Card> Cards { get; set; }
        public int Tokens { get; set; } = 1;
        public bool IsTokenMode { get; set; } = false;
    }
}