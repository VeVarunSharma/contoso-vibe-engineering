using Microsoft.EntityFrameworkCore;
using RigidPort.Web.Data;
using RigidPort.Web.Models;

namespace RigidPort.Web.Services;

public class ContainerService
{
    private readonly AppDbContext _db;
    public ContainerService(AppDbContext db) => _db = db;

    public async Task<List<Container>> GetAllAsync(ContainerStatus? status = null, ContainerType? type = null)
    {
        var query = _db.Containers.Include(c => c.Shipments).AsQueryable();
        if (status.HasValue) query = query.Where(c => c.Status == status.Value);
        if (type.HasValue) query = query.Where(c => c.Type == type.Value);
        return await query.OrderBy(c => c.ContainerNumber).ToListAsync();
    }

    public async Task<Container?> GetByIdAsync(int id) =>
        await _db.Containers
            .Include(c => c.Shipments)
                .ThenInclude(s => s.OriginPort)
            .Include(c => c.Shipments)
                .ThenInclude(s => s.DestinationPort)
            .Include(c => c.Shipments)
                .ThenInclude(s => s.Customer)
            .FirstOrDefaultAsync(c => c.Id == id);

    public async Task<List<Container>> GetAvailableAsync() =>
        await _db.Containers.Where(c => c.Status == ContainerStatus.Available)
            .OrderBy(c => c.ContainerNumber).ToListAsync();

    public async Task<Dictionary<ContainerStatus, int>> GetStatusCountsAsync() =>
        await _db.Containers.GroupBy(c => c.Status)
            .ToDictionaryAsync(g => g.Key, g => g.Count());
}
