using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RigidPort.Web.Data;

namespace RigidPort.Tests.Helpers;

/// <summary>
/// Configures a test web application using a SQLite in-memory connection
/// so the same EF Core provider is used as in production (no provider conflict).
/// The SqliteConnection singleton is disposed automatically by the DI container.
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ALLOWED_API_KEY", "test-key");

        builder.ConfigureServices(services =>
        {
            // Remove the file-based SQLite DbContext registration
            var dbDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (dbDescriptor != null)
                services.Remove(dbDescriptor);

            // Register a shared open SQLite in-memory connection
            // (must stay open for the schema to persist across scopes)
            services.AddSingleton<SqliteConnection>(_ =>
            {
                var conn = new SqliteConnection("DataSource=:memory:");
                conn.Open();
                return conn;
            });

            // Use the in-memory connection with the same SQLite provider
            services.AddDbContext<AppDbContext>((sp, options) =>
                options.UseSqlite(sp.GetRequiredService<SqliteConnection>()));

            services
                .AddAuthentication(TestAuthHandler.AuthenticationScheme)
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.AuthenticationScheme, _ => { });
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        // Seed data after the host is built (startup seeding is skipped in Testing env)
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
        SeedData.Initialize(db);

        return host;
    }
}

public sealed class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string AuthenticationScheme = "Test";

    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "test-admin"),
            new Claim(ClaimTypes.Role, "Admin"),
        };
        var identity = new ClaimsIdentity(claims, AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, AuthenticationScheme);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
