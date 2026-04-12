using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using RigidPort.Web.Data;
using RigidPort.Web.Models;
using RigidPort.Web.Services;

namespace RigidPort.Web.Pages.Shipments;

public class CreateModel : PageModel
{
    private readonly ShipmentService _shipments;
    private readonly AppDbContext _db;

    public CreateModel(ShipmentService shipments, AppDbContext db)
    {
        _shipments = shipments;
        _db = db;
    }

    [BindProperty]
    public Shipment Shipment { get; set; } = new();

    public SelectList Ports { get; set; } = null!;
    public SelectList Customers { get; set; } = null!;
    public SelectList Containers { get; set; } = null!;

    public async Task OnGetAsync()
    {
        await LoadSelectLists();
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

        await _shipments.CreateAsync(Shipment);
        return RedirectToPage("Details", new { id = Shipment.Id });
    }

    private async Task LoadSelectLists()
    {
        var ports = await _db.Ports.OrderBy(p => p.Name).ToListAsync();
        Ports = new SelectList(ports, "Id", "Name");
        var customers = await _db.Customers.OrderBy(c => c.CompanyName).ToListAsync();
        Customers = new SelectList(customers, "Id", "CompanyName");
        var containers = await _db.Containers.Where(c => c.Status == ContainerStatus.Available).OrderBy(c => c.ContainerNumber).ToListAsync();
        Containers = new SelectList(containers, "Id", "ContainerNumber");
    }
}
