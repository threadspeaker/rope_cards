using Microsoft.AspNetCore.SignalR;
using ScoutFriends.Enums;
using ScoutFriends.Models;

namespace ScoutFriends.Hubs
{
    public partial class GameHub : Hub
    {
        public List<Player> ShufflePlayers(GameLobby lobby)
        {
            List<Player> shuffledPlayers = lobby.Players.OrderBy(x => Guid.NewGuid()).ToList();
            return shuffledPlayers;
        }

        public void DealCards(GameLobby lobby)
        {
            List<Card> Deck = [];
            Deck.Clear();
            var random = new Random();

            for (int i = 1; i <= 10; i++)
            {
                for (int j = i + 1; j <= 10; j++)
                {
                    // Skip cards with matching numbers (already handled by j starting at i+1)
                    // 50-50 chance of swapping i and j
                    var (first, second) = random.Next(2) == 0 ? (i, j) : (j, i);
                    Deck.Add(new Card { Primary = first, Secondary = second });
                }
            }

            // Remove specific cards based on player count
            int playerCount = lobby.Players.Count;
            if (playerCount == 4)
            {
                Deck.RemoveAll(c => (c.Primary == 9 && c.Secondary == 10) || (c.Primary == 10 && c.Secondary == 9));
            }
            else if (playerCount == 3)
            {
                Deck.RemoveAll(c => c.Primary == 10 || c.Secondary == 10);
            }

            // Shuffle
            Deck = Deck.OrderBy(x => Guid.NewGuid()).ToList();

            // Deal cards to players
            int cardsPerPlayer = Deck.Count / playerCount;
            for (int i = 0; i < playerCount; i++)
            {
                lobby.Players[i].Cards = Deck.Skip(i * cardsPerPlayer).Take(cardsPerPlayer).ToList();
            }
        }

        public async Task StartGame(string lobbyId)
        {
            Console.WriteLine("Start Game: {0}", lobbyId);
            if (!ActiveLobbies.TryGetValue(lobbyId, out var lobby))
            {
                Console.WriteLine("Lobby Not found");
                await Clients.Caller.SendAsync("Error", "Lobby not found");
                return;
            }

            // Verify the caller is the host
            if (Context.ConnectionId != lobby.HostConnectionId)
            {
                Console.WriteLine("Only the host can start the game");
                await Clients.Caller.SendAsync("Error", "Only the host can start the game");
                return;
            }

            // Verify minimum number of players (you can adjust this)
            if (lobby.Players.Count < lobby.MinPlayers)
            {
                Console.WriteLine("Not enough players to start ");
                await Clients.Caller.SendAsync("Error", $"Need at least {lobby.MinPlayers} players to start");
                return;
            }

            // Notify client to start the game
            lobby.State = GameState.InProgress;
            await Clients.Group(lobbyId).SendAsync("GameStarted");

            // Setup and notify clients of player state
            // Randomize turn order
            lobby.Players = lobby.Players.OrderBy(x => Guid.NewGuid()).ToList();
            // Setup and deal cards
            DealCards(lobby);
            // Set first player
            lobby.Players[0].IsTurn = true;
            // Put together player state
            var gameState = lobby.Players.Select(p => new PlayerGameState
            {
                Name = p.Name,
                IsTurn = p.IsTurn,
                Cards = p.Cards,
                Points = p.Points
            }).ToList();
            await Clients.Group(lobbyId).SendAsync("InitialGameState", gameState);
        }
    }
}