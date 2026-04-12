using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RigidPort.Web.Models;
using RigidPort.Web.Services;

namespace RigidPort.Web.Pages.Customers;

public class CreateModel : PageModel
{
    private readonly CustomerService _customers;
    public CreateModel(CustomerService customers) => _customers = customers;

    [BindProperty]
    public Customer Customer { get; set; } = new();

    public void OnGet() { }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!ModelState.IsValid) return Page();
        await _customers.CreateAsync(Customer);
        return RedirectToPage("Details", new { id = Customer.Id });
    }
}
