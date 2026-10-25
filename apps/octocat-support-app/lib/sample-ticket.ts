import type { TicketFormData } from "@/lib/types";

export const SAMPLE_TICKET: TicketFormData = {
  name: "Demo Analyst",
  email: "analyst@example.test",
  category: "bug",
  priority: "high",
  subject: "Order search hides confirmed orders",
  description: [
    "Synthetic scenario: the support team cannot find confirmed orders in the Northwind sandbox.",
    "",
    "Steps: Open Orders, search for DEMO-1042, then choose Confirmed.",
    "Expected: the confirmed order appears in the results.",
    "Actual: the list is empty. Clearing the status filter shows the order.",
    "",
    "Impact: support cannot answer order-status questions using the filtered view.",
    "Workaround: clear the filter. No customer data or live orders are included.",
  ].join("\n"),
};
