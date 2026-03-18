using Microsoft.EntityFrameworkCore;
using RigidPort.Web.Data;
using RigidPort.Web.Models;

namespace RigidPort.Tests.Helpers;

public static class TestDbHelper
{
    public static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var context = new AppDbContext(options);
        SeedTestData(context);
        return context;
    }

    private static void SeedTestData(AppDbContext context)
    {
        var port1 = new Port { Id = 1, Name = "Port of Los Angeles", Code = "USLAX", City = "Los Angeles", Country = "US", Latitude = 33.74, Longitude = -118.27 };
        var port2 = new Port { Id = 2, Name = "Port of Shanghai", Code = "CNSHA", City = "Shanghai", Country = "China", Latitude = 31.36, Longitude = 121.62 };
        context.Ports.AddRange(port1, port2);

        var customer = new Customer { Id = 1, CompanyName = "Test Corp", ContactName = "John Doe", Email = "john@test.com" };
        context.Customers.Add(customer);

        var container = new Container { Id = 1, ContainerNumber = "RGPT0000001", Type = ContainerType.Standard40ft, Status = ContainerStatus.InUse, MaxWeightKg = 30480 };
        context.Containers.Add(container);

        var shipment = new Shipment
        {
            Id = 1, TrackingNumber = "RP-TEST00001", OriginPortId = 1, DestinationPortId = 2,
            CustomerId = 1, ContainerId = 1, Status = ShipmentStatus.InTransit,
            WeightKg = 15000, CargoDescription = "Test cargo", Value = 50000m,
            EstimatedArrival = DateTime.UtcNow.AddDays(14), CreatedAt = DateTime.UtcNow
        };
        context.Shipments.Add(shipment);

        context.TrackingEvents.AddRange(
            new TrackingEvent { Id = 1, ShipmentId = 1, Status = ShipmentStatus.Booked, Location = "System", Description = "Booked", Timestamp = DateTime.UtcNow.AddDays(-5) },
            new TrackingEvent { Id = 2, ShipmentId = 1, Status = ShipmentStatus.PickedUp, Location = "Los Angeles", Description = "Picked up", Timestamp = DateTime.UtcNow.AddDays(-3) },
            new TrackingEvent { Id = 3, ShipmentId = 1, Status = ShipmentStatus.InTransit, Location = "At Sea", Description = "In transit", Timestamp = DateTime.UtcNow.AddDays(-1) }
        );

        context.SaveChanges();
    }
}
