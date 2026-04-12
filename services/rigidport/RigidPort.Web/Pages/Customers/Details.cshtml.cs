using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RigidPort.Web.Models;
using RigidPort.Web.Services;

namespace RigidPort.Web.Pages.Customers;

public class DetailsModel : PageModel
{
    private readonly CustomerService _customers;
    public DetailsModel(CustomerService customers) => _customers = customers;

    public Customer Customer { get; set; } = null!;

    public async Task<IActionResult> OnGetAsync(int id)
    {
        var customer = await _customers.GetByIdAsync(id);
        if (customer == null) return NotFound();
        Customer = customer;
        return Page();
    }
}
