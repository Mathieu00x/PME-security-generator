import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { contentToConfluenceStorage, executiveSummaryToConfluenceStorage, securityScoreToConfluenceStorage } from "@/lib/exporters";
import { ConfluenceIntegrationConfig, Policy } from "@/types";
import { getEntitlements } from "@/lib/entitlements";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entitlements = await getEntitlements(supabase, user.id);
  if (!entitlements.hasFeature("confluence_notion")) {
    return NextResponse.json({ error: "Confluence export requires the Pro plan or higher." }, { status: 403 });
  }

  const { policyId } = (await req.json()) as { policyId: string };

  const [{ data: policy }, { data: integration }] = await Promise.all([
    supabase.from("policies").select("*").eq("id", policyId).eq("user_id", user.id).single(),
    supabase.from("integrations").select("*").eq("user_id", user.id).eq("provider", "confluence").single(),
  ]);

  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }
  if (!integration) {
    return NextResponse.json(
      { error: "Confluence is not connected yet. Add your site details in Settings → Integrations." },
      { status: 400 }
    );
  }

  const { baseUrl, email, apiToken, spaceKey } = integration.config as ConfluenceIntegrationConfig;
  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");

  // Confluence export is only supported for Atlassian Cloud sites. Restricting
  // to this host pattern also prevents baseUrl from being used as an SSRF
  // vector against arbitrary internal or third-party hosts.
  let parsedBaseUrl: URL;
  try {
    parsedBaseUrl = new URL(cleanBaseUrl);
  } catch {
    return NextResponse.json({ error: "Invalid Confluence site URL." }, { status: 400 });
  }
  if (parsedBaseUrl.protocol !== "https:" || !parsedBaseUrl.hostname.endsWith(".atlassian.net")) {
    return NextResponse.json(
      { error: "Confluence site URL must be a valid Atlassian Cloud address, e.g. https://yourcompany.atlassian.net." },
      { status: 400 }
    );
  }

  const p = policy as Policy;
  const storageHtml = [
    p.security_score?.executiveSummary ? executiveSummaryToConfluenceStorage(p.security_score.executiveSummary) : "",
    contentToConfluenceStorage(p.content),
    p.security_score ? securityScoreToConfluenceStorage(p.security_score) : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(`${cleanBaseUrl}/wiki/rest/api/content`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "page",
        title: `${p.title} (v${p.version_number || 1}.0)`,
        space: { key: spaceKey },
        body: { storage: { value: storageHtml, representation: "storage" } },
      }),
    });

    const created = await res.json();

    if (!res.ok) {
      console.error("Confluence export rejected:", res.status, created?.message);
      return NextResponse.json(
        { error: "Confluence rejected the request. Check your site URL, email, token, and space key." },
        { status: 502 }
      );
    }

    const pageUrl = created._links?.base && created._links?.webui
      ? `${created._links.base}${created._links.webui}`
      : cleanBaseUrl;

    return NextResponse.json({ url: pageUrl });
  } catch (err) {
    console.error("Confluence export error:", err);
    return NextResponse.json({ error: "Failed to reach Confluence. Please try again." }, { status: 500 });
  }
}
