import { ArtifactType } from "@/types";

export interface ArtifactColumn {
  key: string;
  label: string;
  type: "text" | "date" | "select";
  options?: string[];
}

export interface ArtifactDefinition {
  type: ArtifactType;
  title: string;
  description: string;
  columns: ArtifactColumn[];
}

export const ARTIFACT_DEFINITIONS: Record<ArtifactType, ArtifactDefinition> = {
  backup_register: {
    type: "backup_register",
    title: "Backup Register",
    description: "Evidence of what data is backed up, how often, and where — required by most auditors and cyber insurers.",
    columns: [
      { key: "system", label: "System / Data", type: "text" },
      { key: "frequency", label: "Frequency", type: "select", options: ["Real-time", "Daily", "Weekly", "Monthly"] },
      { key: "location", label: "Storage Location", type: "text" },
      { key: "retention", label: "Retention Period", type: "text" },
      { key: "encrypted", label: "Encrypted", type: "select", options: ["Yes", "No"] },
      { key: "lastTested", label: "Last Restore Test", type: "date" },
    ],
  },
  asset_inventory: {
    type: "asset_inventory",
    title: "Asset Inventory",
    description: "A register of hardware, software, and cloud assets that store or process company data.",
    columns: [
      { key: "name", label: "Asset Name", type: "text" },
      { key: "category", label: "Category", type: "select", options: ["Hardware", "Software", "Cloud Service", "Data"] },
      { key: "owner", label: "Owner", type: "text" },
      { key: "criticality", label: "Criticality", type: "select", options: ["Low", "Medium", "High", "Critical"] },
      { key: "notes", label: "Notes", type: "text" },
    ],
  },
  training_register: {
    type: "training_register",
    title: "Security Training Register",
    description: "Proof that employees completed security awareness training — commonly requested during audits.",
    columns: [
      { key: "employee", label: "Employee", type: "text" },
      { key: "training", label: "Training / Topic", type: "text" },
      { key: "completedDate", label: "Completed On", type: "date" },
      { key: "nextDue", label: "Next Due", type: "date" },
    ],
  },
  incident_register: {
    type: "incident_register",
    title: "Incident Register",
    description: "Log of security incidents, their severity, and resolution — required by most incident response and breach-notification obligations.",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "description", label: "Description", type: "text" },
      { key: "severity", label: "Severity", type: "select", options: ["Low", "Medium", "High", "Critical"] },
      { key: "affectedSystems", label: "Affected Systems", type: "text" },
      { key: "reportedBy", label: "Reported By", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["Open", "In Progress", "Resolved"] },
      { key: "resolutionDate", label: "Resolution Date", type: "date" },
    ],
  },
  access_register: {
    type: "access_register",
    title: "Access Register",
    description: "Record of who has access to which systems and why — evidence that access is granted, reviewed, and revoked deliberately.",
    columns: [
      { key: "user", label: "Employee / User", type: "text" },
      { key: "system", label: "System / Resource", type: "text" },
      { key: "accessLevel", label: "Access Level", type: "text" },
      { key: "grantedDate", label: "Granted Date", type: "date" },
      { key: "grantedBy", label: "Granted By", type: "text" },
      { key: "lastReviewed", label: "Last Reviewed", type: "date" },
      { key: "revokedDate", label: "Revoked Date", type: "date" },
    ],
  },
  rights_request_register: {
    type: "rights_request_register",
    title: "Data Subject Rights Requests Register",
    description: "Log of access, rectification, erasure, and portability requests — evidence of compliance with Law 25 / GDPR data subject rights obligations.",
    columns: [
      { key: "dateReceived", label: "Date Received", type: "date" },
      { key: "requester", label: "Requester", type: "text" },
      { key: "requestType", label: "Request Type", type: "select", options: ["Access", "Rectification", "Erasure", "Portability", "Objection"] },
      { key: "status", label: "Status", type: "select", options: ["Open", "In Progress", "Completed", "Denied"] },
      { key: "responseDate", label: "Response Date", type: "date" },
      { key: "notes", label: "Notes", type: "text" },
    ],
  },
  third_party_register: {
    type: "third_party_register",
    title: "Third-Party / Vendor Register",
    description: "Inventory of vendors and service providers that access or process company data, and their contractual safeguards.",
    columns: [
      { key: "vendor", label: "Vendor Name", type: "text" },
      { key: "service", label: "Service Provided", type: "text" },
      { key: "dataAccess", label: "Data Access Level", type: "select", options: ["None", "Limited", "Full"] },
      { key: "contractDate", label: "Contract Date", type: "date" },
      { key: "dpaSigned", label: "DPA Signed", type: "select", options: ["Yes", "No"] },
      { key: "lastReviewed", label: "Last Reviewed", type: "date" },
    ],
  },
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
