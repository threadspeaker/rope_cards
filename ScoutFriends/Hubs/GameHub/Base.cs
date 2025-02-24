using Microsoft.AspNetCore.SignalR;
using ScoutFriends.Enums;
using ScoutFriends.Models;

namespace ScoutFriends.Hubs
{
    public partial class GameHub : Hub
    {
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // TODO: I might have a bug where the disconnecting context doesn't have a connection id?

            
            var lobby = ActiveLobbies.Values.FirstOrDefault(l =>
                l.Players.Any(p => p.ConnectionId == Context.ConnectionId));

            if (lobby != null)
            {
                // TODO: Handle disconnections differently if a game is in the lobby vs in progress

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