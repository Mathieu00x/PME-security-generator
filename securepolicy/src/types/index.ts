import { SSLResult } from "@/lib/scanners/ssl";
import { HIBPResult } from "@/lib/scanners/hibp";
import { SubdomainsResult } from "@/lib/scanners/subdomains";
import { DNSResult } from "@/lib/scanners/dns";
import { SecurityHeadersResult } from "@/lib/scanners/headers";

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

export interface ScoreBreakdown {
  ssl: number;
  dnsEmail: number;
  // null when the underlying check itself failed — dataExposure is null
  // when HIBP errors (e.g. the domain isn't verified in HIBP's dashboard,
  // which is true for virtually every third-party domain scanned), headers
  // is null when the headers fetch fails. Excluded from risk_score rather
  // than defaulting to a false "all clear" 25/25.
  dataExposure: number | null;
  headers: number | null;
}

export interface AttackSurfaceReport {
  id: string;
  user_id: string;
  client_id?: string;
  domain: string;
  created_at: string;
  risk_score: number;
  score_breakdown?: ScoreBreakdown;
  ssl: SSLResult;
  emails_compromis: HIBPResult;
  subdomains: SubdomainsResult;
  dns: DNSResult;
  security_headers: SecurityHeadersResult;
  findings: ScanFinding[];
  recommended_policies: PolicyType[];
  executive_summary?: string;
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

// ============================================================
// Knowledge Base + remediation tasks (finding-to-action pipeline)
// ============================================================

export type KBCategory = "email_security" | "tls" | "headers" | "exposure" | "subdomain" | "governance";
export type KBSeverity = "critical" | "high" | "medium" | "low";
export type KBPhase = 1 | 2 | 3;

export type FindingKey =
  | "dmarc_missing"
  | "spf_missing"
  | "dkim_not_detected"
  | "ssl_expired"
  | "ssl_weak_protocol"
  | "hsts_missing"
  | "csp_missing"
  | "hibp_breach_detected"
  | "subdomain_takeover_risk";

export interface KBControl {
  id: string;
  code: string;
  finding_key: string;
  category: KBCategory;
  severity: KBSeverity;
  phase: KBPhase;
  title_fr: string;
  title_en: string;
  why_it_matters_fr: string | null;
  why_it_matters_en: string | null;
  business_impact_fr: string | null;
  business_impact_en: string | null;
  remediation_steps_fr: string[];
  remediation_steps_en: string[];
  evidence_required_fr: string[];
  evidence_required_en: string[];
  nist_csf: string[];
  cis_controls: string[];
  iso_27001: string[];
  loi_25: string[];
  pipeda: string[];
  soc2: string[];
  created_at: string;
}

export interface FrameworkMappings {
  nist_csf: string[];
  cis_controls: string[];
  iso_27001: string[];
  loi_25: string[];
  pipeda: string[];
  soc2: string[];
}

export type RemediationStatus = "open" | "in_progress" | "completed" | "verified";
export type RemediationSource = "scan" | "assessment";

export interface RemediationTask {
  id: string;
  user_id: string;
  client_id: string;
  scan_id: string | null;
  control_code: string | null;
  source: RemediationSource;
  source_question_id: string | null;
  finding_key: string | null;
  category: KBCategory;
  severity: KBSeverity;
  phase: KBPhase;
  title_fr: string;
  title_en: string;
  why_it_matters_fr: string | null;
  why_it_matters_en: string | null;
  business_impact_fr: string | null;
  business_impact_en: string | null;
  remediation_steps_fr: string[];
  remediation_steps_en: string[];
  evidence_required_fr: string[];
  evidence_required_en: string[];
  framework_mappings: FrameworkMappings;
  owner_name: string | null;
  owner_email: string | null;
  due_date: string | null;
  status: RemediationStatus;
  evidence_notes: string | null;
  evidence_url: string | null;
  ai_context: string | null;
  completed_at: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Compliance assessments (Loi 25 / PIPEDA readiness)
// ============================================================

export type AnswerValue = "yes" | "partial" | "no" | "na";

export interface AssessmentAnswer {
  value: AnswerValue;
  notes?: string;
  evidence_url?: string;
}

export interface AssessmentSectionScore {
  score: number;
  total: number;
  pct: number;
}

export type ComplianceFramework = "loi25" | "pipeda";

export interface ComplianceAssessment {
  id: string;
  user_id: string;
  client_id: string;
  framework: ComplianceFramework;
  answers: Record<string, AssessmentAnswer>;
  scores: Record<string, AssessmentSectionScore> | null;
  overall_score: number | null;
  status: "in_progress" | "completed";
  version: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Reference data for "why am I being asked this?" + official source, shown
// next to each Loi 25 / PIPEDA question. requirement_key matches the
// `${framework}:${question.id}` format already used for remediation_tasks'
// source_question_id. review_status defaults to "pending_review" — nothing
// here should be presented as legally authoritative until a qualified privacy
// professional has signed off (reviewed_by / last_reviewed_at set).
export interface ComplianceRequirement {
  id: string;
  framework: ComplianceFramework;
  framework_version: string | null;
  requirement_key: string;
  title_fr: string;
  title_en: string;
  description_fr: string | null;
  description_en: string | null;
  source_reference: string | null;
  source_url: string | null;
  effective_date: string | null;
  review_status: "pending_review" | "reviewed";
  last_reviewed_at: string | null;
  reviewed_by: string | null;
  weight: number | null;
  created_at: string;
}
