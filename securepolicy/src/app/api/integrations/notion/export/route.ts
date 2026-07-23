import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { contentToNotionBlocks, executiveSummaryToNotionBlocks, securityScoreToNotionBlocks } from "@/lib/exporters";
import { NotionIntegrationConfig, Policy } from "@/types";
import { getEntitlements } from "@/lib/entitlements";

const NOTION_VERSION = "2022-06-28";
const NOTION_BLOCK_BATCH = 100;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entitlements = await getEntitlements(supabase, user.id);
  if (!entitlements.hasFeature("confluence_notion")) {
    return NextResponse.json({ error: "Notion export requires the Pro plan or higher." }, { status: 403 });
  }

  const { policyId } = (await req.json()) as { policyId: string };

  const [{ data: policy }, { data: integration }] = await Promise.all([
    supabase.from("policies").select("*").eq("id", policyId).eq("user_id", user.id).single(),
    supabase.from("integrations").select("*").eq("user_id", user.id).eq("provider", "notion").single(),
  ]);

  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }
  if (!integration) {
    return NextResponse.json(
      { error: "Notion is not connected yet. Add your integration token in Settings → Integrations." },
      { status: 400 }
    );
  }

  const { token, parentPageId } = integration.config as NotionIntegrationConfig;
  const p = policy as Policy;
  const blocks = [
    ...(p.security_score?.executiveSummary ? executiveSummaryToNotionBlocks(p.security_score.executiveSummary) : []),
    ...contentToNotionBlocks(p.content),
    ...(p.security_score ? securityScoreToNotionBlocks(p.security_score) : []),
  ];

  const notionHeaders = {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };

  try {
    const createRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        parent: { page_id: parentPageId },
        properties: {
          title: { title: [{ text: { content: p.title } }] },
        },
        children: blocks.slice(0, NOTION_BLOCK_BATCH),
      }),
    });

    const created = await createRes.json();

    if (!createRes.ok) {
      return NextResponse.json(
        { error: created?.message || "Notion rejected the request. Check your token and parent page ID." },
        { status: 502 }
      );
    }

    for (let i = NOTION_BLOCK_BATCH; i < blocks.length; i += NOTION_BLOCK_BATCH) {
      const batch = blocks.slice(i, i + NOTION_BLOCK_BATCH);
      await fetch(`https://api.notion.com/v1/blocks/${created.id}/children`, {
        method: "PATCH",
        headers: notionHeaders,
        body: JSON.stringify({ children: batch }),
      });
    }

    return NextResponse.json({ url: created.url });
  } catch (err) {
    console.error("Notion export error:", err);
    return NextResponse.json({ error: "Failed to reach Notion. Please try again." }, { status: 500 });
  }
}
