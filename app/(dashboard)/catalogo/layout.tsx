import Link from "next/link";

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Catálogo Virtual</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Alterações são salvas imediatamente e refletidas no agente
        </p>
      </div>
      <div className="flex gap-2 border-b border-border">
        <Link href="/catalogo/modelos" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Modelos
        </Link>
        <Link href="/catalogo/tecidos" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Tecidos
        </Link>
        <Link href="/catalogo/atributos" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Atributos
        </Link>
      </div>
      {children}
    </div>
  );
}
