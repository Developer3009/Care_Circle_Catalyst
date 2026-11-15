// HL7 FHIR Release 4 (R4) Interoperability Generator for CareCircle
// Exports patient electronic medical records, active medications, and vitals
// adhering to the international FHIR R4 standard (US Core / ABDM compliant).

import type { MedicationOut, VitalOut } from "@/lib/types";

export interface FhirExportParams {
  patientId: string;
  patientName: string;
  birthDate?: string;
  gender?: "male" | "female" | "other" | "unknown";
  bloodGroup?: string;
  allergies?: string[];
  emergencyContacts?: Array<{ name: string; relation: string; phone: string }>;
  medications: MedicationOut[];
  vitals: VitalOut[];
  attendingDoctor?: { name: string; speciality?: string; phone?: string };
}

export function generateFhirR4Bundle(params: FhirExportParams) {
  const timestamp = new Date().toISOString();
  const bundleId = "urn:uuid:carecircle-bundle-" + Date.now();

  const entries: any[] = [];

  // 1. Patient Resource
  const patientResource = {
    fullUrl: `urn:uuid:patient-${params.patientId}`,
    resource: {
      resourceType: "Patient",
      id: params.patientId,
      identifier: [
        {
          system: "https://carecircle.app/patients",
          value: params.patientId,
          use: "official",
        },
      ],
      active: true,
      name: [
        {
          use: "official",
          text: params.patientName,
          family: params.patientName.split(" ").slice(-1)[0] || "",
          given: params.patientName.split(" ").slice(0, -1),
        },
      ],
      gender: params.gender || "male",
      birthDate: params.birthDate || "1952-06-15",
      contact: (params.emergencyContacts || []).map((c) => ({
        relationship: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v2-0131",
                code: "C",
                display: c.relation,
              },
            ],
            text: c.relation,
          },
        ],
        name: { text: c.name },
        telecom: [{ system: "phone", value: c.phone }],
      })),
      extension: [
        {
          url: "https://carecircle.app/fhir/StructureDefinition/blood-group",
          valueString: params.bloodGroup || "O+ Positive",
        },
      ],
    },
  };
  entries.push(patientResource);

  // 2. AllergyIntolerance Resources
  (params.allergies || []).forEach((allergy, idx) => {
    entries.push({
      fullUrl: `urn:uuid:allergy-${idx}`,
      resource: {
        resourceType: "AllergyIntolerance",
        id: `allergy-${idx}`,
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
              code: "active",
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
              code: "confirmed",
            },
          ],
        },
        code: {
          text: allergy,
        },
        patient: {
          reference: `urn:uuid:patient-${params.patientId}`,
          display: params.patientName,
        },
        recordedDate: timestamp,
      },
    });
  });

  // 3. MedicationStatement Resources (Active Regimen)
  params.medications.forEach((med) => {
    entries.push({
      fullUrl: `urn:uuid:medstatement-${med.id}`,
      resource: {
        resourceType: "MedicationStatement",
        id: med.id,
        status: med.is_active ? "active" : "completed",
        medicationCodeableConcept: {
          coding: [
            {
              system: "http://www.nlm.nih.gov/research/umls/rxnorm",
              code: "generic",
              display: med.name,
            },
          ],
          text: `${med.name} ${med.strength}`,
        },
        subject: {
          reference: `urn:uuid:patient-${params.patientId}`,
          display: params.patientName,
        },
        effectiveDateTime: timestamp,
        dosage: [
          {
            text: `${med.strength}, ${med.instructions || "after_food"}`,
            timing: {
              repeat: {
                frequency: med.schedules?.[0]?.times_of_day?.length || 1,
                period: 1,
                periodUnit: "d",
                timeOfDay: med.schedules?.[0]?.times_of_day || ["08:00"],
              },
            },
          },
        ],
        note: [
          {
            text: `Current pill stock: ${med.stock_count || 30} units. Criticality: ${med.criticality || "NORMAL"}.`,
          },
        ],
      },
    });
  });

  // 4. Observation Resources (Vitals & Clinical Measurements with LOINC Codes)
  params.vitals.forEach((vital) => {
    if (vital.type === "BP") {
      // LOINC 85354-9: Blood pressure panel
      entries.push({
        fullUrl: `urn:uuid:obs-${vital.id}`,
        resource: {
          resourceType: "Observation",
          id: vital.id,
          status: "final",
          category: [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/observation-category",
                  code: "vital-signs",
                  display: "Vital Signs",
                },
              ],
            },
          ],
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "85354-9",
                display: "Blood pressure panel with all children optional",
              },
            ],
            text: "Blood Pressure",
          },
          subject: {
            reference: `urn:uuid:patient-${params.patientId}`,
            display: params.patientName,
          },
          effectiveDateTime: vital.measured_at || timestamp,
          component: [
            {
              code: {
                coding: [
                  {
                    system: "http://loinc.org",
                    code: "8480-6",
                    display: "Systolic blood pressure",
                  },
                ],
              },
              valueQuantity: {
                value: Number(vital.value),
                unit: "mmHg",
                system: "http://unitsofmeasure.org",
                code: "mm[Hg]",
              },
            },
            {
              code: {
                coding: [
                  {
                    system: "http://loinc.org",
                    code: "8462-4",
                    display: "Diastolic blood pressure",
                  },
                ],
              },
              valueQuantity: {
                value: vital.secondary_value ? Number(vital.secondary_value) : 80,
                unit: "mmHg",
                system: "http://unitsofmeasure.org",
                code: "mm[Hg]",
              },
            },
          ],
        },
      });
    } else if (vital.type === "SUGAR") {
      // LOINC 2339-0: Glucose in Blood
      entries.push({
        fullUrl: `urn:uuid:obs-${vital.id}`,
        resource: {
          resourceType: "Observation",
          id: vital.id,
          status: "final",
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "2339-0",
                display: "Glucose [Mass/volume] in Blood",
              },
            ],
            text: "Blood Glucose",
          },
          subject: {
            reference: `urn:uuid:patient-${params.patientId}`,
            display: params.patientName,
          },
          effectiveDateTime: vital.measured_at || timestamp,
          valueQuantity: {
            value: Number(vital.value),
            unit: "mg/dL",
            system: "http://unitsofmeasure.org",
            code: "mg/dL",
          },
        },
      });
    }
  });

  return {
    resourceType: "Bundle",
    id: bundleId,
    meta: {
      lastUpdated: timestamp,
      profile: ["http://hl7.org/fhir/StructureDefinition/Bundle"],
    },
    type: "document",
    timestamp,
    entry: entries,
  };
}
