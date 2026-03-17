using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RigidPort.Web.Models;
using RigidPort.Web.Services;

namespace RigidPort.Web.Pages.Shipments;

public class IndexModel : PageModel
{
    private readonly ShipmentService _shipments;
    public IndexModel(ShipmentService shipments) => _shipments = shipments;

    public List<Shipment> Shipments { get; set; } = new();

    [BindProperty(SupportsGet = true)]
    public string? Search { get; set; }

    [BindProperty(SupportsGet = true)]
    public ShipmentStatus? StatusFilter { get; set; }

    [BindProperty(SupportsGet = true)]
    public string? SortBy { get; set; }

    public async Task OnGetAsync()
    {
        Shipments = await _shipments.GetAllAsync(Search, StatusFilter, SortBy);
    }
}
