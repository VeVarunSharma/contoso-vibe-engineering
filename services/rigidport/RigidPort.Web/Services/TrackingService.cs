using Microsoft.EntityFrameworkCore;
using RigidPort.Web.Data;
using RigidPort.Web.Models;

namespace RigidPort.Web.Services;

public class TrackingService
{
    private readonly AppDbContext _db;
    public TrackingService(AppDbContext db) => _db = db;

    public async Task<Shipment?> TrackByNumberAsync(string trackingNumber) =>
        await _db.Shipments
            .Include(s => s.OriginPort)
            .Include(s => s.DestinationPort)
            .Include(s => s.TrackingEvents.OrderBy(t => t.Timestamp))
            .FirstOrDefaultAsync(s => s.TrackingNumber == trackingNumber);

    public async Task<List<TrackingEvent>> GetEventsForShipmentAsync(int shipmentId) =>
        await _db.TrackingEvents
            .Where(t => t.ShipmentId == shipmentId)
            .OrderBy(t => t.Timestamp)
            .ToListAsync();
}
