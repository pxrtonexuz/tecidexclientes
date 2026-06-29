"use server";

import { requireTenantSession } from "@/lib/auth";
import { createTenantClient } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";

export type ClienteRow = {
  id: string;
  nome: string;
  telefone: string;
  telefone_normalizado: string;
  email: string | null;
  documento: string | null;
  tipo_cliente: string;
  empresa_nome: string | null;
  cidade: string | null;
  uf: string | null;
  endereco: string | null;
  origem: string;
  status_relacionamento: string;
  responsavel_user_id: string | null;
  tags: string[];
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type PedidoRow = {
  id: string;
  numero: string;
  cliente_id: string;
  lead_id: string | null;
  session_id: string | null;
  status_comercial: string;
  status_operacional: string;
  prioridade?: string | null;
  prazo_combinado?: string | null;
  quantidade_total?: number | null;
  especificacoes?: Record<string, unknown> | null;
  valor: number | null;
  modelo: string | null;
  origem: string;
  criado_por: string | null;
  responsavel_user_id: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  cliente?: Pick<ClienteRow, "id" | "nome" | "telefone" | "empresa_nome"> | null;
  ordem_servico?: OrdemServicoRow | null;
};

export type OrdemServicoRow = {
  id: string;
  pedido_id: string;
  numero_os: string;
  status: string;
  pdf_url: string | null;
  resumo_operacional: string | null;
  detalhes_tecnicos?: Record<string, unknown> | null;
  pendencias?: string[] | null;
  created_at: string;
  updated_at: string;
};

export type ClienteComPedidos = ClienteRow & {
  pedidos: Array<PedidoRow & { ordem_servico: OrdemServicoRow | null }>;
};

export type GeneratePedidoInput = {
  existingClienteId?: string;
  cliente?: {
    nome: string;
    telefone: string;
    tipo_cliente: string;
    empresa_nome?: string | null;
    cidade?: string | null;
    uf?: string | null;
    observacoes?: string | null;
  };
  leadId?: string | null;
  sessionId?: string | null;
  valor?: number | null;
  modelo?: string | null;
  observacoes?: string | null;
};

const ORDER_OPERATION_STATUSES = new Set([
  "triagem",
  "artes",
  "impressao",
  "corte",
  "producao",
  "finalizado",
]);

export type GeneratePedidoResult =
  | { error: string }
  | {
      cliente: ClienteRow;
      pedido: PedidoRow;
      ordemServico: OrdemServicoRow;
      existingCliente: boolean;
    };

type ChatHistoryMessage = {
  id: number;
  session_id: string;
  created_at?: string | null;
};

function normalizePhone(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length > 11 && digits.startsWith("55")) return digits.slice(2);
  return digits;
}

function yearSequence(prefix: string, count: number) {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
}

async function nextNumber(db: ReturnType<typeof createTenantClient>, table: string, prefix: string) {
  const { count } = await db
    .from(table)
    .select("id", { count: "exact", head: true });
  return yearSequence(prefix, count ?? 0);
}

async function getConversationSlice(db: ReturnType<typeof createTenantClient>, sessionId: string) {
  const { data: previousSlices } = await db
    .from("pedido_conversa_recortes")
    .select("message_end_id")
    .eq("session_id", sessionId)
    .order("message_end_id", { ascending: false, nullsFirst: false })
    .limit(1);

  const previousEnd = previousSlices?.[0]?.message_end_id as number | null | undefined;
  let query = db
    .from("n8n_chat_histories")
    .select("id, session_id, created_at")
    .eq("session_id", sessionId)
    .order("id", { ascending: true });

  if (previousEnd != null) {
    query = query.gt("id", previousEnd);
  }

  const { data } = await query;
  const rows = (data ?? []) as ChatHistoryMessage[];
  const first = rows[0];
  const last = rows[rows.length - 1];

  return {
    message_start_id: first?.id ?? null,
    message_end_id: last?.id ?? previousEnd ?? null,
    started_at: first?.created_at ?? null,
    ended_at: last?.created_at ?? null,
  };
}

export async function findClienteByPhone(phone: string): Promise<ClienteRow | null> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const { data } = await db
    .from("clientes")
    .select("*")
    .eq("telefone_normalizado", normalized)
    .maybeSingle();

  return (data as ClienteRow | null) ?? null;
}

export async function getClientes(): Promise<ClienteComPedidos[]> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const { data } = await db
    .from("clientes")
    .select(`
      *,
      pedidos (
        *,
        ordem_servico:ordens_servico (*)
      )
    `)
    .order("updated_at", { ascending: false });

  return (data ?? []) as ClienteComPedidos[];
}

export async function getPedidos(): Promise<PedidoRow[]> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const { data } = await db
    .from("pedidos")
    .select(`
      *,
      cliente:clientes (id, nome, telefone, empresa_nome),
      ordem_servico:ordens_servico (*)
    `)
    .order("created_at", { ascending: false });

  return (data ?? []) as PedidoRow[];
}

export async function updatePedidoStatus(pedidoId: string, status: string) {
  if (!ORDER_OPERATION_STATUSES.has(status)) {
    return { error: "Etapa operacional invalida." };
  }

  const { tenant, user } = await requireTenantSession();
  const db = createTenantClient(tenant);

  const { data: current } = await db
    .from("pedidos")
    .select("status_operacional")
    .eq("id", pedidoId)
    .maybeSingle();

  const previous = (current?.status_operacional as string | undefined) ?? null;
  const { error } = await db
    .from("pedidos")
    .update({
      status_operacional: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pedidoId);

  if (error) return { error: error.message };

  await db.from("pedido_eventos").insert({
    pedido_id: pedidoId,
    actor_user_id: user.id,
    tipo: "mudanca_etapa_operacional",
    from_status: previous,
    to_status: status,
  });

  revalidatePath("/pedidos");
  revalidatePath("/clientes");

  return { ok: true };
}

export async function generatePedidoFromCrm(input: GeneratePedidoInput): Promise<GeneratePedidoResult> {
  const { tenant, user } = await requireTenantSession();
  const db = createTenantClient(tenant);

  let cliente: ClienteRow | null = null;
  let existingCliente = false;

  if (input.existingClienteId) {
    const { data, error } = await db
      .from("clientes")
      .select("*")
      .eq("id", input.existingClienteId)
      .single();
    if (error || !data) return { error: "Cliente existente nao encontrado." };
    cliente = data as ClienteRow;
    existingCliente = true;
  } else if (input.cliente) {
    const normalized = normalizePhone(input.cliente.telefone);
    if (!input.cliente.nome.trim()) return { error: "Informe o nome do cliente." };
    if (!normalized) return { error: "Informe um telefone valido." };

    const { data: found } = await db
      .from("clientes")
      .select("*")
      .eq("telefone_normalizado", normalized)
      .maybeSingle();

    if (found) {
      cliente = found as ClienteRow;
      existingCliente = true;
    } else {
      const { data, error } = await db
        .from("clientes")
        .insert({
          nome: input.cliente.nome.trim(),
          telefone: input.cliente.telefone,
          telefone_normalizado: normalized,
          tipo_cliente: input.cliente.tipo_cliente,
          empresa_nome: input.cliente.empresa_nome || null,
          cidade: input.cliente.cidade || null,
          uf: input.cliente.uf || null,
          observacoes: input.cliente.observacoes || null,
          responsavel_user_id: user.id,
        })
        .select("*")
        .single();

      if (error || !data) return { error: error?.message ?? "Falha ao criar cliente." };
      cliente = data as ClienteRow;
    }
  }

  if (!cliente) return { error: "Selecione ou cadastre um cliente." };

  const [numero, numeroOs] = await Promise.all([
    nextNumber(db, "pedidos", "PED"),
    nextNumber(db, "ordens_servico", "OS"),
  ]);

  const { data: pedidoData, error: pedidoError } = await db
    .from("pedidos")
    .insert({
      numero,
      cliente_id: cliente.id,
      lead_id: input.leadId || null,
      session_id: input.sessionId || null,
      status_operacional: "triagem",
      valor: input.valor ?? null,
      modelo: input.modelo || null,
      criado_por: user.id,
      responsavel_user_id: user.id,
      observacoes: input.observacoes || null,
    })
    .select("*")
    .single();

  if (pedidoError || !pedidoData) {
    return { error: pedidoError?.message ?? "Falha ao gerar pedido." };
  }

  const pedido = pedidoData as PedidoRow;

  const { data: osData, error: osError } = await db
    .from("ordens_servico")
    .insert({
      pedido_id: pedido.id,
      numero_os: numeroOs,
      status: "aberta",
      resumo_operacional: "Resumo operacional pendente. A leitura da IA sera processada a partir do recorte da conversa.",
    })
    .select("*")
    .single();

  if (osError || !osData) {
    return { error: osError?.message ?? "Pedido criado, mas falha ao gerar OS." };
  }

  if (input.sessionId) {
    const slice = await getConversationSlice(db, input.sessionId);
    await db.from("pedido_conversa_recortes").insert({
      pedido_id: pedido.id,
      session_id: input.sessionId,
      ...slice,
    });
  }

  await db.from("pedido_eventos").insert({
    pedido_id: pedido.id,
    actor_user_id: user.id,
    tipo: "pedido_criado_crm",
    to_status: "novo",
    metadata: {
      lead_id: input.leadId ?? null,
      session_id: input.sessionId ?? null,
      existing_cliente: existingCliente,
    },
  });

  revalidatePath("/crm/conversas");
  revalidatePath("/clientes");
  revalidatePath("/pedidos");

  return {
    cliente,
    pedido,
    ordemServico: osData as OrdemServicoRow,
    existingCliente,
  };
}
