using Microsoft.AspNetCore.SignalR;
using ScoutFriends.Enums;
using ScoutFriends.Models;

namespace ScoutFriends.Hubs
{
    public class GameHub : Hub
    {
        private static readonly Dictionary<string, GameLobby> ActiveLobbies = new();

        public async Task CreateLobby(string playerName)
        {
            var lobby = new GameLobby
            {
                HostConnectionId = Context.ConnectionId
            };

            var player = new Player
            {
                ConnectionId = Context.ConnectionId,
                Name = playerName,
                IsHost = true
            };

            lobby.Players.Add(player);
            ActiveLobbies[lobby.Id] = lobby;

            await Groups.AddToGroupAsync(Context.ConnectionId, lobby.Id);
            await Clients.Group(lobby.Id).SendAsync("LobbyCreated", lobby.Id, player.Name);
        }

        public async Task StartGame(string lobbyId)
        {
            if (!ActiveLobbies.TryGetValue(lobbyId, out var lobby))
            {
                await Clients.Caller.SendAsync("Error", "Lobby not found");
                return;
            }

            // Verify the caller is the host
            if (Context.ConnectionId != lobby.HostConnectionId)
            {
                await Clients.Caller.SendAsync("Error", "Only the host can start the game");
                return;
            }

            // Verify minimum number of players (you can adjust this)
            if (lobby.Players.Count < 2)
            {
                await Clients.Caller.SendAsync("Error", "Need at least 2 players to start");
                return;
            }

            lobby.State = GameState.InProgress;
            await Clients.Group(lobby.Id).SendAsync("GameStarted");
        }

        public async Task<bool> JoinLobby(string lobbyId, string playerName)
        {
            if (!ActiveLobbies.TryGetValue(lobbyId, out var lobby))
            {
                await Clients.Caller.SendAsync("Error", "Lobby not found");
                return false;
            }

            if (lobby.State != GameState.WaitingForPlayers)
            {
                await Clients.Caller.SendAsync("Error", "Game already in progress");
                return false;
            }

            if (lobby.Players.Count >= lobby.MaxPlayers)
            {
                await Clients.Caller.SendAsync("Error", "Lobby is full");
                return false;
            }

            var player = new Player
            {
                ConnectionId = Context.ConnectionId,
                Name = playerName,
                IsHost = false
            };

            lobby.Players.Add(player);
            await Groups.AddToGroupAsync(Context.ConnectionId, lobby.Id);

            // Send the existing player list to the new player
            foreach (var existingPlayer in lobby.Players.Where(p => p.ConnectionId != Context.ConnectionId))
            {
                await Clients.Caller.SendAsync("PlayerJoined", existingPlayer.Name, existingPlayer.IsHost);
            }

            // Notify all players in the lobby about the new player
            await Clients.Group(lobby.Id).SendAsync("PlayerJoined", player.Name, player.IsHost);
            return true;
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var lobby = ActiveLobbies.Values.FirstOrDefault(l =>
                l.Players.Any(p => p.ConnectionId == Context.ConnectionId));

            if (lobby != null)
            {
                var player = lobby.Players.First(p => p.ConnectionId == Context.ConnectionId);
                lobby.Players.Remove(player);

                if (player.IsHost)
                {
                    // If host leaves, assign new host or close lobby
                    if (lobby.Players.Any())
                    {
                        var newHost = lobby.Players.First();
                        newHost.IsHost = true;
                        lobby.HostConnectionId = newHost.ConnectionId;
                        await Clients.Group(lobby.Id).SendAsync("NewHost", newHost.Name);
                    }
                    else
                    {
                        ActiveLobbies.Remove(lobby.Id);
                    }
                }

                await Clients.Group(lobby.Id).SendAsync("PlayerLeft", player.Name);
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}