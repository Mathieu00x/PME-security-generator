import { Metadata } from "next";
import { PrivacyClient } from "./PrivacyClient";

// This page is still client-toggled (not locale-routed like the public
// marketing pages), so unlike those, its own <title> can't track which
// language is actually rendered — but it can at least be accurate and
// neutral instead of inheriting the home page's French title verbatim
// while the page itself defaults to English content, which is what was
// happening before this file existed.
export const metadata: Metadata = {
  title: "Privacy Policy | SecurePilot",
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
