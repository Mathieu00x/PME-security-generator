"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useLanguage } from "@/contexts/LanguageContext";

export function PrivacyClient() {
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={14} /> {lang === "fr" ? "Retour" : "Back"}
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {lang === "fr" ? <PrivacyFr /> : <PrivacyEn />}
      </div>
    </div>
  );
}

function PrivacyEn() {
  return (
    <article className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600">
      <h1 className="text-2xl! mb-1">Privacy Policy</h1>
      <p className="text-xs text-gray-400 mb-8">Last updated: October 2026</p>

      <p>This Privacy Policy explains how SecurePilot (&quot;we&quot;) collects, uses, and protects personal information when you use our platform. We built SecurePilot for consultants who help their own clients with privacy and security compliance, so we hold ourselves to the same standards we help you meet.</p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Account information:</strong> name, email address, and authentication data when you sign up.</li>
        <li><strong>Client data you enter:</strong> company profiles, security questionnaire answers, and domains you scan on behalf of your own clients.</li>
        <li><strong>Billing information:</strong> handled directly by Stripe — we do not store your card details.</li>
        <li><strong>Usage data:</strong> basic product analytics and error logs to keep the Service reliable.</li>
      </ul>

      <h2>2. Anonymous Security Scans</h2>
      <p>Our homepage offers a free scan tool that does not require an account. When you use it, we record the domain scanned and a cryptographically hashed version of the IP address the request came from (via HMAC, a one-way transformation using a secret key we hold — not a reversible lookup). This is solely to prevent abuse of a public, unauthenticated tool (e.g. automated scanning at scale). Even hashed, we treat this IP as personal information. We retain it for a maximum of 24 hours, after which it is automatically deleted, and we do not use it for any other purpose, such as tracking or advertising.</p>

      <h2>3. How We Use Information</h2>
      <p>We use collected information to operate and improve the Service, generate the documents and scans you request, process payments, communicate with you about your account, and comply with legal obligations.</p>

      <h2>4. Third-Party Service Providers</h2>
      <p>We rely on the following processors to operate the Service: Supabase (database, authentication, hosting of your data), Vercel (application hosting), Anthropic (AI generation of policy documents), Stripe (payment processing), and Have I Been Pwned / VirusTotal (public breach and reputation lookups performed against the domain you scan). Each provider only receives the data necessary to perform its function.</p>

      <h2>5. Where Your Data Is Hosted</h2>
      <p>Your account data, and the data you enter about your own clients, is currently processed and stored in the United States, on Supabase and Vercel infrastructure — not in Canada. This is a transfer of personal information outside Quebec, which Quebec&apos;s Law 25 regulates. We use encrypted connections (HTTPS/TLS) in transit and row-level security so each account can only access its own data. We are evaluating Canadian hosting options and will update this policy, and notify active accounts, if that changes.</p>

      <h2>6. Data Storage &amp; Security</h2>
      <p>Data is stored in a Supabase-managed PostgreSQL database with row-level security enforced so that each account can only access its own data. We use encrypted connections (HTTPS/TLS) throughout the Service.</p>

      <h2>7. Data Retention</h2>
      <p>We retain your account data for as long as your account is active. If you delete your account, associated data is removed within a reasonable period, except where retention is required for legal, tax, or dispute-resolution purposes. Anonymous scan data (Section 2) is retained for a maximum of 24 hours regardless of account status.</p>

      <h2>8. Your Rights</h2>
      <p>Depending on your location, you may have rights under Quebec&apos;s <em>Act respecting the protection of personal information in the private sector</em> (Law 25), Canada&apos;s PIPEDA, or the EU/UK GDPR — including the right to access, correct, or request deletion of your personal information, and to withdraw consent. To exercise these rights, contact us at the address published below.</p>

      <h2>9. Cookies &amp; Local Storage</h2>
      <p>We use essential cookies for authentication (via Supabase) and local storage to remember your language preference. We do not use third-party advertising trackers.</p>

      <h2>10. AI-Generated Content</h2>
      <p>Questionnaire answers and company profile details you provide are sent to our AI provider (Anthropic) solely to generate your requested documents. This data is not used by SecurePilot to train AI models.</p>

      <h2>11. Children&apos;s Privacy</h2>
      <p>The Service is intended for business use and is not directed at children. We do not knowingly collect personal information from children.</p>

      <h2>12. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. Material changes will be communicated through the Service.</p>

      <h2>13. Person Responsible for the Protection of Personal Information</h2>
      <p>As required by Quebec&apos;s Law 25, the person responsible for the protection of personal information at SecurePilot is:</p>
      <p>Mathieu Joseph, Founder<br />Email: <a href="mailto:privacy@securepilot.ca">privacy@securepilot.ca</a></p>

      <h2>14. Contact</h2>
      <p>For privacy-related questions or requests, including under Section 8 above, contact us at <a href="mailto:privacy@securepilot.ca">privacy@securepilot.ca</a>.</p>
    </article>
  );
}

function PrivacyFr() {
  return (
    <article className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600">
      <h1 className="text-2xl! mb-1">Politique de confidentialité</h1>
      <p className="text-xs text-gray-400 mb-8">Dernière mise à jour : octobre 2026</p>

      <p>Cette politique de confidentialité explique comment SecurePilot (« nous ») collecte, utilise et protège les renseignements personnels lorsque vous utilisez notre plateforme. Nous avons conçu SecurePilot pour des consultants qui aident leurs propres clients en matière de conformité à la vie privée et à la sécurité — nous nous appliquons donc les mêmes standards que ceux que nous vous aidons à atteindre.</p>

      <h2>1. Renseignements que nous collectons</h2>
      <ul>
        <li><strong>Informations de compte :</strong> nom, adresse courriel et données d&apos;authentification lors de votre inscription.</li>
        <li><strong>Données de vos clients que vous saisissez :</strong> profils d&apos;entreprise, réponses au questionnaire de sécurité et domaines que vous scannez pour le compte de vos propres clients.</li>
        <li><strong>Informations de facturation :</strong> traitées directement par Stripe — nous ne stockons pas les détails de votre carte.</li>
        <li><strong>Données d&apos;utilisation :</strong> statistiques de base et journaux d&apos;erreurs pour assurer la fiabilité du Service.</li>
      </ul>

      <h2>2. Scans de sécurité anonymes</h2>
      <p>Notre page d&apos;accueil offre un outil de scan gratuit qui ne requiert pas de compte. Lorsque vous l&apos;utilisez, nous enregistrons le domaine scanné et une version hachée de manière cryptographique de l&apos;adresse IP d&apos;où provient la requête (via HMAC, une transformation à sens unique utilisant une clé secrète que nous détenons — pas une correspondance réversible). Ceci vise uniquement à prévenir l&apos;abus d&apos;un outil public et non authentifié (par exemple, un scan automatisé à grande échelle). Même hachée, nous traitons cette IP comme un renseignement personnel. Nous la conservons pendant un maximum de 24 heures, après quoi elle est automatiquement supprimée, et nous ne l&apos;utilisons à aucune autre fin, comme le suivi ou la publicité.</p>

      <h2>3. Utilisation des renseignements</h2>
      <p>Nous utilisons les renseignements collectés pour exploiter et améliorer le Service, générer les documents et scans que vous demandez, traiter les paiements, communiquer avec vous au sujet de votre compte et respecter nos obligations légales.</p>

      <h2>4. Fournisseurs de services tiers</h2>
      <p>Nous faisons appel aux sous-traitants suivants pour exploiter le Service : Supabase (base de données, authentification, hébergement de vos données), Vercel (hébergement de l&apos;application), Anthropic (génération des documents de politique par IA), Stripe (traitement des paiements), ainsi que Have I Been Pwned et VirusTotal (vérifications publiques de fuites de données et de réputation effectuées sur le domaine que vous scannez). Chaque fournisseur ne reçoit que les données nécessaires à l&apos;exécution de sa fonction.</p>

      <h2>5. Où vos données sont hébergées</h2>
      <p>Les données de votre compte, ainsi que les données que vous saisissez au sujet de vos propres clients, sont actuellement traitées et stockées aux États-Unis, sur l&apos;infrastructure de Supabase et de Vercel — pas au Canada. Il s&apos;agit d&apos;un transfert de renseignements personnels hors Québec, encadré par la Loi 25. Nous utilisons des connexions chiffrées (HTTPS/TLS) en transit ainsi que la sécurité au niveau des lignes afin que chaque compte n&apos;ait accès qu&apos;à ses propres données. Nous évaluons des options d&apos;hébergement canadien et mettrons à jour cette politique, en avisant les comptes actifs, si la situation change.</p>

      <h2>6. Stockage et sécurité des données</h2>
      <p>Les données sont stockées dans une base de données PostgreSQL gérée par Supabase, avec sécurité au niveau des lignes (RLS) appliquée afin que chaque compte n&apos;ait accès qu&apos;à ses propres données. Nous utilisons des connexions chiffrées (HTTPS/TLS) dans l&apos;ensemble du Service.</p>

      <h2>7. Conservation des données</h2>
      <p>Nous conservons les données de votre compte tant que celui-ci est actif. Si vous supprimez votre compte, les données associées sont supprimées dans un délai raisonnable, sauf lorsque leur conservation est requise à des fins légales, fiscales ou de résolution de litige. Les données de scan anonyme (section 2) sont conservées pour un maximum de 24 heures, indépendamment du statut d&apos;un compte.</p>

      <h2>8. Vos droits</h2>
      <p>Selon votre situation géographique, vous pouvez avoir des droits en vertu de la <em>Loi sur la protection des renseignements personnels dans le secteur privé</em> du Québec (Loi 25), de la LPRPDE fédérale canadienne, ou du RGPD (UE/RU) — notamment le droit d&apos;accéder à vos renseignements personnels, de les faire corriger ou d&apos;en demander la suppression, et de retirer votre consentement. Pour exercer ces droits, communiquez avec nous à l&apos;adresse publiée ci-dessous.</p>

      <h2>9. Témoins (cookies) et stockage local</h2>
      <p>Nous utilisons des témoins essentiels pour l&apos;authentification (via Supabase) et le stockage local pour mémoriser votre préférence de langue. Nous n&apos;utilisons aucun traceur publicitaire tiers.</p>

      <h2>10. Contenu généré par l&apos;IA</h2>
      <p>Les réponses au questionnaire et les détails du profil d&apos;entreprise que vous fournissez sont transmis à notre fournisseur d&apos;IA (Anthropic) uniquement pour générer les documents demandés. Ces données ne sont pas utilisées par SecurePilot pour entraîner des modèles d&apos;IA.</p>

      <h2>11. Confidentialité des mineurs</h2>
      <p>Le Service est destiné à un usage professionnel et ne s&apos;adresse pas aux enfants. Nous ne collectons pas sciemment de renseignements personnels auprès d&apos;enfants.</p>

      <h2>12. Modifications de cette politique</h2>
      <p>Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Les changements importants seront communiqués par l&apos;entremise du Service.</p>

      <h2>13. Personne responsable de la protection des renseignements personnels</h2>
      <p>Conformément à la Loi 25 du Québec, la personne responsable de la protection des renseignements personnels chez SecurePilot est :</p>
      <p>Mathieu Joseph, fondateur<br />Courriel : <a href="mailto:privacy@securepilot.ca">privacy@securepilot.ca</a></p>

      <h2>14. Contact</h2>
      <p>Pour toute question ou demande liée à la confidentialité, y compris celles visées à la section 8 ci-dessus, communiquez avec nous à <a href="mailto:privacy@securepilot.ca">privacy@securepilot.ca</a>.</p>
    </article>
  );
}
