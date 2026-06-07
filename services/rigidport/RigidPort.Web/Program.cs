using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using RigidPort.Web.Data;
using RigidPort.Web.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();

// Rate limiting — built-in ASP.NET Core rate limiter (.NET 7+). Fixed-window
// per-IP limiter that returns 429 with a Retry-After header.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var key = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 100,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0,
            AutoReplenishment = true,
        });
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=rigidport.db"));

builder.Services.AddScoped<ShipmentService>();
builder.Services.AddScoped<ContainerService>();
builder.Services.AddScoped<CustomerService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<TrackingService>();

var app = builder.Build();

// Auto-migrate and seed (skipped in Testing environment)
if (!app.Environment.IsEnvironment("Testing"))
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
        SeedData.Initialize(db);
    }
}

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
}

app.UseStaticFiles();
app.UseRouting();
app.UseRateLimiter();
app.UseAuthorization();

// Minimal API endpoints for AJAX
app.MapGet("/api/shipments/search", async (string? q, ShipmentService svc) =>
{
    var results = await svc.GetAllAsync(search: q);
    return Results.Ok(results.Select(s => new
    {
        s.Id, s.TrackingNumber, s.Status,
        Origin = s.OriginPort.Code,
        Destination = s.DestinationPort.Code,
        Customer = s.Customer.CompanyName,
        s.EstimatedArrival
    }));
});

app.MapGet("/api/dashboard/stats", async (DashboardService svc) =>
{
    return Results.Ok(new
    {
        Total = await svc.GetTotalShipmentsAsync(),
        InTransit = await svc.GetInTransitCountAsync(),
        DeliveredThisMonth = await svc.GetDeliveredThisMonthAsync(),
        TotalValue = await svc.GetTotalValueAsync(),
        OnTimeRate = await svc.GetOnTimeDeliveryRateAsync()
    });
});

app.MapGet("/api/tracking/{trackingNumber}", async (string trackingNumber, TrackingService svc) =>
{
    var shipment = await svc.TrackByNumberAsync(trackingNumber);
    if (shipment == null) return Results.NotFound();
    return Results.Ok(new
    {
        shipment.TrackingNumber, shipment.Status,
        Origin = shipment.OriginPort.Code,
        Destination = shipment.DestinationPort.Code,
        shipment.EstimatedArrival, shipment.ActualArrival,
        Events = shipment.TrackingEvents.Select(e => new
        {
            e.Status, e.Location, e.Description, e.Timestamp
        })
    });
});

app.MapRazorPages();
app.Run();

public partial class Program { }
