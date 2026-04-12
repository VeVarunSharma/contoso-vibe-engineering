using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RigidPort.Web.Models;
using RigidPort.Web.Services;

namespace RigidPort.Web.Pages.Tracking;

public class IndexModel : PageModel
{
    private readonly TrackingService _tracking;
    public IndexModel(TrackingService tracking) => _tracking = tracking;

    [BindProperty(SupportsGet = true)]
    public string? TrackingNumber { get; set; }

    public Shipment? Shipment { get; set; }
    public bool Searched { get; set; }

    public async Task OnGetAsync()
    {
        if (!string.IsNullOrWhiteSpace(TrackingNumber))
        {
            Searched = true;
            Shipment = await _tracking.TrackByNumberAsync(TrackingNumber.Trim());
        }
    }
}
