"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Saúde da IA", href: "/atendente/saude" },
  { label: "Chat", href: "/atendente/chat" },
];

export default function AtendenteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="tec-page space-y-6">
      <div className="tec-page-header">
        <div>
          <h1 className="tec-page-title">Atendente de IA</h1>
          <p className="tec-page-description">Monitore e controle o agente de IA</p>
        </div>
      </div>

      <div className="tec-segmented">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn("tec-segmented-item", active && "tec-segmented-item-active")}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
