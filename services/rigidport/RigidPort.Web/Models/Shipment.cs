using System.ComponentModel.DataAnnotations;

namespace RigidPort.Web.Models;

public class Shipment
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string TrackingNumber { get; set; } = string.Empty;

    public int OriginPortId { get; set; }
    public Port OriginPort { get; set; } = null!;

    public int DestinationPortId { get; set; }
    public Port DestinationPort { get; set; } = null!;

    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;

    public int? ContainerId { get; set; }
    public Container? Container { get; set; }

    public ShipmentStatus Status { get; set; } = ShipmentStatus.Booked;

    public double WeightKg { get; set; }

    [MaxLength(500)]
    public string? CargoDescription { get; set; }

    public decimal Value { get; set; }

    public DateTime? EstimatedArrival { get; set; }
    public DateTime? ActualArrival { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TrackingEvent> TrackingEvents { get; set; } = new List<TrackingEvent>();
}
