import Link from "next/link";
import { Lock, AlertTriangle, HardDrive, Monitor, Wifi, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PolicyType } from "@/types";

const POLICY_INFO: Record<PolicyType, { label: string; description: string; icon: React.ReactNode }> = {
  password: {
    label: "Politique de mots de passe",
    description: "Exigences de complexité, expiration et gestion des mots de passe.",
    icon: <Lock size={18} />,
  },
  "incident-response": {
    label: "Plan de réponse aux incidents",
    description: "Procédure à suivre en cas d'incident de sécurité.",
    icon: <AlertTriangle size={18} />,
  },
  backup: {
    label: "Politique de sauvegarde",
    description: "Fréquence, emplacement et tests de restauration des sauvegardes.",
    icon: <HardDrive size={18} />,
  },
  "acceptable-use": {
    label: "Politique d'utilisation acceptable",
    description: "Règles d'usage des ressources technologiques de l'entreprise.",
    icon: <Monitor size={18} />,
  },
  "remote-work": {
    label: "Politique de télétravail",
    description: "Sécurisation de l'accès distant et des appareils hors bureau.",
    icon: <Wifi size={18} />,
  },
};

const URGENT_TYPES: PolicyType[] = ["password", "incident-response"];

export function PolicyRecommendations({
  recommendedPolicies,
  scanId,
  hasCompromisedEmails,
}: {
  recommendedPolicies: PolicyType[];
  scanId: string;
  hasCompromisedEmails: boolean;
}) {
  if (recommendedPolicies.length === 0) return null;

  return (
    <Card>
      <h2 className="font-semibold text-gray-900 mb-1">Politiques recommandées</h2>
      <p className="text-xs text-gray-400 mb-4">
        Basées sur les vulnérabilités détectées lors du diagnostic.
      </p>
      <div className="flex flex-col gap-2">
        {recommendedPolicies.map((type) => {
          const info = POLICY_INFO[type];
          const urgent = hasCompromisedEmails && URGENT_TYPES.includes(type);
          return (
            <Link
              key={type}
              href={`/generate?type=${type}&from=scan&scanId=${scanId}`}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                  {info.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm">{info.label}</p>
                    {urgent && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 uppercase tracking-wide">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{info.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-blue-600 flex-shrink-0">
                Générer <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
