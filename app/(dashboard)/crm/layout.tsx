import Link from "next/link";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-foreground">CRM</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestão de leads e oportunidades</p>
      </div>
      <div className="flex gap-2 border-b border-border pb-0">
        <Link
          href="/crm/kanban"
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent data-[active=true]:border-primary data-[active=true]:text-foreground"
        >
          Kanban
        </Link>
        <Link
          href="/crm/leads"
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent"
        >
          Lista de Leads
        </Link>
      </div>
      {children}
    </div>
  );
}
