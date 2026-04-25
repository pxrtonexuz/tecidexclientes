import Link from "next/link";

export default function InteligenciaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inteligência Comercial</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Análises aprofundadas do desempenho</p>
      </div>
      <div className="flex gap-2 border-b border-border">
        <Link href="/inteligencia/produto" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Produto
        </Link>
        <Link href="/inteligencia/atendimento" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Atendimento
        </Link>
        <Link href="/inteligencia/financeiro" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Financeiro
        </Link>
      </div>
      {children}
    </div>
  );
}
