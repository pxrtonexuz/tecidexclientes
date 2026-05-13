"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Produto", href: "/inteligencia/produto" },
  { label: "Atendimento", href: "/inteligencia/atendimento" },
  { label: "Financeiro", href: "/inteligencia/financeiro" },
];

export default function InteligenciaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="tec-page space-y-6">
      <div className="tec-page-header">
        <div>
          <h1 className="tec-page-title">Inteligência Comercial</h1>
          <p className="tec-page-description">Análises aprofundadas do desempenho</p>
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
