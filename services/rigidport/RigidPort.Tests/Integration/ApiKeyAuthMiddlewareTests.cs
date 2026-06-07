using System.Net;
using RigidPort.Tests.Helpers;

namespace RigidPort.Tests.Integration;

public class ApiKeyAuthMiddlewareTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public ApiKeyAuthMiddlewareTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GET_ApiWithoutKey_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/dashboard/stats");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("Invalid or missing X-API-Key", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task GET_ApiWithInvalidKey_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-API-Key", "wrong-key");

        var response = await client.GetAsync("/api/dashboard/stats");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("Invalid or missing X-API-Key", await response.Content.ReadAsStringAsync());
    }
}
