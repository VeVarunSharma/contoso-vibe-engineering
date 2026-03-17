using RigidPort.Tests.Helpers;
using RigidPort.Web.Models;
using RigidPort.Web.Services;

namespace RigidPort.Tests.Services;

public class ShipmentServiceTests
{
    [Fact]
    public async Task GetAllAsync_ReturnsAllShipments()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new ShipmentService(db);

        var result = await service.GetAllAsync();

        Assert.NotEmpty(result);
        Assert.Single(result);
    }

    [Fact]
    public async Task GetAllAsync_WithSearch_FiltersResults()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new ShipmentService(db);

        var result = await service.GetAllAsync(search: "TEST00001");
        Assert.Single(result);

        var empty = await service.GetAllAsync(search: "NONEXISTENT");
        Assert.Empty(empty);
    }

    [Fact]
    public async Task GetAllAsync_WithStatusFilter_FiltersResults()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new ShipmentService(db);

        var inTransit = await service.GetAllAsync(status: ShipmentStatus.InTransit);
        Assert.Single(inTransit);

        var delivered = await service.GetAllAsync(status: ShipmentStatus.Delivered);
        Assert.Empty(delivered);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsShipmentWithRelations()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new ShipmentService(db);

        var result = await service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("RP-TEST00001", result.TrackingNumber);
        Assert.NotNull(result.OriginPort);
        Assert.NotNull(result.DestinationPort);
        Assert.NotNull(result.Customer);
        Assert.Equal(3, result.TrackingEvents.Count);
    }

    [Fact]
    public async Task GetByIdAsync_InvalidId_ReturnsNull()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new ShipmentService(db);

        var result = await service.GetByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetByTrackingNumberAsync_ReturnsCorrectShipment()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new ShipmentService(db);

        var result = await service.GetByTrackingNumberAsync("RP-TEST00001");

        Assert.NotNull(result);
        Assert.Equal(ShipmentStatus.InTransit, result.Status);
    }

    [Fact]
    public async Task CreateAsync_AddsShipmentAndTrackingEvent()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new ShipmentService(db);

        var newShipment = new Shipment
        {
            OriginPortId = 1, DestinationPortId = 2, CustomerId = 1,
            WeightKg = 5000, Value = 10000m, CargoDescription = "New cargo"
        };

        var result = await service.CreateAsync(newShipment);

        Assert.NotNull(result.TrackingNumber);
        Assert.StartsWith("RP-", result.TrackingNumber);
        Assert.Equal(ShipmentStatus.Booked, result.Status);

        var allShipments = await service.GetAllAsync();
        Assert.Equal(2, allShipments.Count);
    }

    [Fact]
    public async Task UpdateStatusAsync_ChangesStatusAndAddsEvent()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new ShipmentService(db);

        await service.UpdateStatusAsync(1, ShipmentStatus.Delivered, "Final Destination", "Delivered!");

        var updated = await service.GetByIdAsync(1);
        Assert.NotNull(updated);
        Assert.Equal(ShipmentStatus.Delivered, updated.Status);
        Assert.NotNull(updated.ActualArrival);
        Assert.Equal(4, updated.TrackingEvents.Count);
    }

    [Fact]
    public async Task GetRecentAsync_ReturnsLimitedResults()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new ShipmentService(db);

        var result = await service.GetRecentAsync(5);

        Assert.Single(result);
    }
}
