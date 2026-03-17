using System.ComponentModel.DataAnnotations;

namespace RigidPort.Web.Models;

public class Container
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string ContainerNumber { get; set; } = string.Empty;

    public ContainerType Type { get; set; }
    public ContainerStatus Status { get; set; }

    public double MaxWeightKg { get; set; }

    [MaxLength(100)]
    public string? CurrentLocation { get; set; }

    public ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();
}
