"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardCheck, FileText, Search, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { PedidoRow } from "@/app/actions/operacao";

const statusLabels: Record<string, string> = {
  novo: "Novo",
  em_separacao: "Em separacao",
  em_producao: "Em producao",
  pronto_entrega: "Pronto para entrega",
  entregue: "Entregue",
};

function money(value: number | null | undefined) {
  if (!value) return "R$ 0";
  return `R$ ${value.toLocaleString("pt-BR")}`;
}

export function PedidosClient({ initialPedidos }: { initialPedidos: PedidoRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return initialPedidos;
    return initialPedidos.filter((pedido) => {
      return (
        pedido.numero.toLowerCase().includes(needle) ||
        pedido.ordem_servico?.numero_os.toLowerCase().includes(needle) ||
        pedido.cliente?.nome.toLowerCase().includes(needle) ||
        pedido.modelo?.toLowerCase().includes(needle)
      );
    });
  }, [initialPedidos, search]);

  const groups = Object.keys(statusLabels).map((status) => ({
    status,
    pedidos: filtered.filter((pedido) => pedido.status_operacional === status),
  }));

  return (
    <div className="tec-page space-y-5">
      <div className="tec-page-header">
        <div>
          <h1 className="tec-page-title">Pedidos e Entrega</h1>
          <p className="tec-page-description">Fila operacional de pedidos gerados a partir do CRM Chat</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar pedido, OS, cliente ou modelo..."
          className="h-9 border-white/10 bg-white/[0.045] pl-9"
        />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3">
        {groups.map((group) => (
          <section key={group.status} className="flex w-80 shrink-0 flex-col">
            <header className="flex items-center justify-between rounded-t-xl border border-white/10 bg-white/[0.045] px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#6ee7b7]">
                {statusLabels[group.status]}
              </span>
              <Badge className="border border-white/10 bg-white/[0.055] text-muted-foreground">{group.pedidos.length}</Badge>
            </header>
            <div className="min-h-[28rem] space-y-3 rounded-b-xl border border-t-0 border-white/10 bg-white/[0.025] p-3">
              {group.pedidos.map((pedido) => (
                <article key={pedido.id} className="rounded-xl border border-white/10 bg-white/[0.055] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{pedido.numero}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{pedido.ordem_servico?.numero_os ?? "OS pendente"}</p>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#6ee7b7]/20 bg-[#6ee7b7]/10 text-[#6ee7b7]">
                      <ClipboardCheck className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-foreground">
                      <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{pedido.cliente?.nome ?? "Cliente nao encontrado"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="truncate">{pedido.modelo || "Modelo nao informado"}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-2">
                      <p className="text-muted-foreground">Valor</p>
                      <p className="mt-1 font-semibold text-foreground">{money(pedido.valor)}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-2">
                      <p className="text-muted-foreground">Criado</p>
                      <p className="mt-1 font-semibold text-foreground">{format(new Date(pedido.created_at), "dd/MM", { locale: ptBR })}</p>
                    </div>
                  </div>

                  {pedido.ordem_servico?.resumo_operacional && (
                    <p className="mt-3 line-clamp-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-muted-foreground">
                      {pedido.ordem_servico.resumo_operacional}
                    </p>
                  )}
                </article>
              ))}
              {group.pedidos.length === 0 && (
                <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-white/10 text-xs text-muted-foreground">
                  Sem pedidos
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
