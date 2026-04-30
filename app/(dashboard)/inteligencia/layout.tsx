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
    <div className="p-6 space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Inteligência Comercial</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Análises aprofundadas do desempenho</p>
      </div>

      <div
        className="flex items-center gap-1 p-1 rounded-[12px] w-fit"
        style={{
          background: "rgba(5, 150, 105, 0.06)",
          border: "1px solid rgba(5, 150, 105, 0.18)",
        }}
      >
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "px-4 py-1.5 rounded-[9px] text-sm font-medium transition-all duration-180",
                active ? "text-white" : "text-muted-foreground hover:text-foreground"
              )}
              style={
                active
                  ? { background: "#059669", boxShadow: "0 0 14px rgba(5,150,105,0.4)" }
                  : undefined
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
