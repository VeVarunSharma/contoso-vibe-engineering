import { filterPHI, getPatientSummary, type PatientData } from "../pii-filter.js";

const fullPatient: PatientData = {
  id: "p-001",
  firstName: "Alex",
  lastName: "Smith",
  dateOfBirth: "1980-04-12",
  socialInsuranceNumber: "123-456-789",
  healthCardNumber: "9876543210",
  address: "123 Main St",
  city: "Vancouver",
  province: "BC",
  postalCode: "V6B 1A1",
  phoneNumber: "555-0100",
  email: "alex@example.com",
  medicalHistory: { conditions: ["asthma"] },
  medications: [{ name: "Ventolin" }],
  allergies: ["peanuts"],
  insuranceInfo: { plan: "MSP" },
  emergencyContacts: [{ name: "Pat Smith" }],
};

describe("filterPHI", () => {
  it("always returns at least the patient id and an _accessedFields array", () => {
    const result = filterPHI(fullPatient, "research", "receptionist");
    expect(result.id).toBe("p-001");
    expect(Array.isArray(result._accessedFields)).toBe(true);
    expect(result._accessedFields).toContain("id");
  });

  describe("treatment purpose", () => {
    it("permits physician access including healthCardNumber", () => {
      const out = filterPHI(fullPatient, "treatment", "physician");
      expect(out.firstName).toBe("Alex");
      expect(out.medicalHistory).toEqual({ conditions: ["asthma"] });
      expect(out.medications).toEqual([{ name: "Ventolin" }]);
      expect(out.healthCardNumber).toBe("9876543210");
      expect(out.address).toBeUndefined();
      expect(out._accessedFields).toEqual(
        expect.arrayContaining([
          "firstName",
          "lastName",
          "dateOfBirth",
          "medicalHistory",
          "medications",
          "allergies",
          "healthCardNumber",
        ])
      );
    });

    it("permits nurse access but withholds healthCardNumber", () => {
      const out = filterPHI(fullPatient, "treatment", "nurse");
      expect(out.firstName).toBe("Alex");
      expect(out.medications).toBeDefined();
      expect(out.healthCardNumber).toBeUndefined();
      expect(out._accessedFields).not.toContain("healthCardNumber");
    });

    it("rejects billing role on treatment purpose", () => {
      const out = filterPHI(fullPatient, "treatment", "billing");
      expect(out.firstName).toBeUndefined();
      expect(out.medicalHistory).toBeUndefined();
      expect(out._accessedFields).toEqual(["id"]);
    });

    it("rejects admin role on treatment purpose", () => {
      const out = filterPHI(fullPatient, "treatment", "admin");
      expect(out.firstName).toBeUndefined();
      expect(out._accessedFields).toEqual(["id"]);
    });
  });

  describe("billing purpose", () => {
    it("permits billing role", () => {
      const out = filterPHI(fullPatient, "billing", "billing");
      expect(out.address).toBe("123 Main St");
      expect(out.insuranceInfo).toEqual({ plan: "MSP" });
      expect(out.medicalHistory).toBeUndefined();
    });

    it("permits admin role", () => {
      const out = filterPHI(fullPatient, "billing", "admin");
      expect(out.email).toBe("alex@example.com");
    });

    it("rejects nurse role on billing purpose", () => {
      const out = filterPHI(fullPatient, "billing", "nurse");
      expect(out.address).toBeUndefined();
      expect(out.insuranceInfo).toBeUndefined();
      expect(out._accessedFields).toEqual(["id"]);
    });

    it("rejects physician role on billing purpose", () => {
      const out = filterPHI(fullPatient, "billing", "physician");
      expect(out.insuranceInfo).toBeUndefined();
      expect(out._accessedFields).toEqual(["id"]);
    });
  });

  describe("referral purpose", () => {
    it("permits physician role with medical summary + healthCardNumber", () => {
      const out = filterPHI(fullPatient, "referral", "physician");
      expect(out.healthCardNumber).toBe("9876543210");
      expect(out.medicalHistory).toBeDefined();
    });

    it("rejects nurse role on referral", () => {
      const out = filterPHI(fullPatient, "referral", "nurse");
      expect(out.healthCardNumber).toBeUndefined();
      expect(out._accessedFields).toEqual(["id"]);
    });
  });

  describe("emergency purpose", () => {
    it("permits any role to read basic emergency info", () => {
      const out = filterPHI(fullPatient, "emergency", "receptionist");
      expect(out.firstName).toBe("Alex");
      expect(out.allergies).toEqual(["peanuts"]);
      expect(out.emergencyContacts).toBeDefined();
      expect(out.medications).toBeUndefined();
    });

    it("includes medications for medical staff", () => {
      const physician = filterPHI(fullPatient, "emergency", "physician");
      expect(physician.medications).toBeDefined();
      const nurse = filterPHI(fullPatient, "emergency", "nurse");
      expect(nurse.medications).toBeDefined();
    });

    it("excludes medications for non-medical staff", () => {
      const billing = filterPHI(fullPatient, "emergency", "billing");
      expect(billing.medications).toBeUndefined();
      const admin = filterPHI(fullPatient, "emergency", "admin");
      expect(admin.medications).toBeUndefined();
    });
  });

  describe("research purpose", () => {
    it("returns only minimal fields regardless of role", () => {
      for (const role of [
        "physician",
        "nurse",
        "admin",
        "billing",
        "receptionist",
      ] as const) {
        const out = filterPHI(fullPatient, "research", role);
        expect(out.dateOfBirth).toBe("1980-04-12");
        expect(out.firstName).toBeUndefined();
        expect(out.medicalHistory).toBeUndefined();
        expect(out.socialInsuranceNumber).toBeUndefined();
        expect(out._accessedFields).toEqual(["id", "dateOfBirth"]);
      }
    });
  });

  it("never returns the socialInsuranceNumber for any purpose/role combo", () => {
    const purposes = [
      "treatment",
      "billing",
      "referral",
      "research",
      "emergency",
    ] as const;
    const roles = [
      "physician",
      "nurse",
      "admin",
      "billing",
      "receptionist",
    ] as const;

    for (const purpose of purposes) {
      for (const role of roles) {
        const out = filterPHI(fullPatient, purpose, role);
        expect(out.socialInsuranceNumber).toBeUndefined();
      }
    }
  });
});

describe("getPatientSummary", () => {
  it("returns id, initials, and dateOfBirth only", () => {
    const summary = getPatientSummary(fullPatient);
    expect(summary).toEqual({
      id: "p-001",
      initials: "AS",
      dateOfBirth: "1980-04-12",
    });
  });
});
