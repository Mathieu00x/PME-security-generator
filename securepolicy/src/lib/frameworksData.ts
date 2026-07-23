export interface FrameworkDef {
  id: string;
  complianceKey: string;
  name: string;
  badge: string;
  taglineKey: string;
  descKey: string;
  relevantForKeys: string[];
  policyKeys: string[];
  effortKey: string;
  effortColor: string;
}

export const FRAMEWORKS: FrameworkDef[] = [
  {
    id: "iso27001",
    complianceKey: "ISO27001",
    name: "ISO 27001",
    badge: "bg-green-50 text-green-700 border-green-200",
    taglineKey: "fw.iso27001.tagline",
    descKey: "fw.iso27001.desc",
    relevantForKeys: ["fw.iso27001.relevant1", "fw.iso27001.relevant2", "fw.iso27001.relevant3"],
    policyKeys: ["fw.iso27001.policy1", "fw.iso27001.policy2", "fw.iso27001.policy3", "fw.iso27001.policy4"],
    effortKey: "frameworks.effort.high",
    effortColor: "text-red-600",
  },
  {
    id: "nist",
    complianceKey: "NIST",
    name: "NIST CSF",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    taglineKey: "fw.nist.tagline",
    descKey: "fw.nist.desc",
    relevantForKeys: ["fw.nist.relevant1", "fw.nist.relevant2", "fw.nist.relevant3"],
    policyKeys: ["fw.nist.policy1", "fw.nist.policy2", "fw.nist.policy3"],
    effortKey: "frameworks.effort.medium",
    effortColor: "text-yellow-600",
  },
  {
    id: "cis",
    complianceKey: "CIS",
    name: "CIS Controls",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    taglineKey: "fw.cis.tagline",
    descKey: "fw.cis.desc",
    relevantForKeys: ["fw.cis.relevant1", "fw.cis.relevant2", "fw.cis.relevant3"],
    policyKeys: ["fw.cis.policy1", "fw.cis.policy2", "fw.cis.policy3"],
    effortKey: "frameworks.effort.lowMedium",
    effortColor: "text-green-600",
  },
  {
    id: "soc2",
    complianceKey: "SOC2",
    name: "SOC 2",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    taglineKey: "fw.soc2.tagline",
    descKey: "fw.soc2.desc",
    relevantForKeys: ["fw.soc2.relevant1", "fw.soc2.relevant2", "fw.soc2.relevant3"],
    policyKeys: ["fw.soc2.policy1", "fw.soc2.policy2", "fw.soc2.policy3"],
    effortKey: "frameworks.effort.high",
    effortColor: "text-red-600",
  },
  {
    id: "loi25",
    complianceKey: "Loi25",
    name: "Law 25",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    taglineKey: "fw.loi25.tagline",
    descKey: "fw.loi25.desc",
    relevantForKeys: ["fw.loi25.relevant1", "fw.loi25.relevant2"],
    policyKeys: ["fw.loi25.policy1", "fw.loi25.policy2", "fw.loi25.policy3"],
    effortKey: "frameworks.effort.medium",
    effortColor: "text-yellow-600",
  },
  {
    id: "rgpd",
    complianceKey: "RGPD",
    name: "GDPR",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    taglineKey: "fw.rgpd.tagline",
    descKey: "fw.rgpd.desc",
    relevantForKeys: ["fw.rgpd.relevant1", "fw.rgpd.relevant2", "fw.rgpd.relevant3"],
    policyKeys: ["fw.rgpd.policy1", "fw.rgpd.policy2", "fw.rgpd.policy3"],
    effortKey: "frameworks.effort.high",
    effortColor: "text-red-600",
  },
];
