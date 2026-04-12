using RigidPort.Tests.Helpers;
using RigidPort.Web.Models;
using RigidPort.Web.Services;

namespace RigidPort.Tests.Services;

public class ContainerServiceTests
{
    [Fact]
    public async Task GetAllAsync_ReturnsAllContainers()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new ContainerService(db);

        var result = await service.GetAllAsync();

        Assert.NotEmpty(result);
        Assert.Single(result);
    }

    [Fact]
    public async Task GetAllAsync_WithStatusFilter_ReturnsFiltered()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new ContainerService(db);

        var inUse = await service.GetAllAsync(status: ContainerStatus.InUse);
        Assert.Single(inUse);

        var available = await service.GetAllAsync(status: ContainerStatus.Available);
        Assert.Empty(available);
    }

    [Fact]
    public async Task GetAllAsync_WithTypeFilter_ReturnsFiltered()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new ContainerService(db);

        var standard40 = await service.GetAllAsync(type: ContainerType.Standard40ft);
        Assert.Single(standard40);

        var reefer = await service.GetAllAsync(type: ContainerType.Reefer);
        Assert.Empty(reefer);
    }

    [Fact]
    public async Task GetByIdAsync_ValidId_ReturnsContainerWithShipments()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new ContainerService(db);

        var result = await service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("RGPT0000001", result.ContainerNumber);
        Assert.NotEmpty(result.Shipments);
        Assert.NotNull(result.Shipments.First().OriginPort);
        Assert.NotNull(result.Shipments.First().DestinationPort);
        Assert.NotNull(result.Shipments.First().Customer);
    }

    [Fact]
    public async Task GetByIdAsync_InvalidId_ReturnsNull()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new ContainerService(db);

        var result = await service.GetByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetAvailableAsync_ReturnsOnlyAvailable()
    {
        using var db = TestDbHelper.CreateContext();
        var container = new RigidPort.Web.Models.Container
        {
            Id = 99, ContainerNumber = "RGPT9999999",
            Type = ContainerType.Standard20ft, Status = ContainerStatus.Available, MaxWeightKg = 20000
        };
        db.Containers.Add(container);
        await db.SaveChangesAsync();

        var service = new ContainerService(db);
        var result = await service.GetAvailableAsync();

        Assert.Single(result);
        Assert.Equal(ContainerStatus.Available, result.First().Status);
    }

    [Fact]
    public async Task GetStatusCountsAsync_ReturnsCorrectCounts()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new ContainerService(db);

        var counts = await service.GetStatusCountsAsync();

        Assert.True(counts.ContainsKey(ContainerStatus.InUse));
        Assert.Equal(1, counts[ContainerStatus.InUse]);
    }
}
