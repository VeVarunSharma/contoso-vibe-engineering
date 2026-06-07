using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace RigidPort.Web.Middleware;

public sealed class ApiKeyAuthMiddleware
{
    private const string ApiKeyHeaderName = "X-API-Key";
    private const string ApiKeySettingName = "ALLOWED_API_KEY";
    private const string DevelopmentApiKey = "dev-api-key-change-me";

    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;

    public ApiKeyAuthMiddleware(RequestDelegate next, IConfiguration configuration)
    {
        _next = next;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var requestPath = context.Request.Path.Value;
        if (requestPath is null || !requestPath.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        var expectedApiKey = _configuration[ApiKeySettingName];
        if (string.IsNullOrEmpty(expectedApiKey))
        {
            expectedApiKey = DevelopmentApiKey;
        }

        if (!context.Request.Headers.TryGetValue(ApiKeyHeaderName, out var providedApiKey)
            || string.IsNullOrEmpty(providedApiKey.ToString())
            || !ApiKeysMatch(providedApiKey.ToString(), expectedApiKey))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsync("Invalid or missing X-API-Key");
            return;
        }

        await _next(context);
    }

    private static bool ApiKeysMatch(string providedApiKey, string expectedApiKey)
    {
        var providedHash = SHA256.HashData(Encoding.UTF8.GetBytes(providedApiKey));
        var expectedHash = SHA256.HashData(Encoding.UTF8.GetBytes(expectedApiKey));

        return CryptographicOperations.FixedTimeEquals(providedHash, expectedHash);
    }
}
