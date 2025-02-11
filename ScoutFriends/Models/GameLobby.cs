using ScoutFriends.Enums;

namespace ScoutFriends.Models
{
    public class GameLobby
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N")[..6].ToUpper(); // 6-character room code
        public required string HostConnectionId { get; set; }
        public GameState State { get; set; } = GameState.WaitingForPlayers;
        public List<Player> Players { get; set; } = new();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int MinPlayers { get; set; } = 3;
        public int MaxPlayers { get; set; } = 5;
        public List<Card> CurrentPlay { get; set; } = [];
    }
}