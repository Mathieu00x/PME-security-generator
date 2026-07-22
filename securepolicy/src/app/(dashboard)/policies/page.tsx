import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FileText, Eye, Download, MoreHorizontal, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Policy } from "@/types";
import { PoliciesClient } from "@/components/policies/PoliciesClient";
import { resolveBranding } from "@/lib/branding";

export default async function PoliciesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: policies }, { data: profile }] = await Promise.all([
    supabase
      .from("policies")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase.from("company_profiles").select("brand_name, brand_color, brand_logo_url").eq("user_id", user!.id).single(),
  ]);

  const branding = resolveBranding(profile);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Policies</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and view your security policies.</p>
        </div>
        <Link href="/generate">
          <Button>
            <Plus size={16} />
            Generate New Policy
          </Button>
        </Link>
      </div>

      <PoliciesClient initialPolicies={(policies as Policy[]) || []} branding={branding} />
    </div>
  );
}
