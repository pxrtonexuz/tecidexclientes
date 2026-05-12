"use server";

import { requireTenantSession } from "@/lib/auth";
import { createTenantClient } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";

export type AgentConfigRow = {
  id: string;
  ativo: boolean;
  ultima_atividade: string;
};

export async function getAgentConfig(): Promise<AgentConfigRow | null> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const { data, error } = await db
    .from("agent_config")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  if (error || !data) return null;
  return data as AgentConfigRow;
}

export async function toggleAgentAtivo(id: string, ativo: boolean) {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  await db
    .from("agent_config")
    .update({ ativo, ultima_atividade: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/atendente/saude");
}

// Extrai o número de telefone puro do session_id do n8n/UazAPI.
// Formato esperado: "5511999998888@s.whatsapp.net" ou "5511999998888"
function extractPhone(sessionId: string): string {
  return sessionId.split("@")[0].replace(/\D/g, "");
}

export async function pausarConversaIA(sessionId: string) {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const telefone = extractPhone(sessionId);
  await db
    .from("dados_cliente")
    .update({ atendimento_ia: "pause" })
    .eq("telefone", telefone);
}

export async function reativarConversaIA(sessionId: string) {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const telefone = extractPhone(sessionId);
  await db
    .from("dados_cliente")
    .update({ atendimento_ia: "reativada" })
    .eq("telefone", telefone);
}

// ─── Chat (n8n_chat_histories) ────────────────────────────────────────────────

type RawMessage = {
  id: number;
  session_id: string;
  message: { type: "human" | "ai"; content: string };
};

export type ConversaData = {
  session_id: string;
  clientName: string;
  status: "ativa" | "concluida" | "pausada";
  lastMessage: string | null;
  messages: { id: string; from: "cliente" | "agente"; text: string; at: string | null }[];
};

// Formata session_id como número de telefone legível quando possível.
function formatClientName(sessionId: string): string {
  const digits = sessionId.split("@")[0].replace(/\D/g, "");
  // Número brasileiro com código de país: 5511999998888 (13 dígitos) ou 551199998888 (12)
  if (digits.length === 13 && digits.startsWith("55")) {
    const local = digits.slice(2);
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (digits.length === 12 && digits.startsWith("55")) {
    const local = digits.slice(2);
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  // Se não for número brasileiro reconhecível, retorna o session_id sem o sufixo
  return sessionId.split("@")[0];
}

export async function getChatConversations(): Promise<ConversaData[]> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);

  const { data, error } = await db
    .from("n8n_chat_histories")
    .select("id, session_id, message")
    .order("id", { ascending: true });

  if (error || !data) return [];

  const rows = data as RawMessage[];

  const grouped = new Map<string, RawMessage[]>();
  for (const row of rows) {
    if (!grouped.has(row.session_id)) grouped.set(row.session_id, []);
    grouped.get(row.session_id)!.push(row);
  }

  const lastGlobalId = rows[rows.length - 1]?.id ?? 0;

  return Array.from(grouped.entries()).map(([session_id, msgs]) => {
    const lastId = msgs[msgs.length - 1].id;
    // Considera ativa se está entre as últimas 50 mensagens globais
    const isRecent = lastId > lastGlobalId - 50;

    return {
      session_id,
      clientName: formatClientName(session_id),
      status: isRecent ? "ativa" : "concluida",
      lastMessage: null, // n8n_chat_histories não tem created_at
      messages: msgs.map((m) => ({
        id: String(m.id),
        from: m.message.type === "human" ? "cliente" : "agente",
        text: m.message.content ?? "",
        at: null, // sem timestamp no banco
      })),
    };
  });
}
