using System.Net;
using System.Text.Json;
using RigidPort.Tests.Helpers;

namespace RigidPort.Tests.Integration;

public class ShipmentApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ShipmentApiTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GET_ShipmentsSearch_ReturnsOkWithResults()
    {
        var response = await _client.GetAsync("/api/shipments/search");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.True(doc.RootElement.GetArrayLength() > 0);
    }

    [Fact]
    public async Task GET_ShipmentsSearch_WithQuery_FiltersResults()
    {
        // SeedData.Initialize uses tracking number format RP-{2026}{i:D5}
        var response = await _client.GetAsync("/api/shipments/search?q=RP-202600001");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        Assert.Equal(1, doc.RootElement.GetArrayLength());

        var item = doc.RootElement[0];
        Assert.Equal("RP-202600001", item.GetProperty("trackingNumber").GetString());
    }

    [Fact]
    public async Task GET_ShipmentsSearch_NoMatch_ReturnsEmptyArray()
    {
        var response = await _client.GetAsync("/api/shipments/search?q=NONEXISTENT_XYZ_99999");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        Assert.Equal(0, doc.RootElement.GetArrayLength());
    }
}
