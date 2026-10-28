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

// Two-letter monogram for the cover/header badge. Naively slicing the first
// two characters breaks on single-word compound names like "SecurePilot"
// ("Se" instead of "SP") — real initials need either two separate words, or
// the internal capital-letter boundary of a compound word.
export function getBrandInitials(name: string): string {
  const trimmed = name.trim();
  if (trimmed === DEFAULT_NAME) return "SP";

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  const compoundMatch = trimmed.match(/^([A-Z][a-z]*)([A-Z])/);
  if (compoundMatch) {
    return (compoundMatch[1][0] + compoundMatch[2]).toUpperCase();
  }

  return trimmed.slice(0, 2).toUpperCase();
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(num)) return [37, 99, 235];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}
