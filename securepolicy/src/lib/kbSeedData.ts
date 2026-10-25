import { KBControl } from "@/types";

// Seed content for the kb_controls table, pushed via POST /api/admin/seed-kb-controls
// (upsert by `code`, so re-running this is safe and idempotent). Editing a row here
// and re-seeding never rewrites already-created remediation_tasks — their content is
// snapshotted at creation time, not joined live.
export const KB_SEED_DATA: Omit<KBControl, "id" | "created_at">[] = [
  {
    code: "SP-EMAIL-001",
    finding_key: "dmarc_missing",
    title_fr: "DMARC non configuré",
    title_en: "DMARC not configured",
    category: "email_security",
    severity: "medium",
    phase: 1,
    why_it_matters_fr:
      "Sans DMARC, n'importe qui peut envoyer des emails en se faisant passer pour votre domaine. Cela facilite le phishing et le spoofing ciblant vos clients et partenaires.",
    why_it_matters_en:
      "Without DMARC, anyone can send emails impersonating your domain, enabling phishing and spoofing attacks targeting your clients and partners.",
    business_impact_fr:
      "Risque élevé de fraude par email. Les emails légitimes peuvent être mis en quarantaine. Atteinte à la réputation si votre domaine est utilisé pour du phishing.",
    business_impact_en:
      "High risk of email fraud. Legitimate emails may be quarantined. Reputation damage if your domain is used for phishing.",
    remediation_steps_fr: [
      "Accéder à votre gestionnaire DNS",
      "Créer un enregistrement TXT sur _dmarc.votredomaine.com",
      "Valeur recommandée pour démarrer : v=DMARC1; p=quarantine; rua=mailto:dmarc@votredomaine.com; pct=100",
      "Vérifier après 48h avec un outil DMARC checker",
      "Passer à p=reject une fois la politique stabilisée",
    ],
    remediation_steps_en: [
      "Access your DNS manager",
      "Create a TXT record on _dmarc.yourdomain.com",
      "Recommended starting value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=100",
      "Verify after 48h with a DMARC checker tool",
      "Move to p=reject once policy is stable",
    ],
    evidence_required_fr: ["Capture d'écran de l'enregistrement DNS DMARC", "Rapport DMARC checker confirmant la configuration"],
    evidence_required_en: ["Screenshot of DMARC DNS record", "DMARC checker report confirming configuration"],
    nist_csf: ["DE.CM-7", "PR.PT-1"],
    cis_controls: ["9.5"],
    iso_27001: ["A.8.22", "A.5.14"],
    loi_25: [],
    pipeda: ["Principle 7 - Safeguards"],
    soc2: ["CC7.1"],
  },
  {
    code: "SP-EMAIL-002",
    finding_key: "spf_missing",
    title_fr: "SPF non configuré",
    title_en: "SPF not configured",
    category: "email_security",
    severity: "medium",
    phase: 1,
    why_it_matters_fr:
      "SPF indique aux serveurs de messagerie quels serveurs sont autorisés à envoyer des emails pour votre domaine. Sans SPF, les emails frauduleux passent plus facilement.",
    why_it_matters_en:
      "SPF tells mail servers which servers are authorized to send email for your domain. Without SPF, fraudulent emails pass more easily.",
    business_impact_fr:
      "Vos emails légitimes peuvent être marqués comme spam. Votre domaine peut être utilisé pour des campagnes de spam ou de phishing.",
    business_impact_en: "Your legitimate emails may be marked as spam. Your domain can be used for spam or phishing campaigns.",
    remediation_steps_fr: [
      "Identifier tous les services qui envoient des emails pour votre domaine (Resend, Gmail, etc.)",
      "Créer un enregistrement TXT SPF sur votre domaine racine",
      "Exemple : v=spf1 include:_spf.resend.com include:_spf.google.com ~all",
      "Tester avec un SPF validator",
    ],
    remediation_steps_en: [
      "Identify all services sending email for your domain",
      "Create a TXT SPF record on your root domain",
      "Example: v=spf1 include:_spf.resend.com ~all",
      "Test with an SPF validator",
    ],
    evidence_required_fr: ["Capture d'écran de l'enregistrement SPF", "Résultat d'un SPF checker"],
    evidence_required_en: ["Screenshot of SPF record", "SPF checker result"],
    nist_csf: ["DE.CM-7"],
    cis_controls: ["9.5"],
    iso_27001: ["A.8.22"],
    loi_25: [],
    pipeda: ["Principle 7 - Safeguards"],
    soc2: ["CC7.1"],
  },
  {
    code: "SP-EMAIL-003",
    // Triggered only when dns.dkimStatus === "not_found" — i.e. every common
    // selector lookup completed with no match. "unknown" (the lookups themselves
    // failed) is a distinct, non-triggering state — see getTriggeredFindingKeys().
    finding_key: "dkim_not_detected",
    title_fr: "DKIM non détecté",
    title_en: "DKIM not detected",
    category: "email_security",
    severity: "medium",
    phase: 1,
    why_it_matters_fr:
      "DKIM ajoute une signature cryptographique à vos emails pour prouver qu'ils viennent bien de vous. Note : SecurePilot teste les sélecteurs courants. DKIM peut exister avec un sélecteur personnalisé non testé.",
    why_it_matters_en:
      "DKIM adds a cryptographic signature to your emails to prove they come from you. Note: SecurePilot tests common selectors. DKIM may exist with a custom selector not tested.",
    business_impact_fr:
      "Sans signature DKIM vérifiée, les emails peuvent être modifiés en transit sans détection. La combinaison SPF+DMARC+DKIM est la meilleure protection.",
    business_impact_en:
      "Without verified DKIM signature, emails can be altered in transit undetected. The SPF+DMARC+DKIM combination is the best protection.",
    remediation_steps_fr: [
      "Vérifier si DKIM est configuré via votre fournisseur email (Resend, Google Workspace, etc.)",
      "Obtenir le sélecteur DKIM auprès de votre fournisseur",
      "Publier l'enregistrement CNAME ou TXT DKIM fourni par votre service email",
      "Vérifier la propagation DNS après 48h",
    ],
    remediation_steps_en: [
      "Check if DKIM is configured via your email provider",
      "Obtain your DKIM selector from your provider",
      "Publish the CNAME or TXT DKIM record provided",
      "Verify DNS propagation after 48h",
    ],
    evidence_required_fr: ["Enregistrement DKIM publié et validé", "Résultat d'un email header analyzer confirmant la signature"],
    evidence_required_en: ["Published and validated DKIM record", "Email header analyzer result confirming signature"],
    nist_csf: ["PR.DS-2"],
    cis_controls: ["9.5"],
    iso_27001: ["A.8.22"],
    loi_25: [],
    pipeda: ["Principle 7 - Safeguards"],
    soc2: ["CC7.1"],
  },
  {
    code: "SP-TLS-001",
    finding_key: "ssl_expired",
    title_fr: "Certificat SSL/TLS expiré",
    title_en: "SSL/TLS certificate expired",
    category: "tls",
    severity: "critical",
    phase: 1,
    why_it_matters_fr:
      "Un certificat expiré signale aux visiteurs que la connexion n'est pas sécurisée. Les navigateurs affichent un avertissement rouge et la plupart des utilisateurs quittent immédiatement.",
    why_it_matters_en:
      "An expired certificate signals to visitors that the connection is not secure. Browsers display a red warning and most users leave immediately.",
    business_impact_fr:
      "Perte immédiate de trafic et de confiance. Risque réel d'interception des données en transit. Impact immédiat sur les conversions et la réputation.",
    business_impact_en:
      "Immediate loss of traffic and trust. Real risk of data interception in transit. Immediate impact on conversions and reputation.",
    remediation_steps_fr: [
      "Renouveler immédiatement le certificat SSL",
      "Activer le renouvellement automatique (Let's Encrypt, votre hébergeur)",
      "Vérifier que le renouvellement automatique est fonctionnel avec une alerte email",
    ],
    remediation_steps_en: [
      "Renew the SSL certificate immediately",
      "Enable automatic renewal (Let's Encrypt, your host)",
      "Verify automatic renewal works with email alerts",
    ],
    evidence_required_fr: ["Nouveau certificat avec date d'expiration > 30 jours", "Capture d'écran du cadenas vert dans le navigateur"],
    evidence_required_en: ["New certificate with expiry > 30 days", "Screenshot of green padlock in browser"],
    nist_csf: ["PR.DS-2"],
    cis_controls: ["3.10"],
    iso_27001: ["A.8.24"],
    loi_25: ["Art. 3.5 - Mesures de sécurité"],
    pipeda: ["Principle 7 - Safeguards"],
    soc2: ["CC6.7"],
  },
  {
    code: "SP-TLS-002",
    finding_key: "ssl_weak_protocol",
    title_fr: "Grade SSL/TLS faible (protocole obsolète)",
    title_en: "Weak SSL/TLS grade (outdated protocol)",
    category: "tls",
    severity: "high",
    phase: 1,
    why_it_matters_fr:
      "Un grade SSL faible indique un protocole TLS obsolète (TLS 1.0 / 1.1), vulnérable à des attaques connues (BEAST, POODLE). PCI-DSS et la plupart des frameworks de sécurité exigent au minimum TLS 1.2.",
    why_it_matters_en:
      "A weak SSL grade indicates an obsolete TLS protocol (TLS 1.0 / 1.1), vulnerable to known attacks (BEAST, POODLE). PCI-DSS and most security frameworks require at least TLS 1.2.",
    business_impact_fr: "Risque réel de déchiffrement des communications. Non-conformité aux standards PCI-DSS. Vulnérabilité connue exploitable.",
    business_impact_en: "Real risk of communication decryption. PCI-DSS non-compliance. Known exploitable vulnerability.",
    remediation_steps_fr: [
      "Accéder à la configuration SSL/TLS de votre serveur ou hébergeur",
      "Désactiver TLS 1.0 et TLS 1.1",
      "Conserver TLS 1.2 et TLS 1.3 uniquement",
      "Tester avec SSL Labs (ssllabs.com/ssltest/) — viser grade A ou A+",
    ],
    remediation_steps_en: [
      "Access your server or hosting SSL/TLS configuration",
      "Disable TLS 1.0 and TLS 1.1",
      "Keep TLS 1.2 and TLS 1.3 only",
      "Test with SSL Labs — aim for grade A or A+",
    ],
    evidence_required_fr: ["Résultat SSL Labs montrant TLS 1.2+ uniquement", "Grade A ou A+"],
    evidence_required_en: ["SSL Labs result showing TLS 1.2+ only", "Grade A or A+"],
    nist_csf: ["PR.DS-2"],
    cis_controls: ["3.10"],
    iso_27001: ["A.8.24"],
    loi_25: ["Art. 3.5 - Mesures de sécurité"],
    pipeda: ["Principle 7 - Safeguards"],
    soc2: ["CC6.7"],
  },
  {
    code: "SP-HDR-001",
    finding_key: "hsts_missing",
    title_fr: "En-tête HSTS absent",
    title_en: "HSTS header missing",
    category: "headers",
    severity: "medium",
    phase: 2,
    why_it_matters_fr:
      "HSTS (HTTP Strict Transport Security) force les navigateurs à utiliser HTTPS exclusivement. Sans HSTS, un attaquant peut forcer un downgrade vers HTTP et intercepter le trafic.",
    why_it_matters_en: "HSTS forces browsers to use HTTPS exclusively. Without HSTS, an attacker can force a downgrade to HTTP and intercept traffic.",
    business_impact_fr: "Risque d'attaque SSL stripping. Sans HSTS, les utilisateurs peuvent accéder au site en HTTP en cas d'attaque réseau.",
    business_impact_en: "Risk of SSL stripping attack. Without HSTS, users may access the site over HTTP during a network attack.",
    remediation_steps_fr: [
      "Ajouter l'en-tête Strict-Transport-Security: max-age=31536000; includeSubDomains dans la configuration de votre application",
      "Vérifier que HTTPS fonctionne parfaitement avant d'activer HSTS",
      "Considérer la soumission au HSTS preload list après stabilisation",
    ],
    remediation_steps_en: [
      "Add the header Strict-Transport-Security: max-age=31536000; includeSubDomains in your application config",
      "Verify HTTPS works perfectly before enabling HSTS",
      "Consider HSTS preload list submission after stabilization",
    ],
    evidence_required_fr: ["Capture d'écran des headers HTTP montrant HSTS", "Score de 10/10 sur securityheaders.com"],
    evidence_required_en: ["Screenshot of HTTP headers showing HSTS", "10/10 score on securityheaders.com"],
    nist_csf: ["PR.PT-3"],
    cis_controls: ["16.1"],
    iso_27001: ["A.8.20"],
    loi_25: [],
    pipeda: ["Principle 7 - Safeguards"],
    soc2: ["CC6.6"],
  },
  {
    code: "SP-HDR-002",
    finding_key: "csp_missing",
    title_fr: "Content Security Policy (CSP) absente",
    title_en: "Content Security Policy (CSP) missing",
    category: "headers",
    severity: "medium",
    phase: 2,
    why_it_matters_fr: "CSP protège contre les attaques XSS (Cross-Site Scripting) en limitant les sources autorisées pour les scripts, styles et ressources.",
    why_it_matters_en: "CSP protects against XSS attacks by limiting authorized sources for scripts, styles and resources.",
    business_impact_fr:
      "Risque accru d'injection de scripts malveillants. Les attaques XSS peuvent compromettre les sessions utilisateurs et voler des données sensibles.",
    business_impact_en: "Increased risk of malicious script injection. XSS attacks can compromise user sessions and steal sensitive data.",
    remediation_steps_fr: [
      "Définir une politique CSP adaptée à votre application",
      "Commencer en mode report-only pour détecter les violations sans bloquer",
      "Affiner progressivement pour n'autoriser que les sources légitimes",
      "Activer en mode enforce une fois stable",
    ],
    remediation_steps_en: [
      "Define a CSP policy for your application",
      "Start in report-only mode to detect violations without blocking",
      "Progressively refine to allow only legitimate sources",
      "Enable enforce mode once stable",
    ],
    evidence_required_fr: ["En-tête CSP présent dans les réponses HTTP", "Aucune violation CSP dans les logs"],
    evidence_required_en: ["CSP header present in HTTP responses", "No CSP violations in logs"],
    nist_csf: ["PR.PT-3"],
    cis_controls: ["16.12"],
    iso_27001: ["A.8.20"],
    loi_25: [],
    pipeda: ["Principle 7 - Safeguards"],
    soc2: ["CC6.6"],
  },
  {
    code: "SP-EXP-001",
    finding_key: "hibp_breach_detected",
    title_fr: "Domaine présent dans des bases de données de compromissions",
    title_en: "Domain found in breach databases",
    category: "exposure",
    // Base severity; generateRemediationTasks() overrides this to "high" at
    // creation time when hibp.compromisedCount > 5.
    severity: "medium",
    phase: 1,
    why_it_matters_fr:
      "Le domaine de l'entreprise apparaît dans des bases de données de compromissions publiques (Have I Been Pwned). Des comptes email associés à ce domaine ont probablement été exposés lors de violations de données.",
    why_it_matters_en:
      "The company domain appears in public breach databases (Have I Been Pwned). Email accounts associated with this domain were likely exposed in data breaches.",
    business_impact_fr:
      "Des identifiants d'employés peuvent circuler sur le dark web. Risque élevé de credential stuffing et d'accès non autorisé. Vérification immédiate requise.",
    business_impact_en:
      "Employee credentials may be circulating on the dark web. High risk of credential stuffing and unauthorized access. Immediate verification required.",
    remediation_steps_fr: [
      "Identifier les comptes spécifiquement compromis via le service HaveIBeenPwned Enterprise ou une vérification email par email",
      "Forcer la réinitialisation des mots de passe pour tous les comptes potentiellement compromis",
      "Activer l'authentification multi-facteurs (MFA) immédiatement sur tous les comptes",
      "Auditer les accès récents des comptes concernés pour détecter des activités anormales",
      "Sensibiliser les employés concernés",
    ],
    remediation_steps_en: [
      "Identify specifically compromised accounts via HaveIBeenPwned Enterprise or per-email check",
      "Force password reset for all potentially compromised accounts",
      "Enable multi-factor authentication (MFA) immediately on all accounts",
      "Audit recent access on affected accounts for abnormal activity",
      "Train affected employees",
    ],
    evidence_required_fr: ["Confirmation de réinitialisation de mots de passe", "Capture d'écran de MFA activé", "Rapport d'audit des accès"],
    evidence_required_en: ["Password reset confirmation", "Screenshot of MFA enabled", "Access audit report"],
    nist_csf: ["ID.RA-1", "RS.AN-1"],
    cis_controls: ["6.5", "12.5"],
    iso_27001: ["A.8.2", "A.6.8"],
    loi_25: ["Art. 3.5 - Mesures de sécurité", "Obligations incidents confidentialité"],
    pipeda: ["Principle 7 - Safeguards", "Principle 1 - Accountability"],
    soc2: ["CC6.1", "CC7.2"],
  },
  {
    code: "SP-SUB-001",
    finding_key: "subdomain_takeover_risk",
    title_fr: "Sous-domaine vulnérable à une prise de contrôle",
    title_en: "Subdomain vulnerable to takeover",
    category: "subdomain",
    severity: "high",
    phase: 1,
    why_it_matters_fr:
      "Un enregistrement CNAME pointe encore vers un fournisseur externe (hébergement statique, PaaS, etc.) dont la ressource associée n'existe plus. Tant que cet enregistrement n'est pas retiré, n'importe qui peut réclamer ce nom chez le fournisseur et servir son propre contenu sous le sous-domaine de l'entreprise.",

    why_it_matters_en:
      "A CNAME record still points at an external provider (static hosting, PaaS, etc.) whose underlying resource no longer exists. Until that record is removed, anyone can claim that name on the provider's side and serve their own content under the company's subdomain.",
    business_impact_fr:
      "Un attaquant qui réclame la ressource peut héberger du contenu malveillant, des pages de phishing ou des cookies volés sous un sous-domaine légitime de l'entreprise — contournant la confiance accordée au domaine principal.",
    business_impact_en:
      "An attacker who claims the resource can host malicious content, phishing pages, or steal cookies under a legitimate company subdomain — bypassing the trust placed in the primary domain.",
    remediation_steps_fr: [
      "Confirmer si le sous-domaine et la ressource externe (bucket, app, site) sont encore utilisés",
      "Si non utilisés : supprimer l'enregistrement CNAME chez le fournisseur DNS",
      "Si toujours utilisés : recréer la ressource chez le fournisseur externe sous le même nom",
      "Revérifier par un nouveau scan que le CNAME ne pointe plus vers une ressource non réclamée",
    ],
    remediation_steps_en: [
      "Confirm whether the subdomain and the external resource (bucket, app, site) are still in use",
      "If unused: remove the CNAME record at the DNS provider",
      "If still in use: recreate the resource under the same name at the external provider",
      "Re-verify with a new scan that the CNAME no longer points at an unclaimed resource",
    ],
    evidence_required_fr: ["Capture d'écran du DNS après retrait ou recréation de la ressource", "Confirmation du fournisseur externe"],
    evidence_required_en: ["Screenshot of DNS after removal or resource recreation", "Confirmation from the external provider"],
    nist_csf: ["ID.RA-1", "PR.DS-8"],
    cis_controls: ["12.2", "7.1"],
    iso_27001: ["A.8.9", "A.8.20"],
    loi_25: ["Art. 3.5 - Mesures de sécurité"],
    pipeda: ["Principle 7 - Safeguards"],
    soc2: ["CC6.1"],
  },
];
