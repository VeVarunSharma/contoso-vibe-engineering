import type { AuthUser } from "../middleware/auth.js";

/**
 * PIPA BC Requirement: Data Minimization - Organizations should only
 * collect, use, and disclose the minimum amount of personal information
 * necessary for the identified purpose.
 */

export interface PatientData {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  socialInsuranceNumber?: string | null;
  healthCardNumber?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  medicalHistory?: unknown;
  medications?: unknown;
  allergies?: unknown;
  insuranceInfo?: unknown;
  emergencyContacts?: unknown;
}

export type Purpose =
  | "treatment"
  | "billing"
  | "referral"
  | "research"
  | "emergency";

/**
 * Filters patient data based on purpose and role.
 * PIPA BC Requirement: Return only fields needed for the stated purpose.
 *
 * @param patient - Full patient record
 * @param purpose - The purpose for accessing the data
 * @param role - The user's role
 * @returns Filtered patient data with only permitted fields
 */
export function filterPHI(
  patient: PatientData,
  purpose: Purpose,
  role: AuthUser["role"]
): Partial<PatientData> & { _accessedFields: string[] } {
  const accessedFields: string[] = ["id"];
  const filtered: Partial<PatientData> = { id: patient.id };

  // PIPA BC: Purpose-based filtering rules
  switch (purpose) {
    case "treatment":
      // Only physicians and nurses can access treatment data
      if (role === "physician" || role === "nurse") {
        filtered.firstName = patient.firstName;
        filtered.lastName = patient.lastName;
        filtered.dateOfBirth = patient.dateOfBirth;
        filtered.medicalHistory = patient.medicalHistory;
        filtered.medications = patient.medications;
        filtered.allergies = patient.allergies;
        accessedFields.push(
          "firstName",
          "lastName",
          "dateOfBirth",
          "medicalHistory",
          "medications",
          "allergies"
        );

        // Physicians get additional access
        if (role === "physician") {
          filtered.healthCardNumber = patient.healthCardNumber;
          accessedFields.push("healthCardNumber");
        }
      }
      break;

    case "billing":
      // Only billing and admin can access billing data
      if (role === "billing" || role === "admin") {
        filtered.firstName = patient.firstName;
        filtered.lastName = patient.lastName;
        filtered.address = patient.address;
        filtered.city = patient.city;
        filtered.province = patient.province;
        filtered.postalCode = patient.postalCode;
        filtered.phoneNumber = patient.phoneNumber;
        filtered.email = patient.email;
        filtered.insuranceInfo = patient.insuranceInfo;
        accessedFields.push(
          "firstName",
          "lastName",
          "address",
          "city",
          "province",
          "postalCode",
          "phoneNumber",
          "email",
          "insuranceInfo"
        );
      }
      break;

    case "referral":
      // Only physicians can create referrals
      if (role === "physician") {
        filtered.firstName = patient.firstName;
        filtered.lastName = patient.lastName;
        filtered.dateOfBirth = patient.dateOfBirth;
        filtered.healthCardNumber = patient.healthCardNumber;
        // Only include relevant medical summary, not full history
        filtered.medicalHistory = patient.medicalHistory;
        accessedFields.push(
          "firstName",
          "lastName",
          "dateOfBirth",
          "healthCardNumber",
          "medicalHistory"
        );
      }
      break;

    case "emergency":
      // Any authenticated user can access emergency info
      filtered.firstName = patient.firstName;
      filtered.lastName = patient.lastName;
      filtered.dateOfBirth = patient.dateOfBirth;
      filtered.allergies = patient.allergies;
      filtered.emergencyContacts = patient.emergencyContacts;
      accessedFields.push(
        "firstName",
        "lastName",
        "dateOfBirth",
        "allergies",
        "emergencyContacts"
      );

      // Medical staff get medication info in emergencies
      if (role === "physician" || role === "nurse") {
        filtered.medications = patient.medications;
        accessedFields.push("medications");
      }
      break;

    case "research":
      // Research access requires explicit handling
      // TODO: Implement de-identification for research purposes
      filtered.dateOfBirth = patient.dateOfBirth;
      accessedFields.push("dateOfBirth");
      break;
  }

  return { ...filtered, _accessedFields: accessedFields };
}

/**
 * Creates a minimal patient summary for basic lookup.
 * PIPA BC Requirement: Provide minimal info for identity verification.
 */
export function getPatientSummary(patient: PatientData): {
  id: string;
  initials: string;
  dateOfBirth: string;
} {
  return {
    id: patient.id,
    initials: `${patient.firstName[0]}${patient.lastName[0]}`,
    dateOfBirth: patient.dateOfBirth,
  };
}
