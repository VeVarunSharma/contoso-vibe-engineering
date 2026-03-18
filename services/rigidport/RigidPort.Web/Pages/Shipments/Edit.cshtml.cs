using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using RigidPort.Web.Data;
using RigidPort.Web.Models;
using RigidPort.Web.Services;

namespace RigidPort.Web.Pages.Shipments;

public class EditModel : PageModel
{
    private readonly ShipmentService _shipments;
    private readonly AppDbContext _db;

    public EditModel(ShipmentService shipments, AppDbContext db)
    {
        _shipments = shipments;
        _db = db;
    }

    [BindProperty]
    public Shipment Shipment { get; set; } = null!;

    public SelectList Ports { get; set; } = null!;
    public SelectList Customers { get; set; } = null!;
    public SelectList Containers { get; set; } = null!;
    public SelectList Statuses { get; set; } = null!;

    public async Task<IActionResult> OnGetAsync(int id)
    {
        var shipment = await _shipments.GetByIdAsync(id);
        if (shipment == null) return NotFound();
        Shipment = shipment;
        await LoadSelectLists();
        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        ModelState.Remove("Shipment.TrackingNumber");
        ModelState.Remove("Shipment.OriginPort");
        ModelState.Remove("Shipment.DestinationPort");
        ModelState.Remove("Shipment.Customer");
        if (!ModelState.IsValid)
        {
            await LoadSelectLists();
            return Page();
        }

        var existing = await _db.Shipments.FindAsync(Shipment.Id);
        if (existing == null) return NotFound();

        existing.OriginPortId = Shipment.OriginPortId;
        existing.DestinationPortId = Shipment.DestinationPortId;
        existing.CustomerId = Shipment.CustomerId;
        existing.ContainerId = Shipment.ContainerId;
        existing.Status = Shipment.Status;
        existing.WeightKg = Shipment.WeightKg;
        existing.CargoDescription = Shipment.CargoDescription;
        existing.Value = Shipment.Value;
        existing.EstimatedArrival = Shipment.EstimatedArrival;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return RedirectToPage("Details", new { id = Shipment.Id });
    }

    private async Task LoadSelectLists()
    {
        var ports = await _db.Ports.OrderBy(p => p.Name).ToListAsync();
        Ports = new SelectList(ports, "Id", "Name");
        var customers = await _db.Customers.OrderBy(c => c.CompanyName).ToListAsync();
        Customers = new SelectList(customers, "Id", "CompanyName");
        var containers = await _db.Containers.OrderBy(c => c.ContainerNumber).ToListAsync();
        Containers = new SelectList(containers, "Id", "ContainerNumber");
        Statuses = new SelectList(Enum.GetValues<ShipmentStatus>());
    }
}
