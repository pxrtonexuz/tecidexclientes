"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-foreground">CRM</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestão de leads e oportunidades</p>
      </div>
      <div className="flex gap-2 border-b border-border pb-0">
        <Link
          href="/crm/kanban"
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2",
            pathname === "/crm/kanban"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Kanban
        </Link>
        <Link
          href="/crm/leads"
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2",
            pathname === "/crm/leads"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Lista de Leads
        </Link>
      </div>
      {children}
    </div>
  );
}
