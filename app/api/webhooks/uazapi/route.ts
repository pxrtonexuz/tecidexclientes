import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type TenantRow = {
  id: string;
  company_name: string | null;
  supabase_url: string;
  supabase_anon_key: string;
};

type ParsedMessage = {
  eventType: string | null;
  externalMessageId: string | null;
  sessionId: string | null;
  telefone: string | null;
  content: string;
  direction: "inbound" | "outbound";
  senderType: "cliente" | "agente" | "ia";
  sentAt: string;
};

function masterClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function tenantClient(tenant: TenantRow) {
  return createClient(tenant.supabase_url, tenant.supabase_anon_key, { auth: { persistSession: false } });
}

function walk(value: unknown, visitor: (key: string, item: unknown) => string | null): string | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = walk(item, visitor);
      if (found) return found;
    }
    return null;
  }

  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const found = visitor(key, item);
    if (found) return found;
  }

  for (const item of Object.values(value as Record<string, unknown>)) {
    const found = walk(item, visitor);
    if (found) return found;
  }
  return null;
}

function findString(payload: unknown, keys: string[]) {
  const normalized = keys.map((key) => key.toLowerCase());
  return walk(payload, (key, item) => {
    if (!normalized.includes(key.toLowerCase())) return null;
    if (typeof item === "string" && item.trim()) return item.trim();
    if (typeof item === "number") return String(item);
    return null;
  });
}

function findBoolean(payload: unknown, keys: string[]) {
  const normalized = keys.map((key) => key.toLowerCase());
  let value: boolean | null = null;
  walk(payload, (key, item) => {
    if (!normalized.includes(key.toLowerCase()) || typeof item !== "boolean") return null;
    value = item;
    return item ? "__true__" : "__false__";
  });
  return value;
}

function normalizePhone(value: string | null) {
  if (!value) return null;
  const digits = value.split("@")[0].replace(/\D/g, "");
  if (!digits) return null;
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function readTimestamp(payload: unknown) {
  const raw = findString(payload, ["timestamp", "messageTimestamp", "time", "date"]);
  if (!raw) return new Date().toISOString();
  const numeric = Number(raw);
  if (!Number.isNaN(numeric)) {
    return new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric).toISOString();
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function parseMessage(payload: unknown): ParsedMessage {
  const eventType = findString(payload, ["event", "type", "eventType", "action"]);
  const content =
    findString(payload, ["body", "text", "content", "conversation", "caption", "messageText"]) ?? "";
  const jid =
    findString(payload, ["remoteJid", "jid", "chatId", "from", "to", "phone", "number"]) ?? null;
  const telefone = normalizePhone(jid);
  const sessionId = telefone ? `${telefone}@s.whatsapp.net` : null;
  const fromMe = findBoolean(payload, ["fromMe", "wasSentByApi", "from_api"]);
  const direction = fromMe ? "outbound" : "inbound";

  return {
    eventType,
    externalMessageId: findString(payload, ["messageId", "msgId", "wamid", "id"]),
    sessionId,
    telefone,
    content,
    direction,
    senderType: direction === "inbound" ? "cliente" : "ia",
    sentAt: readTimestamp(payload),
  };
}

async function fetchTenants() {
  const client = masterClient();
  if (!client) return [];
  const { data, error } = await client
    .from("tenants")
    .select("id, company_name, supabase_url, supabase_anon_key");
  if (error || !data) {
    console.error("[uazapi:webhook] tenants lookup failed", error?.message);
    return [];
  }
  return data as TenantRow[];
}

async function resolveTenant(tenants: TenantRow[]) {
  const preferredId = process.env.UAZAPI_TENANT_ID;
  if (preferredId) {
    const preferred = tenants.find((tenant) => tenant.id === preferredId);
    if (preferred) return preferred;
  }

  for (const tenant of tenants) {
    const db = tenantClient(tenant);
    const { data, error } = await db
      .from("whatsapp_connections")
      .select("id")
      .eq("provider", "uazapi")
      .limit(1);
    if (!error && data && data.length > 0) return tenant;
  }

  return tenants.length === 1 ? tenants[0] : null;
}

async function persistMessage(tenant: TenantRow, payload: unknown, parsed: ParsedMessage) {
  const db = tenantClient(tenant);
  const eventLog = await db
    .from("chat_webhook_events")
    .insert({
      provider: "uazapi",
      event_type: parsed.eventType,
      external_message_id: parsed.externalMessageId,
      session_id: parsed.sessionId,
      payload,
    })
    .select("id")
    .maybeSingle();

  if (!parsed.sessionId || !parsed.telefone) {
    if (eventLog.data?.id) {
      await db
        .from("chat_webhook_events")
        .update({ processed: false, error: "Evento sem telefone/session_id." })
        .eq("id", eventLog.data.id);
    }
    return { stored: false, reason: "missing-session" };
  }

  if (!parsed.content.trim()) {
    if (eventLog.data?.id) {
      await db
        .from("chat_webhook_events")
        .update({ processed: false, error: "Evento sem texto de mensagem." })
        .eq("id", eventLog.data.id);
    }
    return { stored: false, reason: "missing-content" };
  }

  const preview = parsed.content.slice(0, 220);
  const conversation = await db
    .from("chat_conversations")
    .upsert(
      {
        session_id: parsed.sessionId,
        telefone: parsed.telefone,
        status: "ativa",
        last_message_at: parsed.sentAt,
        last_message_preview: preview,
        source: "whatsapp",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id" }
    )
    .select("id")
    .single();

  if (conversation.error || !conversation.data) {
    if (eventLog.data?.id) {
      await db
        .from("chat_webhook_events")
        .update({ processed: false, error: conversation.error?.message ?? "Falha ao salvar conversa." })
        .eq("id", eventLog.data.id);
    }
    throw conversation.error ?? new Error("Falha ao salvar conversa.");
  }

  const messageRow = {
    conversation_id: conversation.data.id,
    session_id: parsed.sessionId,
    external_message_id: parsed.externalMessageId,
    direction: parsed.direction,
    sender_type: parsed.senderType,
    content: parsed.content,
    payload,
    sent_at: parsed.sentAt,
  };

  const messageResult = parsed.externalMessageId
    ? await db.from("chat_messages").upsert(messageRow, { onConflict: "external_message_id" })
    : await db.from("chat_messages").insert(messageRow);

  if (messageResult.error) {
    if (eventLog.data?.id) {
      await db
        .from("chat_webhook_events")
        .update({ processed: false, error: messageResult.error.message })
        .eq("id", eventLog.data.id);
    }
    throw messageResult.error;
  }

  await db.from("n8n_chat_histories").insert({
    session_id: parsed.sessionId,
    message: {
      type: parsed.direction === "inbound" ? "human" : "ai",
      content: parsed.content,
    },
  });

  if (eventLog.data?.id) {
    await db.from("chat_webhook_events").update({ processed: true }).eq("id", eventLog.data.id);
  }

  return { stored: true };
}

export async function POST(request: Request) {
  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const parsed = parseMessage(payload);
  const tenants = await fetchTenants();
  const tenant = await resolveTenant(tenants);

  if (!tenant) {
    console.error("[uazapi:webhook] no tenant resolved", JSON.stringify(payload));
    return NextResponse.json({ ok: true, stored: false, reason: "tenant-not-found" });
  }

  try {
    const result = await persistMessage(tenant, payload, parsed);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[uazapi:webhook] persist failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "webhook-persist-failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "uazapi-webhook" });
}
