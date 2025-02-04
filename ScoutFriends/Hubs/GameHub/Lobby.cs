using System.Diagnostics;
using Microsoft.AspNetCore.SignalR;
using ScoutFriends.Enums;
using ScoutFriends.Models;

namespace ScoutFriends.Hubs
{
    public partial class GameHub : Hub
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

            if (lobby.Players.Any(p => p.Name.ToLower() == playerName.ToLower()))
            {
                await Clients.Caller.SendAsync("Error", "The player name is already in use for this lobby.");
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
    }
}