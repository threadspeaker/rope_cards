using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScoutFriends.Models;
using ScoutFriends.Data;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuthController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public async Task<ActionResult<Player>> Login(LoginRequest request)
    {
        Console.WriteLine("Got a request!");
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Name == request.Username);

        if (user == null)
        {
            // Create new user if they don't exist
            user = new Player { ConnectionId = "1", Name = request.Username };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        return Ok(user);
    }
}

public class LoginRequest
{
    public required string Username { get; set; }
}