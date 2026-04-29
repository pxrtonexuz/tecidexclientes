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

export async function pausarConversaIA(telefone: string) {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  await db
    .from("dados_cliente")
    .update({ atendimento_ia: "pause" })
    .eq("telefone", telefone);
}

export async function reativarConversaIA(telefone: string) {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
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
  lastMessage: string;
  messages: { id: string; from: "cliente" | "agente"; text: string; at: string }[];
};

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

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  return Array.from(grouped.entries()).map(([session_id, msgs]) => {
    const last = msgs[msgs.length - 1];
    const lastId = last.id;
    const estimatedTime = new Date(cutoff + (lastId / 10000) * cutoff).toISOString();
    const isRecent = lastId > (rows[rows.length - 1]?.id ?? 0) - 50;

    return {
      session_id,
      clientName: session_id,
      status: isRecent ? "ativa" : "concluida",
      lastMessage: estimatedTime,
      messages: msgs.map((m) => ({
        id: String(m.id),
        from: m.message.type === "human" ? "cliente" : "agente",
        text: m.message.content ?? "",
        at: estimatedTime,
      })),
    };
  });
}
