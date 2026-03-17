using Microsoft.EntityFrameworkCore;
using RigidPort.Web.Data;
using RigidPort.Web.Models;

namespace RigidPort.Web.Services;

public class CustomerService
{
    private readonly AppDbContext _db;
    public CustomerService(AppDbContext db) => _db = db;

    public async Task<List<Customer>> GetAllAsync(string? search = null)
    {
        var query = _db.Customers.Include(c => c.Shipments).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(c =>
                c.CompanyName.ToLower().Contains(search) ||
                c.ContactName.ToLower().Contains(search) ||
                c.Email.ToLower().Contains(search));
        }
        return await query.OrderBy(c => c.CompanyName).ToListAsync();
    }

    public async Task<Customer?> GetByIdAsync(int id) =>
        await _db.Customers
            .Include(c => c.Shipments)
                .ThenInclude(s => s.OriginPort)
            .Include(c => c.Shipments)
                .ThenInclude(s => s.DestinationPort)
            .FirstOrDefaultAsync(c => c.Id == id);

    public async Task<Customer> CreateAsync(Customer customer)
    {
        customer.CreatedAt = DateTime.UtcNow;
        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();
        return customer;
    }

    public async Task UpdateAsync(Customer customer)
    {
        _db.Customers.Update(customer);
        await _db.SaveChangesAsync();
    }
}
