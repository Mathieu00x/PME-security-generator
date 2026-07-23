import { AccountSettings, Branding } from "@/types";

const DEFAULT_NAME = "SecurePilot";
const DEFAULT_COLOR = "#2563EB";

// `entitled` gates the "branding" plan feature: accounts without it always
// get default SecurePilot branding on exports, even if a brand_* row exists
// from a previous higher-tier subscription.
export function resolveBranding(
  settings?: Pick<AccountSettings, "brand_name" | "brand_color" | "brand_logo_url"> | null,
  entitled = true
): Branding {
  if (!entitled || !settings) {
    return { name: DEFAULT_NAME, color: DEFAULT_COLOR };
  }
  return {
    name: settings.brand_name?.trim() || DEFAULT_NAME,
    color: settings.brand_color?.trim() || DEFAULT_COLOR,
    logoUrl: settings.brand_logo_url?.trim() || undefined,
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(num)) return [37, 99, 235];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}
