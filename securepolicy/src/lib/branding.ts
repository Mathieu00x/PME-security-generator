import { Branding, CompanyProfile } from "@/types";

const DEFAULT_NAME = "SecurePilot";
const DEFAULT_COLOR = "#2563EB";

export function resolveBranding(
  profile?: Pick<CompanyProfile, "brand_name" | "brand_color" | "brand_logo_url"> | null
): Branding {
  return {
    name: profile?.brand_name?.trim() || DEFAULT_NAME,
    color: profile?.brand_color?.trim() || DEFAULT_COLOR,
    logoUrl: profile?.brand_logo_url?.trim() || undefined,
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(num)) return [37, 99, 235];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}
