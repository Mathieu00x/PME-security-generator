import { CompanyProfile, PolicyType } from "@/types";

export const SYSTEM_PROMPT = `You are a senior cybersecurity consultant with more than 20 years of experience helping small and medium-sized businesses improve their security posture.

You specialize in creating professional cybersecurity policies aligned with industry best practices such as:
• NIST Cybersecurity Framework
• CIS Controls
• ISO 27001
• SOC 2

Your task is to produce professional documents that can be immediately adopted by a business.
Write in clear business English.
Avoid unnecessary technical jargon.
Never invent technologies that the company does not use.
Every recommendation must be practical for a small or medium business.
The document must be structured using numbered headings and subheadings.
Output only the document content.`;

export const STYLE_PROMPT = `Write like a Big Four cybersecurity consultant.
The document should be formal, concise, easy to read, and immediately usable by executives.
Avoid filler sentences.
Avoid repeating ideas.
Use numbered headings.
Use bullet lists when appropriate.
Use professional business language.`;

export function buildCompanyContext(profile: CompanyProfile): string {
  return `Company Information
Company Name: ${profile.company_name}
Industry: ${profile.industry}
Country: ${profile.country}
Province/State: ${profile.province}
Employees: ${profile.employee_count}
Remote Work: ${profile.remote_work ? "Yes" : "No"}
Cloud Services: ${profile.cloud_services || "None"}
Microsoft 365: ${profile.uses_microsoft_365 ? "Yes" : "No"}
Google Workspace: ${profile.uses_google_workspace ? "Yes" : "No"}
MFA Enabled: ${profile.mfa_enabled ? "Yes" : "No"}
Backups in Place: ${profile.has_backups ? "Yes" : "No"}
IT Department/MSP: ${profile.has_it_department ? "Yes" : "No"}
Uses Personal Devices: ${profile.uses_personal_devices ? "Yes" : "No"}`;
}

export function buildQuestionnaireContext(
  answers: Record<string, string>,
  generationReason?: string
): string {
  const reasonLine = generationReason
    ? `Generation Purpose: ${generationReason}\n`
    : "";
  return (
    "Questionnaire Answers\n" +
    reasonLine +
    Object.entries(answers)
      .filter(([k]) => k !== "_generationReason")
      .map(([q, a]) => `${q}: ${a}`)
      .join("\n")
  );
}

export const GENERATION_REASONS = [
  { value: "audit", labelKey: "genReason.audit" },
  { value: "insurance", labelKey: "genReason.insurance" },
  { value: "client", labelKey: "genReason.client" },
  { value: "certification", labelKey: "genReason.certification" },
  { value: "internal", labelKey: "genReason.internal" },
];

export const POLICY_TEMPLATES: Record<PolicyType, string> = {
  password: `Create a professional Password Policy using the following sections:
1. Executive Summary
2. Purpose
3. Scope
4. Definitions
5. Password Requirements
6. Password Complexity
7. Password Expiration
8. Password Storage
9. Multi-Factor Authentication
10. Password Managers
11. Account Lockout
12. Responsibilities
13. Exceptions
14. Policy Review
15. Approval`,

  backup: `Create a professional Backup and Data Recovery Policy using the following sections:
1. Executive Summary
2. Purpose
3. Scope
4. Definitions
5. Backup Requirements
6. Backup Schedule and Frequency
7. Backup Storage and Retention
8. Offsite and Cloud Backup
9. Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)
10. Backup Testing and Verification
11. Roles and Responsibilities
12. Incident Response Integration
13. Exceptions
14. Policy Review
15. Approval`,

  "incident-response": `Create a professional Incident Response Plan using the following sections:
1. Executive Summary
2. Purpose
3. Scope
4. Definitions
5. Incident Classification
6. Incident Response Team
7. Detection and Identification
8. Containment
9. Eradication and Recovery
10. Post-Incident Analysis
11. Communication Plan
12. Documentation and Reporting
13. Training and Awareness
14. Exceptions
15. Policy Review
16. Approval`,

  "acceptable-use": `Create a professional Acceptable Use Policy using the following sections:
1. Executive Summary
2. Purpose
3. Scope
4. Definitions
5. Acceptable Use of Company Resources
6. Prohibited Activities
7. Internet and Email Usage
8. Social Media Policy
9. Personal Device Usage (BYOD)
10. Software and Licensing
11. Data Handling and Confidentiality
12. Monitoring and Privacy
13. Violations and Consequences
14. Exceptions
15. Policy Review
16. Approval`,

  "remote-work": `Create a professional Remote Work Security Policy using the following sections:
1. Executive Summary
2. Purpose
3. Scope
4. Definitions
5. Eligibility and Authorization
6. Secure Remote Access (VPN)
7. Device Security Requirements
8. Home Network Security
9. Data Protection and Handling
10. Physical Security
11. Communication and Collaboration Tools
12. Incident Reporting
13. Roles and Responsibilities
14. Exceptions
15. Policy Review
16. Approval`,
};

export const JSON_OUTPUT_PROMPT = `
After generating the document, on a new line write exactly "---JSON---" and then return a valid JSON object with this structure:
{
  "documentInfo": {
    "title": "string",
    "version": "1.0",
    "classification": "Confidential | Internal | Public",
    "reviewDate": "string (one year from today)",
    "owner": "string",
    "approvalRequired": "CEO / Board of Directors",
    "estimatedSecurityMaturity": "Basic | Developing | Defined | Advanced",
    "keywords": ["string"]
  },
  "securityScore": number (0-100),
  "maturityLevel": "Basic | Developing | Defined | Advanced",
  "executiveSummary": "2-3 sentence plain-language summary of this policy's purpose and business impact, written for a non-technical executive or client — no jargon",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": [
    {
      "priority": "high | medium | low",
      "text": "A strategic recommendation (distinct from the concrete actionItems below)"
    }
  ],
  "missingPolicies": ["string"],
  "riskLevel": "Low | Medium | High",
  "complianceMapping": {
    "NIST": ["relevant NIST CSF subcategory ID + short control title this policy addresses, e.g. 'PR.AC-1 — Identity and Credential Management'"],
    "CIS": ["relevant CIS Control ID + short control title this policy addresses, e.g. 'CIS Control 5 — Account Management'"],
    "ISO27001": ["relevant ISO 27001 clause reference + short control title, e.g. 'A.5.17 — Authentication Information'"],
    "SOC2": ["relevant SOC 2 Trust Service Criteria + short control title, e.g. 'CC6.1 — Logical Access Controls'"],
    "Loi25": ["relevant Loi 25 / Law 25 Quebec provisions if applicable, e.g. 'Art. 12 — Consent'"],
    "RGPD": ["relevant GDPR articles if applicable, e.g. 'Art. 32 — Security of Processing'"]
  },
  "gapAnalysis": {
    "compliancePercentage": number (0-100, current compliance level for this policy area based on the questionnaire answers),
    "missingControlsCount": number (count of missingControls below),
    "missingControls": ["short name of a specific control that is not yet in place, e.g. 'Password manager enforcement', 'FIDO2 / hardware security keys'"],
    "associatedRisk": "Low | Medium | High"
  },
  "auditEvidence": [
    {
      "type": "one of: backup_register | asset_inventory | training_register | incident_register | access_register | rights_request_register | third_party_register",
      "reason": "One sentence explaining why this specific policy requires this register as audit evidence"
    }
  ],
  "bestPractices": {
    "dos": ["3-5 concrete best practices to follow for this policy type, specific and actionable"],
    "donts": ["3-5 common mistakes to avoid, specific and actionable"]
  },
  "actionItems": [
    {
      "priority": "high | medium | low",
      "task": "Specific action the company should take based on their questionnaire answers",
      "estimatedTime": "e.g. 20 minutes | 1 hour | 1 day",
      "tool": "Optional: recommended free or affordable tool (e.g. Bitwarden, Backblaze, Authy)"
    }
  ],
  "policyImportance": {
    "requestedBy": ["list of stakeholders who commonly require this policy, e.g. 'Cyber insurer', 'Enterprise clients', 'External auditor', 'ISO certification body', 'Board of directors'"],
    "businessValue": "One sentence explaining the concrete business value of having this policy in place"
  }
}

Generate 5-8 actionItems tailored to the company's actual situation from the questionnaire. Prioritize based on risk. Include a tool recommendation when a specific affordable tool exists. Always include estimatedTime for each action.
Generate 3-6 recommendations, each with its own priority. Recommendations are strategic (what to improve and why); actionItems are concrete (what to do, with a tool and time estimate) — do not duplicate the same point in both.
The gapAnalysis must be internally consistent: missingControlsCount must equal the length of missingControls, and a higher missingControlsCount / lower compliancePercentage should correspond to a higher associatedRisk.
Select 2-4 auditEvidence registers that are genuinely relevant to THIS policy type from the fixed list above only — do not invent new register names. For example a Password Policy typically needs access_register; an Incident Response Plan needs incident_register; a policy touching personal data may need rights_request_register; a policy involving vendors/cloud providers needs third_party_register.`;

export const POLICY_QUESTIONS: Record<
  PolicyType,
  Array<{ id: string; question: string; type: "radio" | "text" | "select"; options?: string[] }>
> = {
  password: [
    {
      id: "mfa_required",
      question: "Is MFA (Multi-Factor Authentication) required for all users?",
      type: "radio",
      options: ["Yes", "No"],
    },
    {
      id: "min_password_length",
      question: "What is the minimum password length?",
      type: "select",
      options: ["8 characters", "10 characters", "12 characters", "14 characters", "16 characters"],
    },
    {
      id: "password_expiration",
      question: "How often do passwords expire?",
      type: "select",
      options: ["90 days", "180 days", "365 days", "Never"],
    },
    {
      id: "password_manager",
      question: "Does your company use a password manager?",
      type: "radio",
      options: ["Yes", "No"],
    },
    {
      id: "password_manager_name",
      question: "Which password manager? (e.g. Bitwarden, 1Password, LastPass)",
      type: "text",
    },
    {
      id: "shared_accounts",
      question: "Do any employees share accounts or login credentials?",
      type: "radio",
      options: ["Yes", "No"],
    },
    {
      id: "account_lockout",
      question: "After how many failed attempts is an account locked?",
      type: "select",
      options: ["3 attempts", "5 attempts", "10 attempts", "No lockout policy"],
    },
  ],
  backup: [
    {
      id: "backup_frequency",
      question: "How often are backups performed?",
      type: "select",
      options: ["Daily", "Weekly", "Monthly", "Real-time"],
    },
    {
      id: "backup_location",
      question: "Where are backups stored?",
      type: "select",
      options: ["Cloud only", "On-site only", "Both cloud and on-site", "External drives"],
    },
    {
      id: "backup_testing",
      question: "How often are backups tested/verified?",
      type: "select",
      options: ["Monthly", "Quarterly", "Annually", "Never"],
    },
    {
      id: "retention_period",
      question: "How long are backups retained?",
      type: "select",
      options: ["30 days", "90 days", "1 year", "3 years", "7 years"],
    },
    {
      id: "rto",
      question: "What is your target Recovery Time Objective (RTO)?",
      type: "select",
      options: ["1 hour", "4 hours", "24 hours", "72 hours", "Not defined"],
    },
    {
      id: "backup_encryption",
      question: "Are backups encrypted?",
      type: "radio",
      options: ["Yes", "No", "Not sure"],
    },
  ],
  "incident-response": [
    {
      id: "ir_team",
      question: "Do you have a dedicated incident response team or contact?",
      type: "radio",
      options: ["Yes", "No — we rely on our MSP", "No"],
    },
    {
      id: "incident_classification",
      question: "Do you currently classify incidents by severity?",
      type: "radio",
      options: ["Yes", "No"],
    },
    {
      id: "notification_time",
      question: "How quickly must a security incident be reported internally?",
      type: "select",
      options: ["1 hour", "4 hours", "24 hours", "72 hours"],
    },
    {
      id: "cyber_insurance",
      question: "Do you have cyber liability insurance?",
      type: "radio",
      options: ["Yes", "No", "In progress"],
    },
    {
      id: "communication_plan",
      question: "Do you have an existing communication plan for security incidents?",
      type: "radio",
      options: ["Yes", "No"],
    },
    {
      id: "previous_incidents",
      question: "Has your company experienced a security incident in the past 2 years?",
      type: "radio",
      options: ["Yes", "No", "Prefer not to say"],
    },
  ],
  "acceptable-use": [
    {
      id: "byod",
      question: "Do employees use personal devices for work (BYOD)?",
      type: "radio",
      options: ["Yes", "No", "Some employees"],
    },
    {
      id: "social_media",
      question: "Do employees use social media on company devices?",
      type: "radio",
      options: ["Yes", "No", "Not monitored"],
    },
    {
      id: "monitoring",
      question: "Does the company monitor employee device/internet usage?",
      type: "radio",
      options: ["Yes", "No", "Partially"],
    },
    {
      id: "software_installation",
      question: "Can employees install software on their own?",
      type: "radio",
      options: ["Yes", "No — IT approval required", "Some employees"],
    },
    {
      id: "confidential_data",
      question: "Do employees handle confidential client or patient data?",
      type: "radio",
      options: ["Yes", "No"],
    },
  ],
  "remote-work": [
    {
      id: "vpn",
      question: "Is VPN required for remote access?",
      type: "radio",
      options: ["Yes", "No", "Recommended but not required"],
    },
    {
      id: "company_devices",
      question: "Do remote employees use company-issued devices?",
      type: "radio",
      options: ["Yes", "No — personal devices", "Mix of both"],
    },
    {
      id: "home_network",
      question: "Are employees required to secure their home Wi-Fi?",
      type: "radio",
      options: ["Yes", "No", "Guidance is provided"],
    },
    {
      id: "remote_collaboration",
      question: "Which collaboration tools are used remotely?",
      type: "text",
    },
    {
      id: "screen_lock",
      question: "Is automatic screen lock required on remote devices?",
      type: "radio",
      options: ["Yes", "No"],
    },
    {
      id: "remote_printing",
      question: "Are employees allowed to print confidential documents at home?",
      type: "radio",
      options: ["Yes", "No", "With approval only"],
    },
  ],
};
