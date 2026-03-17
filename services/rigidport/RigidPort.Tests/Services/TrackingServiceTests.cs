using RigidPort.Tests.Helpers;
using RigidPort.Web.Services;

namespace RigidPort.Tests.Services;

public class TrackingServiceTests
{
    [Fact]
    public async Task TrackByNumberAsync_ValidNumber_ReturnsShipment()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new TrackingService(db);

        var result = await service.TrackByNumberAsync("RP-TEST00001");

        Assert.NotNull(result);
        Assert.NotNull(result.OriginPort);
        Assert.NotNull(result.DestinationPort);
        Assert.Equal(3, result.TrackingEvents.Count);
    }

    [Fact]
    public async Task TrackByNumberAsync_InvalidNumber_ReturnsNull()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new TrackingService(db);

        var result = await service.TrackByNumberAsync("INVALID");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetEventsForShipmentAsync_ReturnsOrderedEvents()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new TrackingService(db);

        var result = await service.GetEventsForShipmentAsync(1);

        Assert.Equal(3, result.Count);
        Assert.True(result[0].Timestamp <= result[1].Timestamp);
    }
}
