using Microsoft.AspNetCore.Mvc.RazorPages;
using RigidPort.Web.Models;
using RigidPort.Web.Services;

namespace RigidPort.Web.Pages;

public class IndexModel : PageModel
{
    private readonly DashboardService _dashboard;
    private readonly ShipmentService _shipments;

    public IndexModel(DashboardService dashboard, ShipmentService shipments)
    {
        _dashboard = dashboard;
        _shipments = shipments;
    }

    public int TotalShipments { get; set; }
    public int InTransitCount { get; set; }
    public int DeliveredThisMonth { get; set; }
    public decimal TotalValue { get; set; }
    public double OnTimeRate { get; set; }
    public Dictionary<ShipmentStatus, int> StatusDistribution { get; set; } = new();
    public Dictionary<string, int> MonthlyVolume { get; set; } = new();
    public List<Shipment> RecentShipments { get; set; } = new();
    public List<TrackingEvent> RecentActivity { get; set; } = new();

    public async Task OnGetAsync()
    {
        TotalShipments = await _dashboard.GetTotalShipmentsAsync();
        InTransitCount = await _dashboard.GetInTransitCountAsync();
        DeliveredThisMonth = await _dashboard.GetDeliveredThisMonthAsync();
        TotalValue = await _dashboard.GetTotalValueAsync();
        OnTimeRate = await _dashboard.GetOnTimeDeliveryRateAsync();
        StatusDistribution = await _dashboard.GetStatusDistributionAsync();
        MonthlyVolume = await _dashboard.GetMonthlyVolumeAsync();
        RecentShipments = await _shipments.GetRecentAsync(8);
        RecentActivity = await _dashboard.GetRecentActivityAsync(10);
    }
}
