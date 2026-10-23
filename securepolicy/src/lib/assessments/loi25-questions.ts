import { KBSeverity, KBPhase, ComplianceFramework } from "@/types";

export interface AssessmentQuestion {
  id: string;
  text_fr: string;
  text_en: string;
  help_fr: string;
  help_en: string;
  type: "yes_no_partial" | "yes_no_partial_na";
  evidence_example_fr?: string;
  evidence_example_en?: string;
  // References to legal articles / principles, used as the framework mapping
  // when this question becomes a remediation_tasks row via generate-actions.
  kb_references: string[];
  severity: KBSeverity;
  phase: KBPhase;
}

export interface AssessmentSection {
  id: string;
  title_fr: string;
  title_en: string;
  weight: number;
  questions: AssessmentQuestion[];
}

export interface AssessmentQuestionnaire {
  framework: ComplianceFramework;
  name_fr: string;
  name_en: string;
  description_fr: string;
  description_en: string;
  sections: AssessmentSection[];
}

export const loi25Questions: AssessmentQuestionnaire = {
  framework: "loi25",
  name_fr: "Évaluation Loi 25",
  name_en: "Law 25 Assessment",
  description_fr:
    "Évaluation de l'alignement avec la Loi 25 sur la protection des renseignements personnels au Québec. Ce questionnaire couvre les principales obligations. Il ne constitue pas un avis juridique — consultez un professionnel pour validation.",
  description_en:
    "Assessment of alignment with Quebec's Law 25 on the protection of personal information. This questionnaire covers the main obligations. It does not constitute legal advice — consult a professional for validation.",
  sections: [
    {
      id: "gouvernance",
      title_fr: "Gouvernance",
      title_en: "Governance",
      weight: 20,
      questions: [
        {
          id: "rprp_designe",
          text_fr: "Un responsable de la protection des renseignements personnels (RPRP) a-t-il été désigné ?",
          text_en: "Has a Privacy Officer (RPRP) been designated?",
          help_fr:
            "La Loi 25 exige la désignation d'une personne responsable de la protection des renseignements personnels. Le nom et coordonnées de cette personne doivent être publiés.",
          help_en:
            "Law 25 requires designating a person responsible for personal information protection. Their name and contact must be published.",
          type: "yes_no_partial",
          evidence_example_fr: "Politique interne ou annonce désignant le RPRP, coordonnées publiées sur le site web",
          evidence_example_en: "Internal policy or announcement designating the RPRP, contact details published on the website",
          kb_references: ["loi25-art-3.1"],
          severity: "high",
          phase: 1,
        },
        {
          id: "politiques_publiees",
          text_fr: "Une politique de confidentialité accessible au public est-elle en place ?",
          text_en: "Is a publicly accessible privacy policy in place?",
          help_fr:
            "Une politique de confidentialité doit expliquer comment les renseignements personnels sont collectés, utilisés, divulgués et conservés.",
          help_en: "A privacy policy must explain how personal information is collected, used, disclosed and retained.",
          type: "yes_no_partial",
          evidence_example_fr: "URL de la politique de confidentialité sur le site web",
          evidence_example_en: "URL of the privacy policy on the website",
          kb_references: ["loi25-art-8"],
          severity: "medium",
          phase: 1,
        },
        {
          id: "inventaire_rp",
          text_fr: "Un registre ou inventaire des renseignements personnels détenus est-il maintenu ?",
          text_en: "Is a register or inventory of personal information held being maintained?",
          help_fr:
            "L'organisation devrait documenter quels renseignements personnels sont collectés, dans quel but, par qui et où ils sont conservés.",
          help_en: "The organization should document what personal information is collected, for what purpose, by whom and where it is stored.",
          type: "yes_no_partial",
          evidence_example_fr: "Document ou tableau listant les catégories de renseignements, finalités, durées de conservation",
          evidence_example_en: "Document or spreadsheet listing information categories, purposes, retention periods",
          kb_references: [],
          severity: "medium",
          phase: 1,
        },
      ],
    },
    {
      id: "incidents",
      title_fr: "Incidents de confidentialité",
      title_en: "Privacy Incidents",
      weight: 20,
      questions: [
        {
          id: "processus_incidents",
          text_fr: "Un processus de gestion des incidents de confidentialité est-il documenté ?",
          text_en: "Is a privacy incident management process documented?",
          help_fr:
            "Un incident de confidentialité est tout accès, utilisation ou communication non autorisé de renseignements personnels, ou perte de contrôle sur ceux-ci. Un processus de réponse doit être en place.",
          help_en:
            "A privacy incident is any unauthorized access, use or disclosure of personal information, or loss of control. A response process must be in place.",
          type: "yes_no_partial",
          evidence_example_fr: "Politique ou procédure de gestion des incidents de confidentialité",
          evidence_example_en: "Privacy incident management policy or procedure",
          kb_references: [],
          severity: "medium",
          phase: 1,
        },
        {
          id: "registre_incidents",
          text_fr: "Un registre des incidents de confidentialité est-il tenu à jour ?",
          text_en: "Is a privacy incident register being maintained?",
          help_fr: "La Loi 25 exige de tenir un registre de tous les incidents de confidentialité, qu'ils soient ou non rapportés à la CAI.",
          help_en: "Law 25 requires maintaining a register of all privacy incidents, whether or not reported to the CAI.",
          type: "yes_no_partial",
          evidence_example_fr: "Registre des incidents (peut être un tableau ou un système de ticketing)",
          evidence_example_en: "Incident register (can be a spreadsheet or a ticketing system)",
          kb_references: [],
          severity: "medium",
          phase: 1,
        },
        {
          id: "notification_cai",
          text_fr: "Le processus de notification à la CAI et aux personnes concernées en cas d'incident sérieux est-il connu ?",
          text_en: "Is the process for notifying the CAI and affected persons for serious incidents known?",
          help_fr:
            "Les incidents présentant un risque de préjudice sérieux doivent être signalés à la CAI et aux personnes concernées dans les meilleurs délais.",
          help_en: "Incidents presenting a risk of serious harm must be reported to the CAI and affected persons as soon as possible.",
          type: "yes_no_partial",
          evidence_example_fr: "Document décrivant les critères et la procédure de notification",
          evidence_example_en: "Document describing the notification criteria and procedure",
          kb_references: [],
          severity: "high",
          phase: 1,
        },
      ],
    },
    {
      id: "conservation",
      title_fr: "Conservation et destruction",
      title_en: "Retention and Destruction",
      weight: 15,
      questions: [
        {
          id: "politique_conservation",
          text_fr: "Une politique de conservation et destruction des renseignements personnels est-elle en place ?",
          text_en: "Is a personal information retention and destruction policy in place?",
          help_fr:
            "Les renseignements personnels ne doivent pas être conservés plus longtemps que nécessaire pour la finalité pour laquelle ils ont été collectés.",
          help_en: "Personal information must not be retained longer than necessary for the purpose for which it was collected.",
          type: "yes_no_partial",
          evidence_example_fr: "Politique de conservation avec durées par catégorie de données",
          evidence_example_en: "Retention policy with durations per data category",
          kb_references: [],
          severity: "medium",
          phase: 2,
        },
        {
          id: "destruction_securisee",
          text_fr: "La destruction des renseignements personnels est-elle effectuée de manière sécurisée ?",
          text_en: "Is personal information destroyed securely?",
          help_fr:
            "La destruction doit être irréversible. Les documents physiques doivent être déchiquetés; les données numériques, supprimées de façon sécurisée.",
          help_en: "Destruction must be irreversible. Physical documents must be shredded; digital data, securely deleted.",
          type: "yes_no_partial",
          evidence_example_fr: "Procédure de destruction sécurisée, contrats avec les fournisseurs de destruction",
          evidence_example_en: "Secure destruction procedure, contracts with destruction vendors",
          kb_references: [],
          severity: "medium",
          phase: 2,
        },
      ],
    },
    {
      id: "efvp",
      title_fr: "ÉFVP (Évaluation des facteurs relatifs à la vie privée)",
      title_en: "Privacy Impact Assessment (PIA)",
      weight: 15,
      questions: [
        {
          id: "efvp_connaissance",
          text_fr: "L'organisation sait-elle quand une ÉFVP est requise ?",
          text_en: "Does the organization know when a PIA is required?",
          help_fr: "Une ÉFVP est requise avant tout projet impliquant des renseignements personnels et avant toute communication de renseignements hors Québec.",
          help_en: "A PIA is required before any project involving personal information and before any communication of information outside Quebec.",
          type: "yes_no_partial",
          evidence_example_fr: "Politique ou procédure indiquant les déclencheurs d'ÉFVP",
          evidence_example_en: "Policy or procedure indicating PIA triggers",
          kb_references: [],
          severity: "medium",
          phase: 2,
        },
        {
          id: "transfert_hors_qc",
          text_fr: "Si des renseignements personnels sont transférés hors Québec, une ÉFVP a-t-elle été réalisée ?",
          text_en: "If personal information is transferred outside Quebec, has a PIA been completed?",
          help_fr: "Tout transfert de renseignements personnels hors du Québec (y compris vers des fournisseurs cloud hors Québec) peut nécessiter une ÉFVP.",
          help_en: "Any transfer of personal information outside Quebec (including to cloud providers outside Quebec) may require a PIA.",
          type: "yes_no_partial_na",
          evidence_example_fr: "Rapport d'ÉFVP ou analyse documentant l'évaluation des risques",
          evidence_example_en: "PIA report or analysis documenting the risk assessment",
          kb_references: [],
          severity: "medium",
          phase: 2,
        },
      ],
    },
    {
      id: "droits",
      title_fr: "Droits des personnes concernées",
      title_en: "Rights of Individuals",
      weight: 15,
      questions: [
        {
          id: "acces_rectification",
          text_fr: "Un processus pour répondre aux demandes d'accès et de rectification est-il en place ?",
          text_en: "Is a process in place to respond to access and rectification requests?",
          help_fr:
            "Les individus ont le droit d'accéder à leurs renseignements personnels et d'en demander la rectification. Un processus doit permettre de traiter ces demandes.",
          help_en: "Individuals have the right to access their personal information and request its rectification. A process must handle these requests.",
          type: "yes_no_partial",
          evidence_example_fr: "Procédure de traitement des demandes d'accès/rectification",
          evidence_example_en: "Access/rectification request handling procedure",
          kb_references: [],
          severity: "medium",
          phase: 2,
        },
        {
          id: "portabilite",
          text_fr: "Le droit à la portabilité des renseignements personnels est-il connu et opérationnel ?",
          text_en: "Is the right to data portability known and operational?",
          help_fr:
            "La Loi 25 prévoit un droit à la portabilité permettant aux individus de recevoir leurs renseignements dans un format technologique structuré et couramment utilisé.",
          help_en: "Law 25 provides a right to portability allowing individuals to receive their information in a structured, commonly used technological format.",
          type: "yes_no_partial",
          evidence_example_fr: "Procédure et capacité technique d'export des données personnelles",
          evidence_example_en: "Procedure and technical capability to export personal data",
          kb_references: [],
          severity: "medium",
          phase: 2,
        },
      ],
    },
    {
      id: "consentement",
      title_fr: "Consentement et collecte",
      title_en: "Consent and Collection",
      weight: 15,
      questions: [
        {
          id: "consentement_valide",
          text_fr: "Le consentement est-il obtenu de façon manifeste, libre et éclairée avant la collecte ?",
          text_en: "Is consent obtained in a manifest, free and informed manner before collection?",
          help_fr:
            "Le consentement doit être explicite pour les renseignements sensibles. Il doit être donné pour des fins spécifiques et le refus ne doit pas entraîner de préjudice injustifié.",
          help_en: "Consent must be explicit for sensitive information. It must be given for specific purposes and refusal must not result in unjustified harm.",
          type: "yes_no_partial",
          evidence_example_fr: "Formulaires de consentement, bannières cookies, cases à cocher dans les formulaires",
          evidence_example_en: "Consent forms, cookie banners, checkboxes in forms",
          kb_references: [],
          severity: "medium",
          phase: 2,
        },
        {
          id: "collecte_minimale",
          text_fr: "Seuls les renseignements nécessaires aux finalités déclarées sont-ils collectés ?",
          text_en: "Are only the personal information necessary for declared purposes collected?",
          help_fr: "Le principe de minimisation des données exige de ne collecter que ce qui est strictement nécessaire à la finalité déclarée.",
          help_en: "The data minimization principle requires collecting only what is strictly necessary for the declared purpose.",
          type: "yes_no_partial",
          evidence_example_fr: "Revue des formulaires et processus de collecte confirmant la minimisation",
          evidence_example_en: "Review of forms and collection processes confirming minimization",
          kb_references: [],
          severity: "medium",
          phase: 2,
        },
      ],
    },
  ],
};
