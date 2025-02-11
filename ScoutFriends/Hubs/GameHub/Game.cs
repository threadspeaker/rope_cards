using Microsoft.AspNetCore.SignalR;
using ScoutFriends.Enums;
using ScoutFriends.Models;

namespace ScoutFriends.Hubs
{
    public partial class GameHub : Hub
    {
        private List<Player> ShufflePlayers(GameLobby lobby)
        {
            List<Player> shuffledPlayers = lobby.Players.OrderBy(x => Guid.NewGuid()).ToList();
            return shuffledPlayers;
        }

        private void DealCards(GameLobby lobby)
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

            // Flag players as needing to decide to flip or keep
            foreach (Player player in lobby.Players)
            {
                player.Keep = false;
            }
        }

        private bool AreCardsSequential(List<Card> handCards, List<Card> selection)
        {
            if (selection.Count == 0 || handCards.Count < selection.Count)
                return false;

            int startIndex = -1;
            Card firstSelectionCard = selection[0];
            for (int i = 0; i <= handCards.Count - selection.Count; i++)
            {
                Card handCard = handCards[i];

                if (
                    handCard.Primary == firstSelectionCard.Primary &&
                    handCard.Secondary == firstSelectionCard.Secondary
                )
                {
                    startIndex = i;
                    break;
                }
            }
            if (startIndex == -1) return false;
            for (int i = 1; i < selection.Count; i++)
            {
                Card handCard = handCards[i + startIndex];
                Card selectionCard = selection[i];
                if (
                    handCard.Primary != selectionCard.Primary ||
                    handCard.Secondary != selectionCard.Secondary
                )
                {
                    return false;
                }
            }

            return true;
        }

        private void SetNextPlayer(GameLobby lobby)
        {
            int currentPlayerIndex = lobby.Players.FindIndex(p => p.IsTurn);
            if (currentPlayerIndex == -1) return;

            int nextPlayerIndex = currentPlayerIndex + 1;
            if (nextPlayerIndex >= lobby.Players.Count)
            {
                nextPlayerIndex = 0;
            }
            lobby.Players[currentPlayerIndex].IsTurn = false;
            lobby.Players[nextPlayerIndex].IsTurn = true;
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
            lobby.State = GameState.Setup;
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
            await Clients.Group(lobbyId).SendAsync("GameMode", lobby.State);
        }

        public async Task FlipPlayerHand(string lobbyId)
        {
            Console.WriteLine("Flip player hand in lobby: {0}, Player: {1}", lobbyId, Context.ConnectionId);
            if (!ActiveLobbies.TryGetValue(lobbyId, out var lobby))
            {
                Console.WriteLine("Lobby Not found");
                return;
            }
            if (lobby.State != GameState.Setup)
            {
                Console.WriteLine("Can not flip a hand after setup");
                return;
            }
            Player player = lobby.Players.First(p => p.ConnectionId == Context.ConnectionId);
            if (player.Keep)
            {
                Console.WriteLine("Can not flip for a player who already has kept");
                return;
            }

            List<Card> newHand = [];
            foreach (Card card in player.Cards)
            {
                newHand.Add(new Card { Primary = card.Secondary, Secondary = card.Primary });
            }
            player.Cards = newHand;
            var gameState = lobby.Players.Select(p => new PlayerGameState
            {
                Name = p.Name,
                IsTurn = p.IsTurn,
                Cards = p.Cards,
                Points = p.Points
            }).ToList();
            await Clients.Group(lobbyId).SendAsync("UpdateGameState", gameState);
        }

        public async Task KeepPlayerHand(string lobbyId)
        {
            Console.WriteLine("Keep player hand in lobby: {0}, Player: {1}", lobbyId, Context.ConnectionId);
            if (!ActiveLobbies.TryGetValue(lobbyId, out var lobby))
            {
                Console.WriteLine("Lobby Not found");
                return;
            }
            if (lobby.State != GameState.Setup)
            {
                Console.WriteLine("Can not keep a hand after setup");
                return;
            }
            Player player = lobby.Players.First(p => p.ConnectionId == Context.ConnectionId);
            if (player.Keep)
            {
                Console.WriteLine("Can not keep for a player who already has kept");
                return;
            }

            player.Keep = true;

            if (lobby.Players.All(p => p.Keep))
            {
                lobby.State = GameState.InProgress;
                await Clients.Group(lobbyId).SendAsync("GameMode", lobby.State);
            }
        }

        public async Task PlayCards(string lobbyId, List<Card> cards)
        {
            Console.WriteLine("Play cards {0}, {1}", lobbyId, cards);
            if (!ActiveLobbies.TryGetValue(lobbyId, out var lobby))
            {
                Console.WriteLine("Lobby Not found");
                await Clients.Caller.SendAsync("PlayerError", "Lobby not found");
                return;
            }
            if (cards.Count == 0)
            {
                Console.WriteLine("Can not make a play with no cards");
                return;
            }
            Player player = lobby.Players.First(p => p.ConnectionId == Context.ConnectionId);
            if (!player.IsTurn)
            {
                Console.WriteLine("Players can not make a play when it is not their turn");
                return;
            }
            //Make sure selected cards are adjacent in the player's hand
            bool sequential = AreCardsSequential(player.Cards, cards);
            if (!sequential)
            {
                Console.WriteLine("Player can not play cards that are not adjacent in their hand");
                return;
            }

            int count = cards.Count;
            int highestNumber = cards.Max(c => c.Primary);
            bool isSet = cards.All(c => c.Primary == cards[0].Primary);
            bool isAcending = isSet ? false : true;
            bool isDecending = isSet ? false : true;
            for (int i = 1; i < cards.Count; i++)
            {
                if (cards[i].Primary != cards[i - 1].Primary + 1)
                {
                    isAcending = false;
                }
                if (cards[i].Primary != cards[i - 1].Primary - 1)
                {
                    isDecending = false;
                }
                if (!isAcending && !isDecending) break;
            }
            bool isRun = isAcending || isDecending;
            if (!isSet && !isRun)
            {
                Console.WriteLine("Invalid Play. Must play a set or run");
                return;
            }

            // Check if play is stronger than current play.
            int prevCount = lobby.CurrentPlay.Count;
            bool isPrevSet = prevCount > 1 ? lobby.CurrentPlay.All(c => c.Primary == lobby.CurrentPlay[0].Primary) : false;
            int prevHighestNumber = prevCount > 0 ? lobby.CurrentPlay.Max(c => c.Primary) : -1;
            if (prevCount > count)
            {
                Console.WriteLine("Play too weak: Card count");
                await Clients.Caller.SendAsync("PlayerError", "You can not make a play with fewer cards than the current play");
                return;
            }
            else if (prevCount == count) {
                if (isPrevSet && !isSet)
                {
                    Console.WriteLine("Play too weak: set is stronger");
                    await Clients.Caller.SendAsync("PlayerError", "You can not play a run when the current play is a set");
                    return;
                }
                if (prevHighestNumber >= highestNumber)
                {
                    Console.WriteLine("Play too weak: max card value");
                    await Clients.Caller.SendAsync("PlayerError", "You can make a play with cards of lower value than the current play");
                    return;
                }
            }

            // Play is valid!
            // Set the play as the new current
            lobby.CurrentPlay = cards;

            // Remove the cards from the player's hand
            int startIndex = player.Cards.FindIndex(c => c.Primary == cards[0].Primary && c.Secondary == cards[0].Secondary);
            player.Cards.RemoveRange(startIndex, cards.Count);

            // TODO: Check if the game is over (empty hand)

            // Turn moves to the next player after someone makes a play
            SetNextPlayer(lobby);

            // Let the players know about the new play
            var gameState = lobby.Players.Select(p => new PlayerGameState
            {
                Name = p.Name,
                IsTurn = p.IsTurn,
                Cards = p.Cards,
                Points = p.Points
            }).ToList();
            await Clients.Group(lobbyId).SendAsync("UpdateGameState", gameState); // Inform about the change in hand size
            await Clients.Group(lobbyId).SendAsync("SetPlay", player.Name, cards); // Inform about the play
        }
    }
}