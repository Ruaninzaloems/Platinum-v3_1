using Microsoft.EntityFrameworkCore;

namespace PlatinumAFS.Api.Data;

public class PlatinumDbContext : DbContext
{
    public PlatinumDbContext(DbContextOptions<PlatinumDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
    }
}
