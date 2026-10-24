// `company_profiles.province` is free text (no fixed dropdown), so this can
// only recognize common spellings — it defaults to treating a client as
// Quebec (the product's primary market) whenever the value is missing or
// unrecognized, rather than hiding Loi 25 based on an ambiguous read.
const NON_QUEBEC_PROVINCES = [
  "ontario", "on", "alberta", "ab", "british columbia", "bc", "colombie-britannique",
  "manitoba", "mb", "saskatchewan", "sk", "nova scotia", "ns", "nouvelle-ecosse", "nouvelle-écosse",
  "new brunswick", "nb", "nouveau-brunswick", "newfoundland", "nl", "terre-neuve",
  "pei", "prince edward island", "ile-du-prince-edouard", "île-du-prince-édouard",
  "yukon", "yt", "northwest territories", "nt", "territoires du nord-ouest", "nunavut", "nu",
];

export function isQuebec(province: string | null | undefined): boolean {
  if (!province) return true;
  const normalized = province
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (normalized === "qc" || normalized.startsWith("que")) return true;
  return !NON_QUEBEC_PROVINCES.includes(normalized);
}
