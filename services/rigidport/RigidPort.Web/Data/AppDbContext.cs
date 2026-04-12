using Microsoft.EntityFrameworkCore;
using RigidPort.Web.Models;

namespace RigidPort.Web.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<Container> Containers => Set<Container>();
    public DbSet<Port> Ports => Set<Port>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<TrackingEvent> TrackingEvents => Set<TrackingEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Shipment>(entity =>
        {
            entity.HasIndex(s => s.TrackingNumber).IsUnique();
            entity.HasOne(s => s.OriginPort)
                  .WithMany(p => p.OriginShipments)
                  .HasForeignKey(s => s.OriginPortId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(s => s.DestinationPort)
                  .WithMany(p => p.DestinationShipments)
                  .HasForeignKey(s => s.DestinationPortId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(s => s.Customer)
                  .WithMany(c => c.Shipments)
                  .HasForeignKey(s => s.CustomerId);
            entity.HasOne(s => s.Container)
                  .WithMany(c => c.Shipments)
                  .HasForeignKey(s => s.ContainerId)
                  .OnDelete(DeleteBehavior.SetNull);
            entity.Property(s => s.Value).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<TrackingEvent>(entity =>
        {
            entity.HasOne(t => t.Shipment)
                  .WithMany(s => s.TrackingEvents)
                  .HasForeignKey(t => t.ShipmentId);
            entity.HasIndex(t => t.ShipmentId);
        });

        modelBuilder.Entity<Port>(entity =>
        {
            entity.HasIndex(p => p.Code).IsUnique();
        });

        modelBuilder.Entity<Container>(entity =>
        {
            entity.HasIndex(c => c.ContainerNumber).IsUnique();
        });
    }
}
