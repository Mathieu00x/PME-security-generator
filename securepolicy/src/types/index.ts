import { SSLResult } from "@/lib/scanners/ssl";
import { HIBPResult } from "@/lib/scanners/hibp";
import { SubdomainsResult } from "@/lib/scanners/subdomains";
import { DNSResult } from "@/lib/scanners/dns";

export type PolicyType =
  | "password"
  | "backup"
  | "incident-response"
  | "acceptable-use"
  | "remote-work";

export interface Client {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AccountSettings {
  user_id: string;
  brand_name?: string;
  brand_color?: string;
  brand_logo_url?: string;
  updated_at?: string;
}

export interface CompanyProfile {
  id?: string;
  client_id?: string;
  user_id?: string;
  company_name: string;
  industry: string;
  employee_count: string;
  country: string;
  province: string;
  phone: string;
  email: string;
  website?: string;
  remote_work: boolean;
  cloud_services: string;
  uses_microsoft_365: boolean;
  uses_google_workspace: boolean;
  mfa_enabled: boolean;
  has_backups: boolean;
  has_it_department: boolean;
  uses_personal_devices: boolean;
}

export interface Policy {
  id: string;
  user_id: string;
  client_id?: string;
  title: string;
  type: PolicyType;
  content: string;
  status: "completed" | "draft";
  version: string;
  version_number: number;
  answers?: Record<string, string>;
  generation_reason?: string;
  security_score?: SecurityScore;
  framework_versions?: Record<string, string>;
  share_enabled?: boolean;
  share_token?: string;
  created_at: string;
  updated_at: string;
}

export type ChangeType = "generated" | "regenerated" | "restored";

export interface PolicyVersion {
  id: string;
  policy_id: string;
  version_number: number;
  title: string;
  content: string;
  security_score?: SecurityScore;
  answers?: Record<string, string>;
  generation_reason?: string;
  framework_versions?: Record<string, string>;
  change_type: ChangeType;
  change_summary?: string;
  created_by?: string;
  created_at: string;
}

export interface ActionItem {
  priority: "high" | "medium" | "low";
  task: string;
  tool?: string;
  estimatedTime?: string;
}

export interface PolicyImportance {
  requestedBy: string[];
  businessValue: string;
}

export interface BestPractices {
  dos: string[];
  donts: string[];
}

export interface PrioritizedRecommendation {
  priority: "high" | "medium" | "low";
  text: string;
}

export interface GapAnalysis {
  compliancePercentage: number;
  missingControlsCount: number;
  missingControls: string[];
  associatedRisk: "Low" | "Medium" | "High";
}

export interface AuditEvidenceReference {
  type: ArtifactType;
  reason: string;
}

export interface SecurityScore {
  securityScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: PrioritizedRecommendation[];
  missingPolicies?: string[];
  riskLevel: "Low" | "Medium" | "High";
  complianceMapping?: {
    NIST?: string[];
    CIS?: string[];
    ISO27001?: string[];
    SOC2?: string[];
    Loi25?: string[];
    RGPD?: string[];
  };
  gapAnalysis?: GapAnalysis;
  executiveSummary?: string;
  auditEvidence?: AuditEvidenceReference[];
  bestPractices?: BestPractices;
  actionItems?: ActionItem[];
  policyImportance?: PolicyImportance;
  maturityLevel?: "Basic" | "Developing" | "Defined" | "Advanced";
}

export interface PolicyQuestionnaire {
  [key: string]: string | boolean;
}

export type ArtifactType =
  | "backup_register"
  | "asset_inventory"
  | "training_register"
  | "incident_register"
  | "access_register"
  | "rights_request_register"
  | "third_party_register";

export interface ArtifactRow {
  id: string;
  [key: string]: string;
}

export interface AuditArtifact {
  id: string;
  user_id: string;
  client_id?: string;
  type: ArtifactType;
  items: ArtifactRow[];
  created_at: string;
  updated_at: string;
}

export type IntegrationProvider = "notion" | "confluence";

export interface NotionIntegrationConfig {
  token: string;
  parentPageId: string;
}

export interface ConfluenceIntegrationConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  spaceKey: string;
}

export interface Integration {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  config: NotionIntegrationConfig | ConfluenceIntegrationConfig;
  created_at: string;
  updated_at: string;
}

export interface Branding {
  name: string;
  color: string;
  logoUrl?: string;
}

export type NotificationType = "framework_outdated" | "gap_risk";

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  dedupe_key: string;
  read: boolean;
  created_at: string;
}

export interface ScanFinding {
  severity: "high" | "medium" | "low";
  category: string;
  message: string;
}

export interface AttackSurfaceReport {
  id: string;
  user_id: string;
  client_id?: string;
  domain: string;
  created_at: string;
  risk_score: number;
  ssl: SSLResult;
  emails_compromis: HIBPResult;
  subdomains: SubdomainsResult;
  dns: DNSResult;
  findings: ScanFinding[];
  recommended_policies: PolicyType[];
}

export interface Framework {
  id: string;
  name: string;
  current_version: string;
  changelog?: string;
  updated_at: string;
}

export type PlanFeature =
  | "branding"
  | "versioning"
  | "confluence_notion"
  | "white_label"
  | "multi_user"
  | "priority_support";

export type PlanId = "starter" | "pro" | "agency" | "beta";

export interface Plan {
  id: PlanId;
  name: string;
  monthly_price_cents: number;
  annual_price_cents: number;
  client_limit: number | null;
  features: PlanFeature[];
  is_public: boolean;
  beta_cutoff_at: string | null;
  sort_order: number;
}

export type BillingInterval = "monthly" | "annual";
export type SubscriptionStatus = "active" | "canceled" | "expired";

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: PlanId;
  billing_interval: BillingInterval;
  status: SubscriptionStatus;
  beta_expires_at?: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  created_at: string;
  updated_at: string;
}
