using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RigidPort.Web.Models;
using RigidPort.Web.Services;

namespace RigidPort.Web.Pages.Containers;

public class DetailsModel : PageModel
{
    private readonly ContainerService _containers;
    public DetailsModel(ContainerService containers) => _containers = containers;

    public Container Container { get; set; } = null!;

    public async Task<IActionResult> OnGetAsync(int id)
    {
        var container = await _containers.GetByIdAsync(id);
        if (container == null) return NotFound();
        Container = container;
        return Page();
    }
}
