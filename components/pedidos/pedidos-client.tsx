"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MessageSquare,
  Paintbrush,
  PackageCheck,
  Ruler,
  Scissors,
  Search,
  Send,
  Shirt,
  StepForward,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  addPedidoComentario,
  concluirFasePedido,
  updatePedidoStatus,
  type PedidoComentarioRow,
  type PedidoRow,
} from "@/app/actions/operacao";

type OperationStatus = "triagem" | "artes" | "impressao" | "corte" | "producao" | "finalizado";

type TextileSpecs = {
  finalidade?: string;
  referencia_visual?: string;
  cores_base?: string;
  cores_detalhe?: string;
  tecido?: string;
  modelagem?: string;
  gola?: string;
  manga?: string;
  punho?: string;
  escudo?: string;
  acabamento?: string;
  arte?: string;
  grade?: Record<string, number>;
  personalizacoes?: {
    nome_individual?: string;
    numero_individual?: string;
    frase_turma_escola?: string;
    patrocinadores?: string;
    frente?: string;
    costas?: string;
    manga?: string;
    gola_punho?: string;
  };
};

const columns: Array<{
  id: OperationStatus;
  label: string;
  hint: string;
  accent: string;
  icon: typeof ClipboardCheck;
}> = [
  { id: "triagem", label: "Triagem", hint: "Conferir OS, grade, arte, prazo e valor.", accent: "#38bdf8", icon: ClipboardCheck },
  { id: "artes", label: "Artes", hint: "Criar ou aprovar layout e arquivos.", accent: "#a78bfa", icon: Paintbrush },
  { id: "impressao", label: "Impressao", hint: "Arquivos liberados para impressao.", accent: "#f59e0b", icon: FileText },
  { id: "corte", label: "Corte", hint: "Separar moldes, tecido e grade.", accent: "#fb7185", icon: Scissors },
  { id: "producao", label: "Producao", hint: "Costura, montagem e acabamento.", accent: "#6ee7b7", icon: Shirt },
  { id: "finalizado", label: "Finalizado", hint: "Pedido pronto, entregue ou retirado.", accent: "#22c55e", icon: PackageCheck },
];

const statusMap = new Map(columns.map((column) => [column.id, column]));

const demoSpecs: TextileSpecs = {
  finalidade: "Terceirao",
  referencia_visual: "Camisa Adidas gola polo, azul escura com detalhes em azul claro nas mangas e gola.",
  cores_base: "Azul escuro",
  cores_detalhe: "Azul claro nas mangas e gola",
  tecido: "Sportege",
  modelagem: "Nao informado",
  gola: "Polo V",
  manga: "Manga longa normal",
  punho: "Punho duplo",
  escudo: "Bordado",
  acabamento: "Sem vies triplo e sem vivo",
  arte: "Criar do zero pela Atua Sports",
  grade: { P: 10, M: 7, G: 7, GG: 6 },
  personalizacoes: {
    nome_individual: "Pendente",
    numero_individual: "Pendente",
    frase_turma_escola: "Pendente",
    patrocinadores: "Pendente",
    frente: "Pendente",
    costas: "Pendente",
    manga: "Pendente",
    gola_punho: "Pendente",
  },
};

const demoPedido: PedidoRow = {
  id: "demo-pedido-terceirao",
  numero: "PED-2026-0001",
  cliente_id: "demo-cliente",
  lead_id: null,
  session_id: "559899999999@s.whatsapp.net",
  status_comercial: "venda_concluida",
  status_operacional: "triagem",
  prioridade: "normal",
  prazo_combinado: null,
  quantidade_total: 30,
  especificacoes: demoSpecs,
  valor: null,
  modelo: "Camiseta personalizada",
  origem: "crm_chat",
  criado_por: null,
  responsavel_user_id: null,
  observacoes: "Fred ainda vai passar valor e fechar com o cliente.",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  cliente: {
    id: "demo-cliente",
    nome: "Gabriel - Terceirao",
    telefone: "559899999999",
    empresa_nome: "Loja Teste",
  },
  ordem_servico: {
    id: "demo-os-terceirao",
    pedido_id: "demo-pedido-terceirao",
    numero_os: "OS-2026-0001",
    status: "aberta",
    pdf_url: null,
    detalhes_tecnicos: demoSpecs,
    pendencias: [
      "Confirmar valor final.",
      "Confirmar prazo de entrega.",
      "Confirmar arte/logo do terceirao.",
      "Confirmar se havera nome individual.",
      "Confirmar se havera numero individual.",
      "Confirmar frase, escola, turma ou patrocinadores.",
      "Confirmar posicao do escudo bordado.",
      "Confirmar cores finais e grade fechada.",
    ],
    resumo_operacional:
      "Pedido de 30 camisetas personalizadas para terceirao. Cliente escolheu tecido Sportege, gola Polo V, manga longa normal, punho duplo, escudo bordado e sem acabamento extra de vies triplo ou vivo. A referencia visual e uma camisa estilo Adidas gola polo, azul escura com detalhes em azul claro nas mangas e na gola. Cliente nao possui arte pronta, entao a equipe precisa criar a arte do zero. Grade informada: 10 P, 7 M, 7 G e 6 GG. Antes de avancar para Artes, confirmar valor, prazo, escudo/logo, cores finais, nomes/numeros/frases e posicoes das personalizacoes.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  comentarios: [
    {
      id: "demo-comentario-1",
      pedido_id: "demo-pedido-terceirao",
      actor_user_id: null,
      actor_nome: "Rafa",
      mensagem: "Cliente confirmou a grade. Falta Fred passar valor e prazo final.",
      created_at: new Date().toISOString(),
    },
    {
      id: "demo-comentario-2",
      pedido_id: "demo-pedido-terceirao",
      actor_user_id: null,
      actor_nome: "Artes",
      mensagem: "Antes de iniciar, precisamos confirmar escudo/logo e se tera nomes ou numeros individuais.",
      created_at: new Date().toISOString(),
    },
  ],
};

function money(value: number | null | undefined) {
  if (!value) return "Valor pendente";
  return `R$ ${value.toLocaleString("pt-BR")}`;
}

function normalizeStatus(status: string): OperationStatus {
  if (status === "novo" || status === "em_separacao") return "triagem";
  if (status === "em_producao") return "producao";
  if (status === "pronto_entrega" || status === "entregue") return "finalizado";
  return columns.some((column) => column.id === status) ? (status as OperationStatus) : "triagem";
}

function readSpecs(pedido: PedidoRow): TextileSpecs {
  const fromOs = pedido.ordem_servico?.detalhes_tecnicos as TextileSpecs | null | undefined;
  const fromPedido = pedido.especificacoes as TextileSpecs | null | undefined;
  return fromOs && Object.keys(fromOs).length > 0 ? fromOs : fromPedido ?? {};
}

function gradeLabel(grade?: Record<string, number>) {
  if (!grade || Object.keys(grade).length === 0) return "Grade pendente";
  return Object.entries(grade)
    .filter(([, qtd]) => Number(qtd) > 0)
    .map(([size, qtd]) => `${size} ${qtd}`)
    .join(" · ");
}

function dueLabel(date?: string | null) {
  if (!date) return "Prazo pendente";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Prazo pendente";
  return format(parsed, "dd/MM", { locale: ptBR });
}

function priorityClass(pedido: PedidoRow) {
  const priority = pedido.prioridade ?? "normal";
  if (priority === "urgente") return "border-red-400/25 bg-red-500/15 text-red-200";
  if (priority === "alta") return "border-yellow-400/25 bg-yellow-500/15 text-yellow-200";
  return "border-white/10 bg-white/[0.055] text-muted-foreground";
}

function isDemo(pedido: PedidoRow) {
  return pedido.id.startsWith("demo-");
}

function nextStatus(status: string) {
  const current = normalizeStatus(status);
  const index = columns.findIndex((column) => column.id === current);
  if (index < 0 || index === columns.length - 1) return null;
  return columns[index + 1];
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value || "Pendente"}</p>
    </div>
  );
}

function PedidoCard({
  pedido,
  selected,
  dragging,
  onOpen,
}: {
  pedido: PedidoRow;
  selected?: boolean;
  dragging?: boolean;
  onOpen: () => void;
}) {
  const specs = readSpecs(pedido);
  const status = normalizeStatus(pedido.status_operacional);
  const column = statusMap.get(status) ?? columns[0];
  const pendencias = pedido.ordem_servico?.pendencias ?? [];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full rounded-[14px] p-4 text-left transition-all"
      style={{
        background: selected ? "rgba(16,185,129,0.12)" : dragging ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.055)",
        border: `1px solid ${selected ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.12)"}`,
        boxShadow: dragging ? "0 22px 64px rgba(0,0,0,0.45)" : "0 8px 24px rgba(0,0,0,0.22)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{pedido.numero}</p>
            {isDemo(pedido) && <Badge className="border border-[#38bdf8]/20 bg-[#38bdf8]/15 text-[#7dd3fc]">Demo</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{pedido.ordem_servico?.numero_os ?? "OS pendente"}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-white/90" style={{ borderColor: `${column.accent}55`, background: `${column.accent}22` }}>
          <column.icon className="h-4 w-4" style={{ color: column.accent }} />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{pedido.cliente?.nome ?? "Cliente nao encontrado"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shirt className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{pedido.quantidade_total ? `${pedido.quantidade_total} pecas` : "Qtd. pendente"} · {specs.tecido ?? "Tecido pendente"} · {specs.gola ?? "Gola pendente"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Ruler className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{specs.punho ?? "Punho pendente"} · {specs.escudo ?? "Escudo pendente"}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <DetailRow label="Grade" value={gradeLabel(specs.grade)} />
        <DetailRow label="Prazo" value={dueLabel(pedido.prazo_combinado)} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge className={cn("border text-[11px]", priorityClass(pedido))}>
          {pedido.prioridade === "urgente" ? "Urgente" : pedido.prioridade === "alta" ? "Alta prioridade" : "Normal"}
        </Badge>
        <Badge className={cn("border text-[11px]", pendencias.length > 0 ? "border-yellow-400/25 bg-yellow-500/15 text-yellow-200" : "border-[#6ee7b7]/20 bg-[#6ee7b7]/15 text-[#6ee7b7]")}>
          {pendencias.length > 0 ? `${pendencias.length} pendencias` : "OS completa"}
        </Badge>
      </div>
    </button>
  );
}

function SortablePedidoCard({ pedido, selected, onOpen }: { pedido: PedidoRow; selected?: boolean; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pedido.id, disabled: isDemo(pedido) });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}>
      <PedidoCard pedido={pedido} selected={selected} dragging={isDragging} onOpen={onOpen} />
    </div>
  );
}

function KanbanColumn({
  column,
  pedidos,
  selectedId,
  onOpen,
}: {
  column: (typeof columns)[number];
  pedidos: PedidoRow[];
  selectedId?: string;
  onOpen: (pedido: PedidoRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section className="flex w-80 shrink-0 flex-col">
      <header className="rounded-t-[16px] border border-white/10 bg-white/[0.045] px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <column.icon className="h-4 w-4" style={{ color: column.accent }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: column.accent }}>
              {column.label}
            </span>
          </div>
          <Badge className="border border-white/10 bg-white/[0.055] text-muted-foreground">{pedidos.length}</Badge>
        </div>
        <p className="mt-2 min-h-9 text-xs leading-5 text-muted-foreground">{column.hint}</p>
      </header>
      <SortableContext id={column.id} items={pedidos.map((pedido) => pedido.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="min-h-[32rem] space-y-3 rounded-b-[16px] border border-t-0 border-white/10 p-3"
          style={{ background: isOver ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.025)" }}
        >
          {pedidos.map((pedido) => (
            <SortablePedidoCard key={pedido.id} pedido={pedido} selected={pedido.id === selectedId} onOpen={() => onOpen(pedido)} />
          ))}
          {pedidos.length === 0 && (
            <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-white/10 px-4 text-center text-xs text-muted-foreground">
              Solte pedidos aqui
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function PedidoDialog({
  pedido,
  open,
  sending,
  advancing,
  message,
  onMessageChange,
  onSendMessage,
  onAdvance,
  onOpenChange,
}: {
  pedido?: PedidoRow;
  open: boolean;
  sending: boolean;
  advancing: boolean;
  message: string;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onAdvance: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const specs = pedido ? readSpecs(pedido) : {};
  const pendencias = pedido?.ordem_servico?.pendencias ?? [];
  const next = pedido ? nextStatus(pedido.status_operacional) : null;
  const comments = (pedido?.comentarios ?? []).slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden border-white/10 bg-[#080b13] p-0 text-foreground sm:max-w-5xl">
        {pedido && (
          <div className="flex max-h-[88vh] flex-col">
            <DialogHeader className="border-b border-white/10 px-5 pb-4 pt-5">
              <div className="flex flex-wrap items-start justify-between gap-4 pr-8">
                <div>
                  <DialogTitle className="text-xl font-semibold">{pedido.numero} · {pedido.ordem_servico?.numero_os ?? "OS pendente"}</DialogTitle>
                  <DialogDescription className="mt-1">
                    {pedido.cliente?.nome ?? "Cliente nao encontrado"} · {statusMap.get(normalizeStatus(pedido.status_operacional))?.label}
                  </DialogDescription>
                </div>
                <Button
                  onClick={onAdvance}
                  disabled={advancing || !next || isDemo(pedido)}
                  className="gap-2"
                  title={isDemo(pedido) ? "Pedido exemplo nao altera banco" : undefined}
                >
                  <StepForward className="h-4 w-4" />
                  {next ? `Concluir fase: ir para ${next.label}` : "Pedido finalizado"}
                </Button>
              </div>
            </DialogHeader>

            <Tabs defaultValue="chat" className="min-h-0 flex-1 gap-0">
              <div className="border-b border-white/10 px-5 py-3">
                <TabsList className="bg-white/[0.055]">
                  <TabsTrigger value="chat" className="gap-2 px-4">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="info" className="gap-2 px-4">
                    <FileText className="h-4 w-4" />
                    Informacoes
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="chat" className="min-h-0 overflow-y-auto px-5 py-5">
                <div className="grid min-h-[32rem] gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/[0.035]">
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">Conversa interna do pedido</p>
                      <p className="mt-1 text-xs text-muted-foreground">Recados de producao, arte, corte e atendimento ficam centralizados aqui.</p>
                    </div>
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                      {comments.length > 0 ? (
                        comments.map((comment) => (
                          <div key={comment.id} className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-foreground">{comment.actor_nome || "Colaborador"}</p>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.created_at), "dd/MM HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{comment.mensagem}</p>
                          </div>
                        ))
                      ) : (
                        <div className="flex h-full min-h-48 items-center justify-center rounded-xl border-2 border-dashed border-white/10 px-6 text-center text-sm text-muted-foreground">
                          Nenhuma mensagem interna ainda.
                        </div>
                      )}
                    </div>
                    <div className="border-t border-white/10 p-4">
                      <Textarea
                        value={message}
                        onChange={(event) => onMessageChange(event.target.value)}
                        placeholder="Escreva uma atualizacao para a equipe..."
                        className="min-h-24 border-white/10 bg-white/[0.045]"
                        disabled={isDemo(pedido)}
                      />
                      <div className="mt-3 flex justify-end">
                        <Button onClick={onSendMessage} disabled={sending || isDemo(pedido) || !message.trim()} className="gap-2">
                          <Send className="h-4 w-4" />
                          Enviar mensagem
                        </Button>
                      </div>
                    </div>
                  </div>

                  <aside className="space-y-3">
                    <DetailRow label="Etapa atual" value={statusMap.get(normalizeStatus(pedido.status_operacional))?.label} />
                    <DetailRow label="Proxima etapa" value={next?.label ?? "Finalizado"} />
                    <DetailRow label="Pendencias" value={pendencias.length > 0 ? `${pendencias.length} abertas` : "Sem pendencias"} />
                    <DetailRow label="Prazo" value={dueLabel(pedido.prazo_combinado)} />
                  </aside>
                </div>
              </TabsContent>

              <TabsContent value="info" className="min-h-0 overflow-y-auto px-5 py-5">
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pedido</p>
                        <h3 className="mt-1 text-lg font-semibold text-foreground">{pedido.numero}</h3>
                        <p className="text-sm text-muted-foreground">{pedido.cliente?.nome ?? "Cliente nao encontrado"}</p>
                      </div>
                      <Badge className="border border-[#6ee7b7]/20 bg-[#6ee7b7]/15 text-[#6ee7b7]">
                        {statusMap.get(normalizeStatus(pedido.status_operacional))?.label}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <DetailRow label="Produto" value={pedido.modelo || "Camiseta personalizada"} />
                      <DetailRow label="Quantidade" value={pedido.quantidade_total ? `${pedido.quantidade_total} pecas` : "Pendente"} />
                      <DetailRow label="Valor" value={money(pedido.valor)} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Configuracao da peca</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <DetailRow label="Finalidade" value={specs.finalidade} />
                      <DetailRow label="Tecido" value={specs.tecido} />
                      <DetailRow label="Gola" value={specs.gola} />
                      <DetailRow label="Manga" value={specs.manga} />
                      <DetailRow label="Punho" value={specs.punho} />
                      <DetailRow label="Escudo/logo" value={specs.escudo} />
                      <DetailRow label="Acabamento" value={specs.acabamento} />
                      <DetailRow label="Arte" value={specs.arte} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Referencia e grade</p>
                    <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-foreground">
                      {specs.referencia_visual ?? "Referencia visual pendente."}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <DetailRow label="Cores base" value={specs.cores_base} />
                      <DetailRow label="Cores detalhe" value={specs.cores_detalhe} />
                      <DetailRow label="Grade" value={gradeLabel(specs.grade)} />
                      <DetailRow label="Prazo" value={dueLabel(pedido.prazo_combinado)} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Personalizacoes</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <DetailRow label="Nome individual" value={specs.personalizacoes?.nome_individual} />
                      <DetailRow label="Numero individual" value={specs.personalizacoes?.numero_individual} />
                      <DetailRow label="Frase/turma/escola" value={specs.personalizacoes?.frase_turma_escola} />
                      <DetailRow label="Patrocinadores" value={specs.personalizacoes?.patrocinadores} />
                      <DetailRow label="Frente" value={specs.personalizacoes?.frente} />
                      <DetailRow label="Costas" value={specs.personalizacoes?.costas} />
                      <DetailRow label="Manga" value={specs.personalizacoes?.manga} />
                      <DetailRow label="Gola/punho" value={specs.personalizacoes?.gola_punho} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-300" />
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pendencias de triagem</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      {pendencias.length > 0 ? (
                        pendencias.map((item) => (
                          <div key={item} className="flex gap-2 rounded-lg border border-yellow-400/15 bg-yellow-500/[0.08] p-3 text-sm text-yellow-100">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-300" />
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg border border-[#6ee7b7]/15 bg-[#6ee7b7]/[0.08] p-3 text-sm text-[#6ee7b7]">
                          <CheckCircle2 className="h-4 w-4" />
                          OS sem pendencias registradas.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resumo operacional</p>
                    <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-foreground">
                      {pedido.ordem_servico?.resumo_operacional ?? "Resumo operacional pendente."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" className="gap-2 border-white/10" disabled>
                        <FileText className="h-4 w-4" />
                        PDF em breve
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PedidosClient({ initialPedidos }: { initialPedidos: PedidoRow[] }) {
  const [pedidos, setPedidos] = useState<PedidoRow[]>(initialPedidos.length > 0 ? initialPedidos : [demoPedido]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PedidoRow | undefined>();
  const [chatMessage, setChatMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [advancingPhase, setAdvancingPhase] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return pedidos;
    return pedidos.filter((pedido) => {
      const specs = readSpecs(pedido);
      return (
        pedido.numero.toLowerCase().includes(needle) ||
        pedido.ordem_servico?.numero_os.toLowerCase().includes(needle) ||
        pedido.cliente?.nome.toLowerCase().includes(needle) ||
        pedido.modelo?.toLowerCase().includes(needle) ||
        specs.tecido?.toLowerCase().includes(needle) ||
        specs.gola?.toLowerCase().includes(needle)
      );
    });
  }, [pedidos, search]);

  const activePedido = pedidos.find((pedido) => pedido.id === activeId);
  const totalPendencias = pedidos.reduce((sum, pedido) => sum + (pedido.ordem_servico?.pendencias?.length ?? 0), 0);
  const inProgress = pedidos.filter((pedido) => normalizeStatus(pedido.status_operacional) !== "finalizado").length;

  function patchPedido(pedidoId: string, patch: Partial<PedidoRow>) {
    setPedidos((prev) => prev.map((item) => (item.id === pedidoId ? { ...item, ...patch } : item)));
    setSelected((prev) => (prev?.id === pedidoId ? { ...prev, ...patch } : prev));
  }

  function openPedido(pedido: PedidoRow) {
    setSelected(pedido);
    setChatMessage("");
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (!event.over) return;
    const pedidoId = String(event.active.id);
    const target = String(event.over.id);
    if (!columns.some((column) => column.id === target)) return;

    const pedido = pedidos.find((item) => item.id === pedidoId);
    if (!pedido || isDemo(pedido)) return;
    const previous = pedido.status_operacional;
    if (normalizeStatus(previous) === target) return;

    patchPedido(pedidoId, { status_operacional: target, updated_at: new Date().toISOString() });

    startTransition(async () => {
      const result = await updatePedidoStatus(pedidoId, target);
      if (result.error) {
        patchPedido(pedidoId, { status_operacional: previous });
        toast.error(result.error);
        return;
      }
      toast.success(`Pedido movido para ${statusMap.get(target as OperationStatus)?.label}.`);
    });
  }

  async function handleSendMessage() {
    if (!selected || isDemo(selected)) return;
    setSendingMessage(true);
    const result = await addPedidoComentario(selected.id, chatMessage);
    setSendingMessage(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    const comentario = result.comentario as PedidoComentarioRow;
    const nextComments = [...(selected.comentarios ?? []), comentario];
    patchPedido(selected.id, { comentarios: nextComments });
    setChatMessage("");
    toast.success("Mensagem adicionada ao pedido.");
  }

  async function handleAdvancePhase() {
    if (!selected) return;
    const next = nextStatus(selected.status_operacional);
    if (!next) return;

    if (isDemo(selected)) {
      patchPedido(selected.id, { status_operacional: next.id, updated_at: new Date().toISOString() });
      toast.success(`Pedido exemplo movido para ${next.label}.`);
      return;
    }

    const previous = selected.status_operacional;
    setAdvancingPhase(true);
    patchPedido(selected.id, { status_operacional: next.id, updated_at: new Date().toISOString() });
    const result = await concluirFasePedido(selected.id);
    setAdvancingPhase(false);
    if ("error" in result) {
      patchPedido(selected.id, { status_operacional: previous });
      toast.error(result.error);
      return;
    }
    toast.success(`Fase concluida. Pedido foi para ${next.label}.`);
  }

  return (
    <div className="tec-page space-y-5">
      <div className="tec-page-header">
        <div>
          <h1 className="tec-page-title">Pedidos e Entrega</h1>
          <p className="tec-page-description">Kanban operacional com OS tecnica para producao textil</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar pedido, OS, cliente, tecido ou gola..."
            className="h-10 border-white/10 bg-white/[0.045] pl-9"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs md:w-[28rem]">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-muted-foreground">Pedidos</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{pedidos.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-muted-foreground">Em andamento</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{inProgress}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-muted-foreground">Pendencias</p>
            <p className="mt-1 text-lg font-semibold text-yellow-200">{totalPendencias}</p>
          </div>
        </div>
      </div>

      {initialPedidos.length === 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#38bdf8]/20 bg-[#38bdf8]/[0.08] px-4 py-3 text-sm text-[#bae6fd]">
          <CalendarDays className="h-4 w-4" />
          Exibindo um pedido exemplo para demonstrar o fluxo de OS tecnica no Kanban.
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              pedidos={filtered.filter((pedido) => normalizeStatus(pedido.status_operacional) === column.id)}
              selectedId={selected?.id}
              onOpen={openPedido}
            />
          ))}
        </div>

        <DragOverlay>
          {activePedido && <PedidoCard pedido={activePedido} dragging onOpen={() => undefined} />}
        </DragOverlay>
      </DndContext>

      <PedidoDialog
        pedido={selected}
        open={!!selected}
        sending={sendingMessage}
        advancing={advancingPhase}
        message={chatMessage}
        onMessageChange={setChatMessage}
        onSendMessage={handleSendMessage}
        onAdvance={handleAdvancePhase}
        onOpenChange={(open) => !open && setSelected(undefined)}
      />
    </div>
  );
}
