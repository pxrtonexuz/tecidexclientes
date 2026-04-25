import Link from "next/link";

export default function AtendenteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Atendente de IA</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Monitore e controle o agente Nexuz</p>
      </div>
      <div className="flex gap-2 border-b border-border">
        <Link href="/atendente/saude" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Saúde da IA
        </Link>
        <Link href="/atendente/chat" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Chat
        </Link>
      </div>
      {children}
    </div>
  );
}
