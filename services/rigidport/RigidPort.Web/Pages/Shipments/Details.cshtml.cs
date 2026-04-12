using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RigidPort.Web.Models;
using RigidPort.Web.Services;

namespace RigidPort.Web.Pages.Shipments;

public class DetailsModel : PageModel
{
    private readonly ShipmentService _shipments;
    public DetailsModel(ShipmentService shipments) => _shipments = shipments;

    public Shipment Shipment { get; set; } = null!;

    public async Task<IActionResult> OnGetAsync(int id)
    {
        var shipment = await _shipments.GetByIdAsync(id);
        if (shipment == null) return NotFound();
        Shipment = shipment;
        return Page();
    }
}
