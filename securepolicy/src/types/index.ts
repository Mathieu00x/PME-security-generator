export type PolicyType =
  | "password"
  | "backup"
  | "incident-response"
  | "acceptable-use"
  | "remote-work";

export interface CompanyProfile {
  id?: string;
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
  title: string;
  type: PolicyType;
  content: string;
  status: "completed" | "draft";
  version: string;
  security_score?: SecurityScore;
  created_at: string;
  updated_at: string;
}

export interface ActionItem {
  priority: "high" | "medium" | "low";
  task: string;
  tool?: string;
}

export interface BestPractices {
  dos: string[];
  donts: string[];
}

export interface SecurityScore {
  securityScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  missingPolicies?: string[];
  riskLevel: "Low" | "Medium" | "High";
  complianceMapping?: {
    NIST?: string[];
    CIS?: string[];
    ISO27001?: string[];
  };
  bestPractices?: BestPractices;
  actionItems?: ActionItem[];
}

export interface PolicyQuestionnaire {
  [key: string]: string | boolean;
}
