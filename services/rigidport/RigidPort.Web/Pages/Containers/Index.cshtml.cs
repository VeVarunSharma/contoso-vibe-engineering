using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RigidPort.Web.Models;
using RigidPort.Web.Services;

namespace RigidPort.Web.Pages.Containers;

public class IndexModel : PageModel
{
    private readonly ContainerService _containers;
    public IndexModel(ContainerService containers) => _containers = containers;

    public List<Container> Containers { get; set; } = new();
    public Dictionary<ContainerStatus, int> StatusCounts { get; set; } = new();

    [BindProperty(SupportsGet = true)]
    public ContainerStatus? StatusFilter { get; set; }

    public async Task OnGetAsync()
    {
        Containers = await _containers.GetAllAsync(StatusFilter);
        StatusCounts = await _containers.GetStatusCountsAsync();
    }
}
