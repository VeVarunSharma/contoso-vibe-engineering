namespace RigidPort.Web.Models;

public enum ShipmentStatus
{
    Booked,
    PickedUp,
    InTransit,
    AtPort,
    CustomsClearance,
    OutForDelivery,
    Delivered,
    Cancelled
}

public enum ContainerType
{
    Standard20ft,
    Standard40ft,
    HighCube40ft,
    Reefer
}

public enum ContainerStatus
{
    Available,
    InUse,
    Maintenance
}
