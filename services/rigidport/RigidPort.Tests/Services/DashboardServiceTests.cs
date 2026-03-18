using RigidPort.Tests.Helpers;
using RigidPort.Web.Models;
using RigidPort.Web.Services;

namespace RigidPort.Tests.Services;

public class DashboardServiceTests
{
    [Fact]
    public async Task GetTotalShipmentsAsync_ReturnsCount()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new DashboardService(db);

        var result = await service.GetTotalShipmentsAsync();

        Assert.Equal(1, result);
    }

    [Fact]
    public async Task GetInTransitCountAsync_ReturnsCorrectCount()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new DashboardService(db);

        var result = await service.GetInTransitCountAsync();

        Assert.Equal(1, result);
    }

    [Fact]
    public async Task GetStatusDistributionAsync_ReturnsDistribution()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new DashboardService(db);

        var result = await service.GetStatusDistributionAsync();

        Assert.Contains(ShipmentStatus.InTransit, result.Keys);
        Assert.Equal(1, result[ShipmentStatus.InTransit]);
    }

    [Fact]
    public async Task GetTotalValueAsync_ReturnsSumOfValues()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new DashboardService(db);

        var result = await service.GetTotalValueAsync();

        Assert.Equal(50000m, result);
    }

    [Fact]
    public async Task GetRecentActivityAsync_ReturnsEvents()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new DashboardService(db);

        var result = await service.GetRecentActivityAsync(10);

        Assert.Equal(3, result.Count);
        Assert.True(result[0].Timestamp >= result[1].Timestamp);
    }

    [Fact]
    public async Task GetTotalShipmentsAsync_EmptyDb_ReturnsZero()
    {
        using var db = TestDbHelper.CreateContext();
        db.Shipments.RemoveRange(db.Shipments);
        db.TrackingEvents.RemoveRange(db.TrackingEvents);
        await db.SaveChangesAsync();

        var service = new DashboardService(db);
        var result = await service.GetTotalShipmentsAsync();

        Assert.Equal(0, result);
    }

    [Fact]
    public async Task GetOnTimeDeliveryRateAsync_NoDeliveredShipments_Returns100()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new DashboardService(db);

        // No delivered shipments in seed data — service returns 100 when none delivered
        var result = await service.GetOnTimeDeliveryRateAsync();

        Assert.Equal(100, result);
    }
}
