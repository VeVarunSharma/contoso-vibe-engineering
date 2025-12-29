import { db } from "./index.js";
import { users, patients, consentRecords, auditLogs } from "./schema.js";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  console.log("🌱 Seeding medical-api database...");

  // Create healthcare staff users
  const drSmith = {
    id: uuidv4(),
    email: "dr.smith@hospital.bc.ca",
    name: "Dr. Sarah Smith",
    role: "physician" as const,
    department: "Internal Medicine",
  };

  const nurseJones = {
    id: uuidv4(),
    email: "nurse.jones@hospital.bc.ca",
    name: "Mike Jones",
    role: "nurse" as const,
    department: "Emergency",
  };

  const adminWilson = {
    id: uuidv4(),
    email: "admin.wilson@hospital.bc.ca",
    name: "Emily Wilson",
    role: "billing" as const,
    department: "Administration",
  };

  await db.insert(users).values([drSmith, nurseJones, adminWilson]);
  console.log("✅ Created users");

  // Create fake patients (all data is fictional)
  const patient1 = {
    id: uuidv4(),
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1985-03-15",
    socialInsuranceNumber: "123-456-789", // Fake SIN
    healthCardNumber: "9876543210", // Fake BC PHN
    address: "123 Main Street",
    city: "Vancouver",
    province: "BC",
    postalCode: "V6B 1A1",
    phoneNumber: "604-555-0100",
    email: "john.doe@example.com",
    medicalHistory: [{ condition: "Hypertension", diagnosedYear: 2020 }],
    medications: [{ name: "Lisinopril", dosage: "10mg" }],
    allergies: ["Penicillin"],
    insuranceInfo: {
      provider: "Pacific Blue Cross",
      policyNumber: "PBC-123456",
    },
    emergencyContacts: [
      { name: "Jane Doe", relationship: "Spouse", phone: "604-555-0101" },
    ],
  };

  const patient2 = {
    id: uuidv4(),
    firstName: "Maria",
    lastName: "Garcia",
    dateOfBirth: "1992-07-22",
    socialInsuranceNumber: "987-654-321",
    healthCardNumber: "1234567890",
    address: "456 Oak Avenue",
    city: "Victoria",
    province: "BC",
    postalCode: "V8W 2C3",
    phoneNumber: "250-555-0200",
    email: "maria.garcia@example.com",
    medicalHistory: [],
    medications: [],
    allergies: ["Latex"],
    insuranceInfo: { provider: "Manulife", policyNumber: "MAN-789012" },
    emergencyContacts: [],
  };

  const patient3 = {
    id: uuidv4(),
    firstName: "Robert",
    lastName: "Chen",
    dateOfBirth: "1978-11-08",
    socialInsuranceNumber: "456-789-123",
    healthCardNumber: "5678901234",
    address: "789 Cedar Lane",
    city: "Surrey",
    province: "BC",
    postalCode: "V3T 4K5",
    phoneNumber: "604-555-0300",
    email: "robert.chen@example.com",
    medicalHistory: [
      { condition: "Type 2 Diabetes", diagnosedYear: 2018 },
      { condition: "Asthma", diagnosedYear: 2005 },
    ],
    medications: [
      { name: "Metformin", dosage: "500mg" },
      { name: "Albuterol", dosage: "as needed" },
    ],
    allergies: [],
    insuranceInfo: { provider: "Sun Life", policyNumber: "SL-345678" },
    emergencyContacts: [
      { name: "Lisa Chen", relationship: "Wife", phone: "604-555-0301" },
    ],
  };

  await db.insert(patients).values([patient1, patient2, patient3]);
  console.log("✅ Created patients");

  // Create consent records (some active, some expired, some withdrawn)
  await db.insert(consentRecords).values([
    // Active consent for treatment
    {
      id: uuidv4(),
      patientId: patient1.id,
      purpose: "treatment",
      grantedBy: `${patient1.firstName} ${patient1.lastName}`,
      grantedAt: new Date("2024-01-15"),
      isActive: true,
    },
    // Active consent for billing
    {
      id: uuidv4(),
      patientId: patient1.id,
      purpose: "billing",
      grantedBy: `${patient1.firstName} ${patient1.lastName}`,
      grantedAt: new Date("2024-01-15"),
      isActive: true,
    },
    // Expired consent for research
    {
      id: uuidv4(),
      patientId: patient2.id,
      purpose: "research",
      grantedBy: `${patient2.firstName} ${patient2.lastName}`,
      grantedAt: new Date("2023-01-01"),
      expiresAt: new Date("2023-12-31"),
      isActive: false,
    },
    // Withdrawn consent
    {
      id: uuidv4(),
      patientId: patient3.id,
      purpose: "referral",
      grantedBy: `${patient3.firstName} ${patient3.lastName}`,
      grantedAt: new Date("2024-02-01"),
      withdrawnAt: new Date("2024-03-15"),
      isActive: false,
    },
    // Active emergency consent
    {
      id: uuidv4(),
      patientId: patient3.id,
      purpose: "emergency",
      grantedBy: `${patient3.firstName} ${patient3.lastName}`,
      grantedAt: new Date("2024-01-01"),
      isActive: true,
    },
  ]);
  console.log("✅ Created consent records");

  // Create sample audit logs (demonstrating proper logging without PHI)
  await db.insert(auditLogs).values([
    {
      id: uuidv4(),
      action: "PATIENT_ACCESS",
      resourceType: "patient",
      resourceId: patient1.id,
      userId: drSmith.id,
      purpose: "treatment",
      fieldsAccessed: [
        "firstName",
        "lastName",
        "medicalHistory",
        "medications",
      ],
      ipAddress: "10.0.0.50",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
    {
      id: uuidv4(),
      action: "ACCESS_DENIED",
      resourceType: "patient",
      resourceId: patient2.id,
      userId: adminWilson.id,
      purpose: "treatment",
      fieldsAccessed: [],
      ipAddress: "10.0.0.100",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
  ]);
  console.log("✅ Created audit logs");

  console.log("🎉 Seeding complete!");
  console.log("\n📋 Demo Users:");
  console.log(`  Physician: ${drSmith.id} (${drSmith.email})`);
  console.log(`  Nurse: ${nurseJones.id} (${nurseJones.email})`);
  console.log(`  Billing: ${adminWilson.id} (${adminWilson.email})`);
  console.log("\n📋 Demo Patients:");
  console.log(`  ${patient1.id} - ${patient1.firstName} ${patient1.lastName}`);
  console.log(`  ${patient2.id} - ${patient2.firstName} ${patient2.lastName}`);
  console.log(`  ${patient3.id} - ${patient3.firstName} ${patient3.lastName}`);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
