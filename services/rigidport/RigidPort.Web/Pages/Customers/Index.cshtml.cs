using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RigidPort.Web.Models;
using RigidPort.Web.Services;

namespace RigidPort.Web.Pages.Customers;

public class IndexModel : PageModel
{
    private readonly CustomerService _customers;
    public IndexModel(CustomerService customers) => _customers = customers;

    public List<Customer> Customers { get; set; } = new();

    [BindProperty(SupportsGet = true)]
    public string? Search { get; set; }

    public async Task OnGetAsync()
    {
        Customers = await _customers.GetAllAsync(Search);
    }
}
