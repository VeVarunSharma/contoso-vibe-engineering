using Microsoft.EntityFrameworkCore;
using RigidPort.Web.Data;
using RigidPort.Web.Models;

namespace RigidPort.Web.Services;

public class DashboardService
{
    private readonly AppDbContext _db;
    public DashboardService(AppDbContext db) => _db = db;

    public async Task<int> GetTotalShipmentsAsync() => await _db.Shipments.CountAsync();

    public async Task<int> GetInTransitCountAsync() =>
        await _db.Shipments.CountAsync(s => s.Status == ShipmentStatus.InTransit);

    public async Task<int> GetDeliveredThisMonthAsync()
    {
        var firstOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        return await _db.Shipments.CountAsync(s =>
            s.Status == ShipmentStatus.Delivered && s.ActualArrival >= firstOfMonth);
    }

    public async Task<decimal> GetTotalValueAsync() =>
        await _db.Shipments.SumAsync(s => s.Value);

    public async Task<Dictionary<ShipmentStatus, int>> GetStatusDistributionAsync()
    {
        var shipments = await _db.Shipments.ToListAsync();
        return shipments.GroupBy(s => s.Status)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    public async Task<Dictionary<string, int>> GetMonthlyVolumeAsync()
    {
        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
        var data = await _db.Shipments
            .Where(s => s.CreatedAt >= sixMonthsAgo)
            .GroupBy(s => new { s.CreatedAt.Year, s.CreatedAt.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() })
            .OrderBy(g => g.Year).ThenBy(g => g.Month)
            .ToListAsync();

        return data.ToDictionary(
            d => $"{d.Year}-{d.Month:D2}",
            d => d.Count);
    }

    public async Task<double> GetOnTimeDeliveryRateAsync()
    {
        var delivered = await _db.Shipments
            .Where(s => s.Status == ShipmentStatus.Delivered && s.EstimatedArrival != null && s.ActualArrival != null)
            .ToListAsync();

        if (!delivered.Any()) return 100;

        var onTime = delivered.Count(s => s.ActualArrival <= s.EstimatedArrival);
        return Math.Round((double)onTime / delivered.Count * 100, 1);
    }

    public async Task<List<TrackingEvent>> GetRecentActivityAsync(int count = 15) =>
        await _db.TrackingEvents
            .Include(t => t.Shipment)
            .OrderByDescending(t => t.Timestamp)
            .Take(count)
            .ToListAsync();
}
