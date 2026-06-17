"use server";

import { requireTenantSession } from "@/lib/auth";
import { createTenantClient } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";

export type WhatsAppConnectionRow = {
  id: string;
  provider: string;
  instance_name: string;
  status: "disconnected" | "connecting" | "connected" | "error" | string;
  qr_code: string | null;
  qr_code_updated_at: string | null;
  phone_number: string | null;
  connected_at: string | null;
  disconnected_at: string | null;
  last_sync_at: string | null;
  webhook_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type ActionResult =
  | { error: string; connection?: WhatsAppConnectionRow | null }
  | { connection: WhatsAppConnectionRow };

const DEFAULT_INSTANCE = "default";

function requireUazConfig() {
  const baseUrl = process.env.UAZAPI_BASE_URL?.replace(/\/$/, "");
  const token = process.env.UAZAPI_TOKEN;
  if (!baseUrl || !token) {
    throw new Error("UAZAPI_BASE_URL e UAZAPI_TOKEN precisam estar configurados.");
  }
  return { baseUrl, token };
}

function webhookUrl() {
  const appUrl = process.env.APP_PUBLIC_URL?.replace(/\/$/, "");
  return appUrl ? `${appUrl}/api/webhooks/uazapi` : null;
}

async function uazFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { baseUrl, token } = requireUazConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      token,
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message: unknown }).message)
        : `UazAPI retornou HTTP ${response.status}.`;
    throw new Error(message);
  }

  return payload as T;
}

function findDeepString(value: unknown, names: string[]): string | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findDeepString(item, names);
      if (found) return found;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const [key, item] of Object.entries(record)) {
    if (names.includes(key.toLowerCase()) && typeof item === "string" && item.trim()) {
      return item;
    }
  }

  for (const item of Object.values(record)) {
    const found = findDeepString(item, names);
    if (found) return found;
  }
  return null;
}

function readStatus(payload: unknown) {
  return (
    findDeepString(payload, ["status", "state", "connection", "instance_status"]) ??
    "connecting"
  );
}

function readQrCode(payload: unknown) {
  const raw = findDeepString(payload, [
    "qrcode",
    "qr_code",
    "qr",
    "base64",
    "image",
    "code",
  ]);
  if (!raw) return null;
  if (raw.startsWith("data:image")) return raw;
  if (raw.length > 120 && /^[A-Za-z0-9+/=]+$/.test(raw)) {
    return `data:image/png;base64,${raw}`;
  }
  return raw;
}

function readPhone(payload: unknown) {
  return findDeepString(payload, ["phone", "phone_number", "number", "jid", "wid"]);
}

async function upsertConnection(
  patch: Partial<WhatsAppConnectionRow> & { metadata?: Record<string, unknown> }
): Promise<WhatsAppConnectionRow> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const now = new Date().toISOString();
  const row = {
    provider: "uazapi",
    instance_name: DEFAULT_INSTANCE,
    updated_at: now,
    ...patch,
  };

  const { data, error } = await db
    .from("whatsapp_connections")
    .upsert(row, { onConflict: "provider,instance_name" })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Falha ao salvar conexao WhatsApp.");
  return data as WhatsAppConnectionRow;
}

export async function getWhatsAppConnection(): Promise<WhatsAppConnectionRow | null> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const { data } = await db
    .from("whatsapp_connections")
    .select("*")
    .eq("provider", "uazapi")
    .eq("instance_name", DEFAULT_INSTANCE)
    .maybeSingle();
  return (data as WhatsAppConnectionRow | null) ?? null;
}

export async function configureWhatsAppWebhook(): Promise<ActionResult> {
  try {
    const url = webhookUrl();
    if (!url) return { error: "APP_PUBLIC_URL precisa estar configurada." };

    const payload = await uazFetch<unknown>("/webhook", {
      method: "POST",
      body: JSON.stringify({
        enabled: true,
        url,
        events: ["messages", "connection"],
        excludeMessages: ["wasSentByApi"],
      }),
    });

    const connection = await upsertConnection({
      webhook_url: url,
      last_sync_at: new Date().toISOString(),
      metadata: { webhook: payload },
    });
    revalidatePath("/crm/conversas");
    return { connection };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Falha ao configurar webhook." };
  }
}

export async function connectWhatsApp(): Promise<ActionResult> {
  try {
    const { tenant } = await requireTenantSession();
    const url = webhookUrl();

    if (url) {
      await uazFetch<unknown>("/webhook", {
        method: "POST",
        body: JSON.stringify({
          enabled: true,
          url,
          events: ["messages", "connection"],
          excludeMessages: ["wasSentByApi"],
        }),
      });
    }

    const payload = await uazFetch<unknown>("/instance/connect", {
      method: "POST",
      body: JSON.stringify({
        browser: "auto",
        systemName: tenant.company_name || "Tecidex",
        proxy_managed_country: "br",
        proxy_managed_state: "sp",
        proxy_managed_city: "campinas",
      }),
    });

    const status = readStatus(payload);
    const qrCode = readQrCode(payload);
    const phone = readPhone(payload);

    const connection = await upsertConnection({
      status,
      qr_code: qrCode,
      qr_code_updated_at: qrCode ? new Date().toISOString() : null,
      phone_number: phone,
      connected_at: status === "connected" ? new Date().toISOString() : null,
      disconnected_at: status === "disconnected" ? new Date().toISOString() : null,
      last_sync_at: new Date().toISOString(),
      webhook_url: url,
      metadata: { connect: payload },
    });
    revalidatePath("/crm/conversas");
    return { connection };
  } catch (error) {
    const connection = await upsertConnection({
      status: "error",
      last_sync_at: new Date().toISOString(),
      metadata: { error: error instanceof Error ? error.message : "Erro desconhecido" },
    }).catch(() => null);
    return {
      error: error instanceof Error ? error.message : "Falha ao conectar WhatsApp.",
      connection,
    };
  }
}

export async function syncWhatsAppStatus(): Promise<ActionResult> {
  try {
    const payload = await uazFetch<unknown>("/instance/status", { method: "GET" });
    const status = readStatus(payload);
    const qrCode = readQrCode(payload);
    const phone = readPhone(payload);
    const now = new Date().toISOString();
    const connection = await upsertConnection({
      status,
      qr_code: qrCode,
      qr_code_updated_at: qrCode ? now : undefined,
      phone_number: phone,
      connected_at: status === "connected" ? now : undefined,
      disconnected_at: status === "disconnected" ? now : undefined,
      last_sync_at: now,
      metadata: { status: payload },
    });
    revalidatePath("/crm/conversas");
    return { connection };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Falha ao verificar status." };
  }
}
