using System.Net;
using System.Text.Json;
using RigidPort.Tests.Helpers;

namespace RigidPort.Tests.Integration;

public class TrackingApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public TrackingApiTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GET_Tracking_ValidNumber_ReturnsOkWithShipment()
    {
        // SeedData.Initialize uses tracking number format RP-{2026}{i:D5}
        var response = await _client.GetAsync("/api/tracking/RP-202600001");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        Assert.Equal("RP-202600001", doc.RootElement.GetProperty("trackingNumber").GetString());
    }

    [Fact]
    public async Task GET_Tracking_InvalidNumber_Returns404()
    {
        var response = await _client.GetAsync("/api/tracking/INVALID_TRACKING_XYZ");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GET_Tracking_ResponseIncludesEvents()
    {
        var response = await _client.GetAsync("/api/tracking/RP-202600001");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        var events = doc.RootElement.GetProperty("events");
        Assert.Equal(JsonValueKind.Array, events.ValueKind);
        Assert.True(events.GetArrayLength() > 0);
    }
}
