import { ArtifactType } from "@/types";

export interface ArtifactColumn {
  key: string;
  labelKey: string;
  type: "text" | "date" | "select";
  options?: string[];
}

export interface ArtifactDefinition {
  type: ArtifactType;
  titleKey: string;
  descKey: string;
  columns: ArtifactColumn[];
}

// Maps a canonical (English, stored-in-DB) option value to its translation key suffix.
export const ARTIFACT_OPTION_KEYS: Record<string, string> = {
  "Real-time": "realTime",
  "Daily": "daily",
  "Weekly": "weekly",
  "Monthly": "monthly",
  "Yes": "yes",
  "No": "no",
  "Hardware": "hardware",
  "Software": "software",
  "Cloud Service": "cloudService",
  "Data": "data",
  "Low": "low",
  "Medium": "medium",
  "High": "high",
  "Critical": "critical",
  "Open": "open",
  "In Progress": "inProgress",
  "Resolved": "resolved",
  "Completed": "completed",
  "Denied": "denied",
  "Access": "access",
  "Rectification": "rectification",
  "Erasure": "erasure",
  "Portability": "portability",
  "Objection": "objection",
  "None": "none",
  "Limited": "limited",
  "Full": "full",
};

export const ARTIFACT_DEFINITIONS: Record<ArtifactType, ArtifactDefinition> = {
  backup_register: {
    type: "backup_register",
    titleKey: "artifact.title.backup_register",
    descKey: "artifact.desc.backup_register",
    columns: [
      { key: "system", labelKey: "artifact.col.systemData", type: "text" },
      { key: "frequency", labelKey: "artifact.col.frequency", type: "select", options: ["Real-time", "Daily", "Weekly", "Monthly"] },
      { key: "location", labelKey: "artifact.col.storageLocation", type: "text" },
      { key: "retention", labelKey: "artifact.col.retentionPeriod", type: "text" },
      { key: "encrypted", labelKey: "artifact.col.encrypted", type: "select", options: ["Yes", "No"] },
      { key: "lastTested", labelKey: "artifact.col.lastRestoreTest", type: "date" },
    ],
  },
  asset_inventory: {
    type: "asset_inventory",
    titleKey: "artifact.title.asset_inventory",
    descKey: "artifact.desc.asset_inventory",
    columns: [
      { key: "name", labelKey: "artifact.col.assetName", type: "text" },
      { key: "category", labelKey: "artifact.col.category", type: "select", options: ["Hardware", "Software", "Cloud Service", "Data"] },
      { key: "owner", labelKey: "artifact.col.owner", type: "text" },
      { key: "criticality", labelKey: "artifact.col.criticality", type: "select", options: ["Low", "Medium", "High", "Critical"] },
      { key: "notes", labelKey: "artifact.col.notes", type: "text" },
    ],
  },
  training_register: {
    type: "training_register",
    titleKey: "artifact.title.training_register",
    descKey: "artifact.desc.training_register",
    columns: [
      { key: "employee", labelKey: "artifact.col.employee", type: "text" },
      { key: "training", labelKey: "artifact.col.trainingTopic", type: "text" },
      { key: "completedDate", labelKey: "artifact.col.completedOn", type: "date" },
      { key: "nextDue", labelKey: "artifact.col.nextDue", type: "date" },
    ],
  },
  incident_register: {
    type: "incident_register",
    titleKey: "artifact.title.incident_register",
    descKey: "artifact.desc.incident_register",
    columns: [
      { key: "date", labelKey: "artifact.col.date", type: "date" },
      { key: "description", labelKey: "artifact.col.description", type: "text" },
      { key: "severity", labelKey: "artifact.col.severity", type: "select", options: ["Low", "Medium", "High", "Critical"] },
      { key: "affectedSystems", labelKey: "artifact.col.affectedSystems", type: "text" },
      { key: "reportedBy", labelKey: "artifact.col.reportedBy", type: "text" },
      { key: "status", labelKey: "artifact.col.status", type: "select", options: ["Open", "In Progress", "Resolved"] },
      { key: "resolutionDate", labelKey: "artifact.col.resolutionDate", type: "date" },
    ],
  },
  access_register: {
    type: "access_register",
    titleKey: "artifact.title.access_register",
    descKey: "artifact.desc.access_register",
    columns: [
      { key: "user", labelKey: "artifact.col.employeeUser", type: "text" },
      { key: "system", labelKey: "artifact.col.systemResource", type: "text" },
      { key: "accessLevel", labelKey: "artifact.col.accessLevel", type: "text" },
      { key: "grantedDate", labelKey: "artifact.col.grantedDate", type: "date" },
      { key: "grantedBy", labelKey: "artifact.col.grantedBy", type: "text" },
      { key: "lastReviewed", labelKey: "artifact.col.lastReviewed", type: "date" },
      { key: "revokedDate", labelKey: "artifact.col.revokedDate", type: "date" },
    ],
  },
  rights_request_register: {
    type: "rights_request_register",
    titleKey: "artifact.title.rights_request_register",
    descKey: "artifact.desc.rights_request_register",
    columns: [
      { key: "dateReceived", labelKey: "artifact.col.dateReceived", type: "date" },
      { key: "requester", labelKey: "artifact.col.requester", type: "text" },
      { key: "requestType", labelKey: "artifact.col.requestType", type: "select", options: ["Access", "Rectification", "Erasure", "Portability", "Objection"] },
      { key: "status", labelKey: "artifact.col.status", type: "select", options: ["Open", "In Progress", "Completed", "Denied"] },
      { key: "responseDate", labelKey: "artifact.col.responseDate", type: "date" },
      { key: "notes", labelKey: "artifact.col.notes", type: "text" },
    ],
  },
  third_party_register: {
    type: "third_party_register",
    titleKey: "artifact.title.third_party_register",
    descKey: "artifact.desc.third_party_register",
    columns: [
      { key: "vendor", labelKey: "artifact.col.vendorName", type: "text" },
      { key: "service", labelKey: "artifact.col.serviceProvided", type: "text" },
      { key: "dataAccess", labelKey: "artifact.col.dataAccessLevel", type: "select", options: ["None", "Limited", "Full"] },
      { key: "contractDate", labelKey: "artifact.col.contractDate", type: "date" },
      { key: "dpaSigned", labelKey: "artifact.col.dpaSigned", type: "select", options: ["Yes", "No"] },
      { key: "lastReviewed", labelKey: "artifact.col.lastReviewed", type: "date" },
    ],
  },
};

// English fallback labels for document generators (PDF/Word/export) that render
// outside the React tree and don't have access to the language context.
export const ARTIFACT_TITLES_EN: Record<ArtifactType, string> = {
  backup_register: "Backup Register",
  asset_inventory: "Asset Inventory",
  training_register: "Security Training Register",
  incident_register: "Incident Register",
  access_register: "Access Register",
  rights_request_register: "Data Subject Rights Requests Register",
  third_party_register: "Third-Party / Vendor Register",
};

export const ARTIFACT_ORDER: ArtifactType[] = [
  "backup_register",
  "asset_inventory",
  "training_register",
  "incident_register",
  "access_register",
  "rights_request_register",
  "third_party_register",
];
