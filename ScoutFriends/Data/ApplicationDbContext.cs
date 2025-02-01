using ScoutFriends.Models;
using Microsoft.EntityFrameworkCore;

namespace ScoutFriends.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Player> Users { get; set; }
    }
}