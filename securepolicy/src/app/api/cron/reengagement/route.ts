import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const CAMPAIGN = "onboarding_nudge";
const INACTIVE_AFTER_HOURS = 48;
const STOP_NUDGING_AFTER_DAYS = 30; // don't chase very old dormant signups forever
const MAX_EMAILS_PER_RUN = 50; // safety cap in case something goes wrong upstream

const LOGO_SVG = `<svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:8px;">
<path d="M16 2L4 7V16C4 22.6 9.2 28.8 16 30C22.8 28.8 28 22.6 28 16V7L16 2Z" fill="#2563EB"/>
<path d="M16 5.5L7 9.5V16C7 21 11.2 25.8 16 27C20.8 25.8 25 21 25 16V9.5L16 5.5Z" fill="none" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
<path d="M11.5 16L14.5 19L20.5 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function buildEmailHtml(firstName: string, appUrl: string): string {
  const greetingFr = firstName ? `Salut ${firstName},` : "Salut,";
  const greetingEn = firstName ? `Hi ${firstName},` : "Hi,";

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;background:#ffffff;">
  <div style="padding:24px 32px;border-bottom:1px solid #f1f5f9;">
    ${LOGO_SVG}<span style="font-size:17px;font-weight:700;color:#111827;vertical-align:middle;">Secure<span style="color:#2563EB;">Pilot</span></span>
  </div>
  <div style="padding:32px;">
    <h2 style="font-size:19px;color:#111827;margin:0 0 8px;">${greetingFr}</h2>
    <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 20px;">Vous vous êtes inscrit sur SecurePilot mais n'avez pas encore généré votre première politique. Ça prend environ 5 minutes : ajoutez un client, scannez son domaine, et laissez l'IA générer une politique professionnelle basée sur les résultats.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${appUrl}/dashboard" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 24px;border-radius:8px;">Continuer mon parcours</a>
    </div>
    <hr style="border:none;border-top:1px solid #f1f5f9;margin:28px 0;" />
    <h2 style="font-size:16px;color:#374151;margin:0 0 6px;">${greetingEn}</h2>
    <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0 0 16px;">You signed up for SecurePilot but haven't generated your first policy yet. It takes about 5 minutes: add a client, scan their domain, and let the AI generate a professional policy from the results.</p>
    <div style="text-align:center;">
      <a href="${appUrl}/dashboard" style="display:inline-block;background:#f1f5f9;color:#374151;text-decoration:none;font-size:13px;font-weight:600;padding:8px 20px;border-radius:8px;">Continue onboarding</a>
    </div>
  </div>
  <div style="padding:20px 32px;border-top:1px solid #f1f5f9;">
    <p style="font-size:11px;color:#9ca3af;line-height:1.5;margin:0;">SecurePilot — Plateforme de cybersécurité pour PME et consultants IT.</p>
  </div>
</div>`;
}

async function sendEmail(to: string, firstName: string, appUrl: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Reengagement cron: RESEND_API_KEY not configured");
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "SecurePilot <noreply@mail.securepilot.ca>",
      to,
      subject: "Finissez de configurer SecurePilot / Finish setting up SecurePilot",
      html: buildEmailHtml(firstName, appUrl),
    }),
  });

  return res.ok;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.securepilot.ca";

  const now = Date.now();
  const inactiveCutoff = now - INACTIVE_AFTER_HOURS * 60 * 60 * 1000;
  const staleCutoff = now - STOP_NUDGING_AFTER_DAYS * 24 * 60 * 60 * 1000;

  // Supabase JS has no server-side "list all users" filter by signup date, so
  // pull confirmed users and filter in code — fine at this scale (low
  // hundreds), revisit with a paginated loop if the user base grows a lot.
  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) {
    console.error("Reengagement cron: failed to list users", usersError);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }

  const candidates = usersPage.users.filter((u) => {
    if (!u.email || !u.email_confirmed_at) return false;
    const createdAt = new Date(u.created_at).getTime();
    return createdAt <= inactiveCutoff && createdAt >= staleCutoff;
  });

  if (candidates.length === 0) {
    return NextResponse.json({ sent: 0, checked: 0 });
  }

  const candidateIds = candidates.map((u) => u.id);

  const [{ data: policyRows }, { data: alreadySent }] = await Promise.all([
    supabase.from("policies").select("user_id").in("user_id", candidateIds),
    supabase.from("email_campaigns_sent").select("user_id").eq("campaign", CAMPAIGN).in("user_id", candidateIds),
  ]);

  const hasPolicy = new Set((policyRows || []).map((p) => p.user_id));
  const alreadySentSet = new Set((alreadySent || []).map((r) => r.user_id));

  const toEmail = candidates.filter((u) => !hasPolicy.has(u.id) && !alreadySentSet.has(u.id)).slice(0, MAX_EMAILS_PER_RUN);

  let sent = 0;
  for (const u of toEmail) {
    const firstName = (u.user_metadata?.first_name as string | undefined) || "";
    const ok = await sendEmail(u.email!, firstName, appUrl);
    if (ok) {
      await supabase.from("email_campaigns_sent").insert({ user_id: u.id, campaign: CAMPAIGN });
      sent++;
    } else {
      console.error("Reengagement cron: failed to send to", u.email);
    }
  }

  return NextResponse.json({ checked: candidates.length, eligible: toEmail.length, sent });
}
