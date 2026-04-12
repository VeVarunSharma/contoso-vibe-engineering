using Microsoft.EntityFrameworkCore;
using RigidPort.Web.Data;
using RigidPort.Web.Models;

namespace RigidPort.Web.Services;

public class ShipmentService
{
    private readonly AppDbContext _db;
    public ShipmentService(AppDbContext db) => _db = db;

    public async Task<List<Shipment>> GetAllAsync(string? search = null, ShipmentStatus? status = null, string? sortBy = null, bool descending = false)
    {
        var query = _db.Shipments
            .Include(s => s.OriginPort)
            .Include(s => s.DestinationPort)
            .Include(s => s.Customer)
            .Include(s => s.Container)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(s =>
                s.TrackingNumber.ToLower().Contains(search) ||
                s.CargoDescription!.ToLower().Contains(search) ||
                s.Customer.CompanyName.ToLower().Contains(search) ||
                s.OriginPort.Name.ToLower().Contains(search) ||
                s.DestinationPort.Name.ToLower().Contains(search));
        }

        if (status.HasValue)
            query = query.Where(s => s.Status == status.Value);

        query = sortBy?.ToLower() switch
        {
            "tracking" => descending ? query.OrderByDescending(s => s.TrackingNumber) : query.OrderBy(s => s.TrackingNumber),
            "status" => descending ? query.OrderByDescending(s => s.Status) : query.OrderBy(s => s.Status),
            "eta" => descending ? query.OrderByDescending(s => s.EstimatedArrival) : query.OrderBy(s => s.EstimatedArrival),
            "value" => descending ? query.OrderByDescending(s => s.Value) : query.OrderBy(s => s.Value),
            "created" => descending ? query.OrderByDescending(s => s.CreatedAt) : query.OrderBy(s => s.CreatedAt),
            _ => query.OrderByDescending(s => s.UpdatedAt)
        };

        return await query.ToListAsync();
    }

    public async Task<Shipment?> GetByIdAsync(int id) =>
        await _db.Shipments
            .Include(s => s.OriginPort)
            .Include(s => s.DestinationPort)
            .Include(s => s.Customer)
            .Include(s => s.Container)
            .Include(s => s.TrackingEvents.OrderBy(t => t.Timestamp))
            .FirstOrDefaultAsync(s => s.Id == id);

    public async Task<Shipment?> GetByTrackingNumberAsync(string trackingNumber) =>
        await _db.Shipments
            .Include(s => s.OriginPort)
            .Include(s => s.DestinationPort)
            .Include(s => s.Customer)
            .Include(s => s.TrackingEvents.OrderBy(t => t.Timestamp))
            .FirstOrDefaultAsync(s => s.TrackingNumber == trackingNumber);

    public async Task<Shipment> CreateAsync(Shipment shipment)
    {
        shipment.TrackingNumber = await GenerateTrackingNumber();
        shipment.CreatedAt = DateTime.UtcNow;
        shipment.UpdatedAt = DateTime.UtcNow;
        _db.Shipments.Add(shipment);

        _db.TrackingEvents.Add(new TrackingEvent
        {
            Shipment = shipment,
            Status = ShipmentStatus.Booked,
            Location = "System",
            Description = "Shipment booked and confirmed",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return shipment;
    }

    public async Task UpdateAsync(Shipment shipment)
    {
        shipment.UpdatedAt = DateTime.UtcNow;
        _db.Shipments.Update(shipment);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateStatusAsync(int id, ShipmentStatus newStatus, string location, string description)
    {
        var shipment = await _db.Shipments.FindAsync(id);
        if (shipment == null) return;

        shipment.Status = newStatus;
        shipment.UpdatedAt = DateTime.UtcNow;
        if (newStatus == ShipmentStatus.Delivered)
            shipment.ActualArrival = DateTime.UtcNow;

        _db.TrackingEvents.Add(new TrackingEvent
        {
            ShipmentId = id,
            Status = newStatus,
            Location = location,
            Description = description,
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
    }

    public async Task<List<Shipment>> GetRecentAsync(int count = 10) =>
        await _db.Shipments
            .Include(s => s.OriginPort)
            .Include(s => s.DestinationPort)
            .Include(s => s.Customer)
            .OrderByDescending(s => s.UpdatedAt)
            .Take(count)
            .ToListAsync();

    private async Task<string> GenerateTrackingNumber()
    {
        var count = await _db.Shipments.CountAsync();
        return $"RP-{DateTime.UtcNow:yyyy}{count + 1:D5}";
    }
}
