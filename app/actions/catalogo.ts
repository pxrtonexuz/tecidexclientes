"use server";

import { requireTenantSession } from "@/lib/auth";
import { createTenantClient } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";

type ActionResult = { error?: string };

// ─── Modelos ─────────────────────────────────────────────────────────────────

export type ModeloRow = {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  atributos: string[];
};

export async function getModelos(): Promise<ModeloRow[]> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const { data, error } = await db
    .from("modelos")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return [];
  return data as ModeloRow[];
}

export async function upsertModelo(data: Omit<ModeloRow, "id"> & { id?: string }): Promise<ActionResult> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const { error } = data.id
    ? await db.from("modelos").update(data).eq("id", data.id)
    : await db.from("modelos").insert(data);
  revalidatePath("/catalogo/modelos");
  return error ? { error: error.message } : {};
}

export async function deleteModelo(id: string): Promise<ActionResult> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const { error } = await db.from("modelos").delete().eq("id", id);
  revalidatePath("/catalogo/modelos");
  return error ? { error: error.message } : {};
}

// ─── Tecidos ─────────────────────────────────────────────────────────────────

export type TecidoRow = {
  id: string;
  nome: string;
  descricao_sensorial: string | null;
  imagem_url: string | null;
  ativo: boolean;
};

export async function getTecidos(): Promise<TecidoRow[]> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const { data, error } = await db
    .from("tecidos")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return [];
  return data as TecidoRow[];
}

export async function upsertTecido(data: Omit<TecidoRow, "id"> & { id?: string }): Promise<ActionResult> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const { error } = data.id
    ? await db.from("tecidos").update(data).eq("id", data.id)
    : await db.from("tecidos").insert(data);
  revalidatePath("/catalogo/tecidos");
  return error ? { error: error.message } : {};
}

export async function deleteTecido(id: string): Promise<ActionResult> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const { error } = await db.from("tecidos").delete().eq("id", id);
  revalidatePath("/catalogo/tecidos");
  return error ? { error: error.message } : {};
}

// ─── Atributos ───────────────────────────────────────────────────────────────

export type AtributoRow = {
  id: string;
  categoria: string;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  ativo: boolean;
};

export async function getAtributos(): Promise<AtributoRow[]> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const { data, error } = await db
    .from("atributos")
    .select("*")
    .order("categoria", { ascending: true });
  if (error) return [];
  return data as AtributoRow[];
}

export async function upsertAtributo(data: Omit<AtributoRow, "id"> & { id?: string }): Promise<ActionResult> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const { error } = data.id
    ? await db.from("atributos").update(data).eq("id", data.id)
    : await db.from("atributos").insert(data);
  revalidatePath("/catalogo/atributos");
  return error ? { error: error.message } : {};
}

export async function deleteAtributo(id: string): Promise<ActionResult> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const { error } = await db.from("atributos").delete().eq("id", id);
  revalidatePath("/catalogo/atributos");
  return error ? { error: error.message } : {};
}
