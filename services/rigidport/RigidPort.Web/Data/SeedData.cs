using RigidPort.Web.Models;

namespace RigidPort.Web.Data;

public static class SeedData
{
    public static void Initialize(AppDbContext context)
    {
        context.Database.EnsureCreated();

        if (context.Ports.Any()) return;

        var ports = new List<Port>
        {
            new() { Name = "Port of Los Angeles", Code = "USLAX", City = "Los Angeles", Country = "United States", Latitude = 33.74, Longitude = -118.27 },
            new() { Name = "Port of Long Beach", Code = "USLGB", City = "Long Beach", Country = "United States", Latitude = 33.75, Longitude = -118.22 },
            new() { Name = "Port of New York/New Jersey", Code = "USNYC", City = "New York", Country = "United States", Latitude = 40.68, Longitude = -74.04 },
            new() { Name = "Port of Savannah", Code = "USSAV", City = "Savannah", Country = "United States", Latitude = 32.08, Longitude = -81.09 },
            new() { Name = "Port of Shanghai", Code = "CNSHA", City = "Shanghai", Country = "China", Latitude = 31.36, Longitude = 121.62 },
            new() { Name = "Port of Shenzhen", Code = "CNSZX", City = "Shenzhen", Country = "China", Latitude = 22.48, Longitude = 113.87 },
            new() { Name = "Port of Singapore", Code = "SGSIN", City = "Singapore", Country = "Singapore", Latitude = 1.26, Longitude = 103.83 },
            new() { Name = "Port of Rotterdam", Code = "NLRTM", City = "Rotterdam", Country = "Netherlands", Latitude = 51.95, Longitude = 4.13 },
            new() { Name = "Port of Hamburg", Code = "DEHAM", City = "Hamburg", Country = "Germany", Latitude = 53.53, Longitude = 9.97 },
            new() { Name = "Port of Antwerp", Code = "BEANR", City = "Antwerp", Country = "Belgium", Latitude = 51.27, Longitude = 4.40 },
            new() { Name = "Port of Busan", Code = "KRPUS", City = "Busan", Country = "South Korea", Latitude = 35.10, Longitude = 129.04 },
            new() { Name = "Port of Dubai (Jebel Ali)", Code = "AEJEA", City = "Dubai", Country = "UAE", Latitude = 25.01, Longitude = 55.06 },
            new() { Name = "Port of Tokyo", Code = "JPTYO", City = "Tokyo", Country = "Japan", Latitude = 35.62, Longitude = 139.77 },
            new() { Name = "Port of Felixstowe", Code = "GBFXT", City = "Felixstowe", Country = "United Kingdom", Latitude = 51.96, Longitude = 1.33 },
            new() { Name = "Port of Santos", Code = "BRSSZ", City = "Santos", Country = "Brazil", Latitude = -23.95, Longitude = -46.30 },
        };
        context.Ports.AddRange(ports);
        context.SaveChanges();

        var customers = new List<Customer>
        {
            new() { CompanyName = "TechFlow Electronics", ContactName = "Sarah Chen", Email = "sarah@techflow.com", Phone = "+1-415-555-0101", Address = "500 Market St, San Francisco, CA" },
            new() { CompanyName = "Nordic Furniture Co", ContactName = "Erik Johansson", Email = "erik@nordicfurniture.se", Phone = "+46-8-555-0202", Address = "Storgatan 15, Stockholm, Sweden" },
            new() { CompanyName = "Sahara Trading LLC", ContactName = "Ahmed Al-Rashid", Email = "ahmed@saharatrading.ae", Phone = "+971-4-555-0303", Address = "Business Bay, Dubai, UAE" },
            new() { CompanyName = "Pacific Auto Parts", ContactName = "Kenji Tanaka", Email = "kenji@pacificauto.jp", Phone = "+81-3-555-0404", Address = "2-1-1 Marunouchi, Tokyo, Japan" },
            new() { CompanyName = "GreenLeaf Organics", ContactName = "Maria Santos", Email = "maria@greenleaf.br", Phone = "+55-11-555-0505", Address = "Rua Augusta 100, São Paulo, Brazil" },
            new() { CompanyName = "Atlas Steel Works", ContactName = "Hans Mueller", Email = "hans@atlassteel.de", Phone = "+49-40-555-0606", Address = "Hafenstraße 25, Hamburg, Germany" },
            new() { CompanyName = "Oceanic Textiles", ContactName = "Priya Sharma", Email = "priya@oceanictextiles.sg", Phone = "+65-555-0707", Address = "10 Anson Road, Singapore" },
            new() { CompanyName = "Liberty Imports", ContactName = "James Wilson", Email = "james@libertyimports.com", Phone = "+1-212-555-0808", Address = "350 Fifth Ave, New York, NY" },
            new() { CompanyName = "Dragon Toys Manufacturing", ContactName = "Wei Zhang", Email = "wei@dragontoys.cn", Phone = "+86-21-555-0909", Address = "Pudong New Area, Shanghai, China" },
            new() { CompanyName = "Crown Beverages", ContactName = "Oliver Brown", Email = "oliver@crownbev.co.uk", Phone = "+44-20-555-1010", Address = "100 Liverpool St, London, UK" },
        };
        context.Customers.AddRange(customers);
        context.SaveChanges();

        var containers = new List<Container>();
        var containerTypes = new[] { ContainerType.Standard20ft, ContainerType.Standard40ft, ContainerType.HighCube40ft, ContainerType.Reefer };
        var maxWeights = new Dictionary<ContainerType, double>
        {
            { ContainerType.Standard20ft, 28200 },
            { ContainerType.Standard40ft, 30480 },
            { ContainerType.HighCube40ft, 30480 },
            { ContainerType.Reefer, 27400 }
        };
        var rng = new Random(42);
        for (int i = 1; i <= 30; i++)
        {
            var cType = containerTypes[rng.Next(containerTypes.Length)];
            containers.Add(new Container
            {
                ContainerNumber = $"RGPT{i:D7}",
                Type = cType,
                Status = i <= 20 ? ContainerStatus.InUse : (i <= 27 ? ContainerStatus.Available : ContainerStatus.Maintenance),
                MaxWeightKg = maxWeights[cType],
                CurrentLocation = ports[rng.Next(ports.Count)].City
            });
        }
        context.Containers.AddRange(containers);
        context.SaveChanges();

        var statuses = Enum.GetValues<ShipmentStatus>().Where(s => s != ShipmentStatus.Cancelled).ToArray();
        var shipments = new List<Shipment>();
        var baseDate = DateTime.UtcNow.AddDays(-60);

        for (int i = 1; i <= 50; i++)
        {
            var originIdx = rng.Next(ports.Count);
            var destIdx = (originIdx + rng.Next(1, ports.Count)) % ports.Count;
            var status = statuses[rng.Next(statuses.Length)];
            var createdAt = baseDate.AddDays(rng.Next(0, 55)).AddHours(rng.Next(0, 24));
            var eta = createdAt.AddDays(rng.Next(14, 45));

            shipments.Add(new Shipment
            {
                TrackingNumber = $"RP-{2026}{i:D5}",
                OriginPortId = ports[originIdx].Id,
                DestinationPortId = ports[destIdx].Id,
                CustomerId = customers[rng.Next(customers.Count)].Id,
                ContainerId = i <= 20 ? containers[i - 1].Id : null,
                Status = status,
                WeightKg = Math.Round(rng.NextDouble() * 25000 + 1000, 1),
                CargoDescription = GetCargoDescription(rng),
                Value = Math.Round((decimal)(rng.NextDouble() * 500000 + 5000), 2),
                EstimatedArrival = eta,
                ActualArrival = status == ShipmentStatus.Delivered ? eta.AddDays(rng.Next(-3, 5)) : null,
                CreatedAt = createdAt,
                UpdatedAt = createdAt.AddDays(rng.Next(0, 10))
            });
        }
        context.Shipments.AddRange(shipments);
        context.SaveChanges();

        // Add tracking events for each shipment
        foreach (var shipment in shipments)
        {
            var events = GenerateTrackingEvents(shipment, ports, rng);
            context.TrackingEvents.AddRange(events);
        }
        context.SaveChanges();
    }

    private static string GetCargoDescription(Random rng)
    {
        var descriptions = new[]
        {
            "Consumer electronics - smartphones and tablets",
            "Flat-pack furniture and home decor",
            "Automotive spare parts and accessories",
            "Organic coffee beans and dried fruits",
            "Industrial steel coils and sheets",
            "Textile fabrics and garments",
            "Children's toys and games",
            "Medical equipment and supplies",
            "Fresh seafood (temperature controlled)",
            "Machinery components and tools",
            "Luxury fashion goods",
            "Chemical raw materials (non-hazardous)",
            "Wine and spirits (bonded)",
            "Solar panels and renewable energy equipment",
            "Agricultural seeds and fertilizers"
        };
        return descriptions[rng.Next(descriptions.Length)];
    }

    private static List<TrackingEvent> GenerateTrackingEvents(Shipment shipment, List<Port> ports, Random rng)
    {
        var events = new List<TrackingEvent>();
        var statusIndex = (int)shipment.Status;
        var allStatuses = Enum.GetValues<ShipmentStatus>().Where(s => s != ShipmentStatus.Cancelled).ToArray();
        var eventTime = shipment.CreatedAt;

        for (int i = 0; i <= statusIndex && i < allStatuses.Length; i++)
        {
            var status = allStatuses[i];
            var location = status switch
            {
                ShipmentStatus.Booked => "System",
                ShipmentStatus.PickedUp => ports.First(p => p.Id == shipment.OriginPortId).City,
                ShipmentStatus.InTransit => "At Sea",
                ShipmentStatus.AtPort => ports.First(p => p.Id == shipment.DestinationPortId).City,
                ShipmentStatus.CustomsClearance => ports.First(p => p.Id == shipment.DestinationPortId).City,
                ShipmentStatus.OutForDelivery => ports.First(p => p.Id == shipment.DestinationPortId).City,
                ShipmentStatus.Delivered => "Final Destination",
                _ => "Unknown"
            };

            var description = status switch
            {
                ShipmentStatus.Booked => "Shipment booked and confirmed",
                ShipmentStatus.PickedUp => $"Cargo picked up at {location}",
                ShipmentStatus.InTransit => "Vessel departed, shipment in transit",
                ShipmentStatus.AtPort => $"Arrived at destination port in {location}",
                ShipmentStatus.CustomsClearance => "Customs clearance in progress",
                ShipmentStatus.OutForDelivery => "Released from customs, out for delivery",
                ShipmentStatus.Delivered => "Shipment delivered successfully",
                _ => "Status update"
            };

            events.Add(new TrackingEvent
            {
                ShipmentId = shipment.Id,
                Status = status,
                Location = location,
                Description = description,
                Timestamp = eventTime
            });

            eventTime = eventTime.AddDays(rng.Next(1, 5)).AddHours(rng.Next(0, 12));
        }

        return events;
    }
}
