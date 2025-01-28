using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace RopeCards.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }
        
        // You'll add your DbSet properties here later
        // public DbSet<YourModel> YourModels { get; set; }
        public DbSet<Todo> Todos { get; set; }
    }
}