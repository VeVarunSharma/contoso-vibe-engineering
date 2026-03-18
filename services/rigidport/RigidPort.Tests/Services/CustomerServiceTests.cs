using RigidPort.Tests.Helpers;
using RigidPort.Web.Models;
using RigidPort.Web.Services;

namespace RigidPort.Tests.Services;

public class CustomerServiceTests
{
    [Fact]
    public async Task GetAllAsync_ReturnsAllCustomers()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new CustomerService(db);

        var result = await service.GetAllAsync();

        Assert.NotEmpty(result);
        Assert.Single(result);
    }

    [Fact]
    public async Task GetAllAsync_WithSearch_FiltersByCompanyName()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new CustomerService(db);

        var result = await service.GetAllAsync(search: "Test Corp");

        Assert.Single(result);
        Assert.Equal("Test Corp", result.First().CompanyName);
    }

    [Fact]
    public async Task GetAllAsync_WithSearch_FiltersByEmail()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new CustomerService(db);

        var result = await service.GetAllAsync(search: "john@test");

        Assert.Single(result);
    }

    [Fact]
    public async Task GetAllAsync_WithSearch_NoMatch_ReturnsEmpty()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new CustomerService(db);

        var result = await service.GetAllAsync(search: "NONEXISTENT_COMPANY");

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetByIdAsync_ValidId_ReturnsCustomerWithShipments()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new CustomerService(db);

        var result = await service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("Test Corp", result.CompanyName);
        Assert.NotEmpty(result.Shipments);
        Assert.NotNull(result.Shipments.First().OriginPort);
        Assert.NotNull(result.Shipments.First().DestinationPort);
    }

    [Fact]
    public async Task GetByIdAsync_InvalidId_ReturnsNull()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new CustomerService(db);

        var result = await service.GetByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_AddsCustomerAndSetsCreatedAt()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new CustomerService(db);

        var before = DateTime.UtcNow.AddSeconds(-1);
        var newCustomer = new Customer
        {
            CompanyName = "New Corp",
            ContactName = "Jane Smith",
            Email = "jane@newcorp.com"
        };

        var result = await service.CreateAsync(newCustomer);

        Assert.NotNull(result);
        Assert.Equal("New Corp", result.CompanyName);
        Assert.True(result.CreatedAt >= before);

        var all = await service.GetAllAsync();
        Assert.Equal(2, all.Count);
    }

    [Fact]
    public async Task UpdateAsync_PersistsChanges()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new CustomerService(db);

        var customer = await service.GetByIdAsync(1);
        Assert.NotNull(customer);

        customer.CompanyName = "Updated Corp";
        await service.UpdateAsync(customer);

        var updated = await service.GetByIdAsync(1);
        Assert.NotNull(updated);
        Assert.Equal("Updated Corp", updated.CompanyName);
    }
}
