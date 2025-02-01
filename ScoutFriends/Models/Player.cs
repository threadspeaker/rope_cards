namespace ScoutFriends.Models
{
    public class Player
    {
        public required string ConnectionId { get; set; }
        public required string Name { get; set; }
        public bool IsHost { get; set; }
    }
}