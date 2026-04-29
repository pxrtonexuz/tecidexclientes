"use server";

import { requireTenantSession } from "@/lib/auth";
import { createTenantClient } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";

export type LeadRow = {
  id: string;
  nome: string;
  telefone: string | null;
  modelo: string | null;
  status: string;
  valor: number | null;
  ultima_interacao: string;
  observacoes: string | null;
  created_at: string;
};

export async function getLeads(): Promise<LeadRow[]> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const { data, error } = await db
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data as LeadRow[];
}

export async function updateLeadStatus(id: string, status: string) {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  await db
    .from("leads")
    .update({ status, ultima_interacao: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/crm/kanban");
  revalidatePath("/crm/leads");
}

export async function updateLeadModelo(id: string, modelo: string) {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  await db.from("leads").update({ modelo }).eq("id", id);
  revalidatePath("/crm/leads");
}

export async function updateLeadValor(id: string, valor: number | null) {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  await db.from("leads").update({ valor }).eq("id", id);
  revalidatePath("/crm/leads");
}

export async function updateLeadObservacoes(id: string, observacoes: string) {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  await db.from("leads").update({ observacoes }).eq("id", id);
  revalidatePath("/crm/leads");
}
