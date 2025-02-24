using Microsoft.AspNetCore.SignalR;
using ScoutFriends.Enums;
using ScoutFriends.Models;

namespace ScoutFriends.Hubs
{
    public partial class GameHub : Hub
    {
        private Player? PrevPlayOwner;

        private bool CardsAreEqual(Card a, Card b, bool matchInvert = false)
        {
            if (!matchInvert) return a.Primary == b.Primary && a.Secondary == b.Secondary;
            else
            {
                return (
                    (a.Primary == b.Primary && a.Secondary == b.Secondary) ||
                    (a.Primary == b.Secondary && a.Secondary == b.Primary)
                );
            }
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
                    CardsAreEqual(handCard, firstSelectionCard)
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

        private bool IsEndGame(GameLobby lobby)
        {
            bool anyEmptyHand = lobby.Players.Any(p => p.Cards.Count == 0);
            bool currentPlayerOwnsPlay = lobby.Players.Find(
                p => p.Name == lobby.CurrentPlayOwner &&
                p.IsTurn
            ) != null;

            if (!anyEmptyHand && !currentPlayerOwnsPlay)
            {
                return false;
            }

            return true;
        }

        private async Task SendPlayerInfo(GameLobby lobby, string signalName)
        {
            var gameState = lobby.Players.Select(p => new PlayerGameState
            {
                Name = p.Name,
                IsTurn = p.IsTurn,
                Cards = p.Cards,
                Points = p.Points,
                Tokens = p.Tokens,
                IsTokenMode = p.IsTokenMode,
            }).ToList();
            await Clients.Group(lobby.Id).SendAsync(signalName, gameState);
        }

        private async Task EndGame(GameLobby lobby)
        {
            Player? emptyHandPlayer = lobby.Players.Find(p => p.Cards.Count == 0);
            bool currentPlayerOwnsPlay = lobby.Players.Find(
                p => p.Name == lobby.CurrentPlayOwner &&
                p.IsTurn
            ) != null;

            if (lobby.State != GameState.InProgress)
            {
                Console.WriteLine("Can not end a game that isn't in progress");
                return;
            }
            lobby.State = GameState.Compleated;
            foreach (Player player in lobby.Players)
            {
                if (player.Cards.Count > 0)
                {
                    bool isSet = player.Cards.All(c => c.Primary == player.Cards[0].Primary);
                    bool isAcending = isSet ? false : true;
                    bool isDecending = isSet ? false : true;
                    for (int i = 1; i < player.Cards.Count; i++)
                    {
                        if (player.Cards[i].Primary != player.Cards[i - 1].Primary + 1)
                        {
                            isAcending = false;
                        }
                        if (player.Cards[i].Primary != player.Cards[i - 1].Primary - 1)
                        {
                            isDecending = false;
                        }
                        if (!isAcending && !isDecending) break;
                    }
                    bool isRun = isAcending || isDecending;

                    if (!isSet && !isRun)
                    {
                        player.Points -= player.Cards.Count;
                    }
                }
            }

            if (emptyHandPlayer != null)
            {
                await Clients.Group(lobby.Id).SendAsync("GameLog", $"The game is over because {emptyHandPlayer.Name} has no cards left in their hand!");
            }
            else if (currentPlayerOwnsPlay)
            {
                await Clients.Group(lobby.Id).SendAsync("GameLog", $"The game is over because nobody beat {lobby.CurrentPlayOwner}'s play before their next turn!");
            }

            await SendPlayerInfo(lobby, "FinishGame");
            await Clients.Group(lobby.Id).SendAsync("GameMode", lobby.State);
        }

        private async void EndScoutTurn(GameLobby lobby, Player player)
        {
            player.IsTokenMode = false;

            // Turn moves to the next player after someone makes a play
            SetNextPlayer(lobby);

            // End the game if the owning player is the next turn
            bool gameEnd = IsEndGame(lobby);
            if (gameEnd)
            {
                await EndGame(lobby);
            }
            else
            {
                // Let the players know about the state of the game
                await SendPlayerInfo(lobby, "UpdateGameState");
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
            if (lobby.State != GameState.WaitingForPlayers)
            {
                Console.WriteLine("Can not start a game already in progress");
                await Clients.Caller.SendAsync("Error", "Game already in progress");
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
            // Give each player the appropriate number of tokens
            lobby.Players.ForEach(p => p.Tokens = lobby.SetupPlayerTokens);
            // Put together player state
            await SendPlayerInfo(lobby, "InitialGameState");
            await Clients.Group(lobbyId).SendAsync("GameMode", lobby.State);
            await Clients.Group(lobbyId).SendAsync("GameLog", "Setup a new game of Scout! Time for players to choose to invert their hands or not.");
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
            await SendPlayerInfo(lobby, "UpdateGameState");
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
            await Clients.Group(lobbyId).SendAsync("GameLog", $"{player.Name} has chosen their starting hand.");

            if (lobby.Players.All(p => p.Keep))
            {
                lobby.State = GameState.InProgress;
                await Clients.Group(lobbyId).SendAsync("GameMode", lobby.State);
                await Clients.Group(lobbyId).SendAsync("GameLog", "Ready, set, play!");
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
            if (lobby.State != GameState.InProgress)
            {
                Console.WriteLine("Can not play cards for a game that isn't in progress");
                await Clients.Caller.SendAsync("Error", "Can not play cards for a game that isn't in progress");
                return;
            }
            if (cards.Count == 0)
            {
                Console.WriteLine("Can not make a play with no cards");
                await Clients.Caller.SendAsync("PlayerError", "You can not play without any selected cards");
                return;
            }
            Player player = lobby.Players.First(p => p.ConnectionId == Context.ConnectionId);
            if (!player.IsTurn)
            {
                Console.WriteLine("Players can not make a play when it is not their turn");
                await Clients.Caller.SendAsync("PlayerError", "You can not play when it isn't your turn");
                return;
            }
            //Make sure selected cards are adjacent in the player's hand
            bool sequential = AreCardsSequential(player.Cards, cards);
            if (!sequential)
            {
                Console.WriteLine("Player can not play cards that are not adjacent in their hand");
                await Clients.Caller.SendAsync("PlayerError", "You can not play cards that aren't adjacent in your hand");
                return;
            }

            int count = cards.Count;
            int highestNumber = cards.Max(c => c.Primary);
            bool isSet = count > 1 ? cards.All(c => c.Primary == cards[0].Primary) : false;
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
            else if (prevCount == count)
            {
                if (isPrevSet && !isSet)
                {
                    Console.WriteLine("Play too weak: set is stronger");
                    await Clients.Caller.SendAsync("PlayerError", "You can not play a run with the same number of cards when the current play is a set");
                    return;
                }
                else if (isPrevSet == isSet && prevHighestNumber >= highestNumber)
                {
                    Console.WriteLine("Play too weak: max card value");
                    await Clients.Caller.SendAsync("PlayerError", "You can not make this play because your cards are of equal or lower value than the current play");
                    return;
                }
            }

            // Play is valid!
            // Set the play as the new current
            lobby.CurrentPlay = cards;
            lobby.CurrentPlayOwner = player.Name;

            // Remove the cards from the player's hand
            int startIndex = player.Cards.FindIndex(c => CardsAreEqual(c, cards[0]));
            player.Cards.RemoveRange(startIndex, cards.Count);

            // Give the current player a point for each card in the previous play
            player.Points += prevCount;

            // Turn moves to the next player after someone makes a play
            SetNextPlayer(lobby);

            if (prevCount > 0)
            {
                await Clients.Group(lobbyId).SendAsync("GameLog", $"{player.Name} has made a better play. They score {prevCount} points.");
            }
            else
            {
                await Clients.Group(lobby.Id).SendAsync("GameLog", $"{player.Name} has made a play.");
            }

            if (player.IsTokenMode)
            {
                player.Tokens -= 1;
                await Clients.Group(lobby.Id).SendAsync("GameLog", $"{player.Name} has scouted and palyed. They have {player.Tokens}  scout & play tokens remaining.");
            }

            // Check if the game is over (empty hand)
            bool gameEnd = IsEndGame(lobby);
            if (gameEnd)
            {
                await EndGame(lobby);
            }
            else
            {
                player.IsTokenMode = false;
                // Let the players know about the new play
                await SendPlayerInfo(lobby, "UpdateGameState");
                await Clients.Group(lobbyId).SendAsync("SetPlay", lobby.CurrentPlayOwner, lobby.CurrentPlay); // Inform about the play
            }
        }

        public async Task ScoutCard(string lobbyId, Card card, int insertIndex)
        {
            Console.WriteLine("Scout card {0}, {1}, {2}", lobbyId, card, insertIndex);
            if (!ActiveLobbies.TryGetValue(lobbyId, out var lobby))
            {
                Console.WriteLine("Lobby Not found");
                await Clients.Caller.SendAsync("PlayerError", "Lobby not found");
                return;
            }
            if (lobby.State != GameState.InProgress)
            {
                Console.WriteLine("Can not scout in a game that isn't in progress");
                await Clients.Caller.SendAsync("Error", "Can not scout in a game that isn't in progress");
                return;
            }
            Player player = lobby.Players.First(p => p.ConnectionId == Context.ConnectionId);
            if (!player.IsTurn)
            {
                Console.WriteLine("Players can not scout when it is not their turn");
                await Clients.Caller.SendAsync("PlayerError", "You can not scout when it is not your turn");
                return;
            }
            if (lobby.CurrentPlay.Count == 0)
            {
                Console.WriteLine("Players can not scout from an empty play");
                await Clients.Caller.SendAsync("PlayerError", "You can not scout without first selecting a card from the play");
                return;
            }
            if (insertIndex < 0 || insertIndex > player.Cards.Count)
            {
                Console.WriteLine("insertIndex out of bounds {0} {1}", player.Cards.Count, insertIndex);
                await Clients.Caller.SendAsync("PlayerError", "You somehow selected an invalid position in your hand");
                return;
            }

            // Verify card is from the edge of the existing play
            Card firstCard = lobby.CurrentPlay[0];
            Card lastCard = lobby.CurrentPlay.TakeLast(1).ToList()[0];
            bool isFirstCard = CardsAreEqual(firstCard, card, true);
            bool isLastCard = !isFirstCard && CardsAreEqual(lastCard, card, true);
            if (!isFirstCard && !isLastCard)
            {
                Console.WriteLine("Cards can only be scouted from the edge of the current play");
                await Clients.Caller.SendAsync("PlayerError", "You can only scout cards that are on the edge of the current play");
                return;
            }

            // Give the current play's owner a point
            PrevPlayOwner = lobby.Players.Find(p => p.Name == lobby.CurrentPlayOwner);
            if (PrevPlayOwner == null)
            {
                // Somehow we had a play with no owner. If this happens, try to fix the problem by removing the play completely and
                // letting the current play try to take their turn again. Not fair or in the rules of the game, but its best to try
                // to keep the game going in this situation.
                Console.WriteLine("Somehow we have a play without an owner");
                await Clients.Caller.SendAsync("PlayerError", "Play data got messed up in the server. Take a free turn.");
            }
            else
            {
                PrevPlayOwner.Points += 1;
            }

            // Add the card in the player's hand at the insertIndex
            player.Cards.Insert(insertIndex, card);

            // Remove the card from the current play
            if (isFirstCard)
            {
                lobby.CurrentPlay.RemoveAt(0);
            }
            else
            {
                // It should already be validated that the scout was either the first or last card of the play.
                // Since the card isn't the first one, remove the last card of the play.
                lobby.CurrentPlay.RemoveAt(lobby.CurrentPlay.Count - 1);
            }

            // If no cards are left in the play, remove ownership
            if (lobby.CurrentPlay.Count == 0)
            {
                lobby.CurrentPlayOwner = "";
            }

            await Clients.Group(lobby.Id).SendAsync("GameLog", $"{player.Name} has scouted a card. {PrevPlayOwner?.Name} scores a point.");

            Console.WriteLine("Setting the current play {0}", lobby.CurrentPlay.Count);
            await Clients.Group(lobby.Id).SendAsync("SetPlay", lobby.CurrentPlayOwner, lobby.CurrentPlay); // Inform about the new play state

            if (player.Tokens == 0)
            {
                EndScoutTurn(lobby, player);
            }
            else
            {
                player.IsTokenMode = true;
                await SendPlayerInfo(lobby, "UpdateGameState");
            }
        }

        public async Task EndTurn(string lobbyId)
        {
            Console.WriteLine("Ending turn {0}", lobbyId);
            if (!ActiveLobbies.TryGetValue(lobbyId, out var lobby))
            {
                Console.WriteLine("Lobby Not found");
                await Clients.Caller.SendAsync("PlayerError", "Lobby not found");
                return;
            }
            if (lobby.State != GameState.InProgress)
            {
                Console.WriteLine("Can not end a turn for a game that isn't in progress");
                await Clients.Caller.SendAsync("Error", "Can not end a turn for a game that isn't in progress");
                return;
            }
            Player player = lobby.Players.First(p => p.ConnectionId == Context.ConnectionId);
            if (!player.IsTokenMode)
            {
                Console.WriteLine("Can not end a turn that is not at an end turn decision point");
                await Clients.Caller.SendAsync("PlayerError", "Can not end a turn that is not at an end turn decision point");
                return;
            }
            EndScoutTurn(lobby, player);
        }
    }
}