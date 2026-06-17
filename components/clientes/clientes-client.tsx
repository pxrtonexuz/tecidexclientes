"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, ClipboardList, Search, Tag, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ClienteComPedidos } from "@/app/actions/operacao";
import { cn } from "@/lib/utils";

function money(value: number | null | undefined) {
  if (!value) return "R$ 0";
  return `R$ ${value.toLocaleString("pt-BR")}`;
}

function dateLabel(value: string) {
  return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
}

export function ClientesClient({ initialClientes }: { initialClientes: ClienteComPedidos[] }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(initialClientes[0]?.id ?? "");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const digits = needle.replace(/\D/g, "");
    if (!needle) return initialClientes;
    return initialClientes.filter((cliente) => {
      return (
        cliente.nome.toLowerCase().includes(needle) ||
        (cliente.empresa_nome ?? "").toLowerCase().includes(needle) ||
        cliente.telefone_normalizado.includes(digits)
      );
    });
  }, [initialClientes, search]);

  const selected = initialClientes.find((cliente) => cliente.id === selectedId) ?? filtered[0];

  return (
    <div className="tec-page space-y-5">
      <div className="tec-page-header">
        <div>
          <h1 className="tec-page-title">Clientes</h1>
          <p className="tec-page-description">Histórico comercial, pedidos e OS por cliente</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="tec-panel overflow-hidden">
          <div className="border-b border-white/10 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente..."
                className="h-9 border-white/10 bg-white/[0.045] pl-9"
              />
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-15rem)]">
            <div className="space-y-2 p-3">
              {filtered.map((cliente) => {
                const pedidosAbertos = cliente.pedidos.filter((pedido) => pedido.status_operacional !== "entregue").length;
                const active = selected?.id === cliente.id;
                return (
                  <button
                    key={cliente.id}
                    onClick={() => setSelectedId(cliente.id)}
                    className={cn("w-full rounded-xl border p-3 text-left transition-all", active ? "border-[#6ee7b7]/30 bg-[#6ee7b7]/10" : "border-white/10 bg-white/[0.035] hover:bg-white/[0.055]")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.055] text-[#6ee7b7]">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{cliente.nome}</p>
                        <p className="truncate text-xs text-muted-foreground">{cliente.empresa_nome || cliente.telefone}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge className="border border-white/10 bg-white/[0.045] text-muted-foreground">{cliente.pedidos.length} pedidos</Badge>
                          {pedidosAbertos > 0 && (
                            <Badge className="border border-[#6ee7b7]/20 bg-[#6ee7b7]/15 text-[#6ee7b7]">{pedidosAbertos} em aberto</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
                  Nenhum cliente encontrado.
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        {selected ? (
          <section className="space-y-4">
            <div className="tec-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="tec-section-title">Cliente</p>
                  <h2 className="mt-1 text-2xl font-semibold text-foreground">{selected.nome}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{selected.telefone}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="border border-[#6ee7b7]/20 bg-[#6ee7b7]/15 text-[#6ee7b7]">{selected.tipo_cliente}</Badge>
                  <Badge className="border border-white/10 bg-white/[0.045] text-muted-foreground">{selected.status_relacionamento}</Badge>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground"><Building2 className="h-3.5 w-3.5" /> Empresa/time</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{selected.empresa_nome || "--"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground"><Tag className="h-3.5 w-3.5" /> Local</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{[selected.cidade, selected.uf].filter(Boolean).join(" / ") || "--"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground"><ClipboardList className="h-3.5 w-3.5" /> Pedidos</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{selected.pedidos.length} registrados</p>
                </div>
              </div>

              {selected.observacoes && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Observacoes internas</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">{selected.observacoes}</p>
                </div>
              )}
            </div>

            <div className="tec-panel overflow-hidden">
              <div className="border-b border-white/10 px-4 py-3">
                <h3 className="text-lg font-semibold text-foreground">Histórico de pedidos e OS</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.045] text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <th className="px-4 py-3">Pedido</th>
                      <th className="px-4 py-3">OS</th>
                      <th className="px-4 py-3">Modelo</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.pedidos.map((pedido) => (
                      <tr key={pedido.id} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3 font-medium text-foreground">{pedido.numero}</td>
                        <td className="px-4 py-3 text-muted-foreground">{pedido.ordem_servico?.numero_os ?? "--"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{pedido.modelo || "--"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{money(pedido.valor)}</td>
                        <td className="px-4 py-3">
                          <Badge className="border border-white/10 bg-white/[0.045] text-muted-foreground">{pedido.status_operacional}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{dateLabel(pedido.created_at)}</td>
                      </tr>
                    ))}
                    {selected.pedidos.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Nenhum pedido gerado para este cliente ainda.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : (
          <section className="tec-panel flex min-h-96 items-center justify-center text-sm text-muted-foreground">
            Nenhum cliente cadastrado ainda.
          </section>
        )}
      </div>
    </div>
  );
}
