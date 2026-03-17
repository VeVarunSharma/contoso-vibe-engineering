using System.Net;
using System.Text.Json;
using RigidPort.Tests.Helpers;

namespace RigidPort.Tests.Integration;

public class DashboardApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public DashboardApiTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GET_DashboardStats_ReturnsOkWithAllFields()
    {
        var response = await _client.GetAsync("/api/dashboard/stats");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("total", out _));
        Assert.True(root.TryGetProperty("inTransit", out _));
        Assert.True(root.TryGetProperty("deliveredThisMonth", out _));
        Assert.True(root.TryGetProperty("totalValue", out _));
        Assert.True(root.TryGetProperty("onTimeRate", out _));
    }
}
