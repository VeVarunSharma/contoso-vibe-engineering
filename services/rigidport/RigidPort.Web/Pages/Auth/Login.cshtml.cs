using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;

namespace RigidPort.Web.Pages.Auth;

public class LoginModel : PageModel
{
    private const string AdminUsername = "admin";
    private const string AdminPasswordSettingName = "RIGIDPORT_ADMIN_PASSWORD";
    private const string DevelopmentAdminPassword = "admin";

    private readonly IConfiguration _configuration;

    public LoginModel(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [BindProperty]
    public LoginInput Input { get; set; } = new();

    public string? ReturnUrl { get; private set; }

    public void OnGet(string? returnUrl = null)
    {
        ReturnUrl = returnUrl;
    }

    public async Task<IActionResult> OnPostAsync(string? returnUrl = null)
    {
        ReturnUrl = returnUrl;

        if (!ModelState.IsValid)
        {
            return Page();
        }

        var expectedPassword = _configuration[AdminPasswordSettingName];
        if (string.IsNullOrEmpty(expectedPassword))
        {
            expectedPassword = DevelopmentAdminPassword;
        }

        if (!string.Equals(Input.Username, AdminUsername, StringComparison.Ordinal)
            || !string.Equals(Input.Password, expectedPassword, StringComparison.Ordinal))
        {
            ModelState.AddModelError(string.Empty, "Invalid username or password.");
            return Page();
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, AdminUsername),
            new Claim(ClaimTypes.Role, "Admin"),
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            new AuthenticationProperties { IsPersistent = Input.RememberMe });

        if (!Url.IsLocalUrl(returnUrl))
        {
            return RedirectToPage("/Index");
        }

        return LocalRedirect(returnUrl);
    }

    public sealed class LoginInput
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;

        [Display(Name = "Remember me")]
        public bool RememberMe { get; set; }
    }
}
