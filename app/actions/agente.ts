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
    .order("created_at", { ascending: false })
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

type ChatConversationRow = {
  session_id: string;
  telefone: string | null;
  nome: string | null;
  status: "ativa" | "concluida" | "pausada" | string;
  last_message_at: string | null;
  last_message_preview: string | null;
};

type ChatMessageRow = {
  id: string;
  session_id: string;
  sender_type: "cliente" | "agente" | "ia" | "sistema" | string;
  content: string | null;
  sent_at: string | null;
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

function toConversaStatus(status: string | null | undefined): "ativa" | "concluida" | "pausada" {
  if (status === "pausada" || status === "concluida") return status;
  return "ativa";
}

async function getStructuredChatConversations(db: ReturnType<typeof createTenantClient>): Promise<ConversaData[] | null> {
  const conversationsResult = await db
    .from("chat_conversations")
    .select("session_id, telefone, nome, status, last_message_at, last_message_preview")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(200);

  if (conversationsResult.error) return null;
  const conversations = (conversationsResult.data ?? []) as ChatConversationRow[];
  if (conversations.length === 0) return [];

  const sessionIds = conversations.map((row) => row.session_id);
  const messagesResult = await db
    .from("chat_messages")
    .select("id, session_id, sender_type, content, sent_at")
    .in("session_id", sessionIds)
    .order("sent_at", { ascending: true })
    .limit(1200);

  const messages = (messagesResult.data ?? []) as ChatMessageRow[];
  const grouped = new Map<string, ChatMessageRow[]>();
  for (const message of messages) {
    if (!grouped.has(message.session_id)) grouped.set(message.session_id, []);
    grouped.get(message.session_id)!.push(message);
  }

  return conversations.map((conversation) => ({
    session_id: conversation.session_id,
    clientName: conversation.nome || formatClientName(conversation.session_id),
    status: toConversaStatus(conversation.status),
    lastMessage: conversation.last_message_at,
    messages: (grouped.get(conversation.session_id) ?? []).map((message) => ({
      id: message.id,
      from: message.sender_type === "cliente" ? "cliente" : "agente",
      text: message.content ?? "",
      at: message.sent_at,
    })),
  }));
}

export async function getChatConversations(): Promise<ConversaData[]> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);

  const structured = await getStructuredChatConversations(db);
  if (structured) return structured;

  const [histResult, pauseResult] = await Promise.all([
    db
      .from("n8n_chat_histories")
      .select("id, session_id, message")
      .order("id", { ascending: false })
      .limit(400),
    db
      .from("dados_cliente")
      .select("telefone, atendimento_ia")
      .eq("atendimento_ia", "pause"),
  ]);

  if (histResult.error || !histResult.data) return [];

  // IDs dos telefones atualmente pausados no banco
  const pausedPhones = new Set<string>(
    (pauseResult.data ?? []).map((r: { telefone: string }) => r.telefone)
  );

  // Vem em ordem DESC — inverte para ordem cronológica por conversa
  const rows = (histResult.data as RawMessage[]).reverse();

  const grouped = new Map<string, RawMessage[]>();
  for (const row of rows) {
    if (!grouped.has(row.session_id)) grouped.set(row.session_id, []);
    grouped.get(row.session_id)!.push(row);
  }

  const maxId = rows[rows.length - 1]?.id ?? 0;

  return Array.from(grouped.entries()).map(([session_id, msgs]) => {
    const lastId = msgs[msgs.length - 1].id;
    const isRecent = lastId > maxId - 50;
    const phone = extractPhone(session_id);
    const isPaused = pausedPhones.has(phone);

    return {
      session_id,
      clientName: formatClientName(session_id),
      status: isPaused ? "pausada" : isRecent ? "ativa" : "concluida",
      lastMessage: null,
      messages: msgs.map((m) => ({
        id: String(m.id),
        from: m.message.type === "human" ? "cliente" : "agente",
        text: m.message.content ?? "",
        at: null,
      })),
    };
  });
}
