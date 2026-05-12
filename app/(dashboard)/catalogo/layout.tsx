"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Modelos", href: "/catalogo/modelos" },
  { label: "Tecidos", href: "/catalogo/tecidos" },
  { label: "Atributos", href: "/catalogo/atributos" },
];

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Catálogo Virtual</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Alterações são salvas imediatamente e refletidas no agente
        </p>
      </div>

      <div
        className="flex items-center gap-1 p-1 rounded-[12px] w-fit"
        style={{
          background: "rgba(255, 255, 255, 0.045)",
          border: "1px solid rgba(255, 255, 255, 0.10)",
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
                  ? { background: "#0f6b3f", boxShadow: "0 0 14px rgba(57,217,138,0.20)" }
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
