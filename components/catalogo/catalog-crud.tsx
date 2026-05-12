"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  upsertModelo, deleteModelo, type ModeloRow,
  upsertTecido, deleteTecido, type TecidoRow,
  upsertAtributo, deleteAtributo, type AtributoRow,
} from "@/app/actions/catalogo";

export type ModelItem = { id: string; nome: string; descricao: string; ativo: boolean; atributos: string[] };
export type TecidoItem = { id: string; nome: string; descricaoSensorial: string; imagemUrl: string; ativo: boolean };
export type AtributoCategory = "Gola" | "Manga" | "Punho" | "Escudo" | "Acabamento" | "Outro";
export type AtributoItem = { id: string; categoria: AtributoCategory; nome: string; descricao: string; imagemUrl: string; ativo: boolean };

// ─── Shared glass styles ──────────────────────────────────────────────────────

const glassTable: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.04)",
  backdropFilter: "blur(22px) saturate(160%)",
  WebkitBackdropFilter: "blur(22px) saturate(160%)",
  border: "1px solid rgba(255, 255, 255, 0.11)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
};

const glassDialog: React.CSSProperties = {
  background: "rgba(5, 12, 8, 0.96)",
  border: "1px solid rgba(57, 217, 138, 0.22)",
  backdropFilter: "blur(40px)",
};

const thStyle: React.CSSProperties = {
  color: "rgba(160, 210, 185, 0.65)",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
};

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────

function ConfirmDeleteDialog({
  label, open, onConfirm, onCancel,
}: { label: string; open: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent style={glassDialog} className="text-foreground max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Remover <span className="text-foreground font-medium">&quot;{label}&quot;</span>? Esta ação não pode ser desfeita.
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} className="cursor-pointer">Cancelar</Button>
          <Button
            onClick={onConfirm}
            className="cursor-pointer bg-red-600 hover:bg-red-700 text-white border-0"
          >
            Remover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modelos ─────────────────────────────────────────────────────────────────

function rowToModel(r: ModeloRow): ModelItem {
  return { id: r.id, nome: r.nome, descricao: r.descricao ?? "", ativo: r.ativo, atributos: r.atributos ?? [] };
}

function ModelDialog({
  open, onClose, onSave, initial,
}: { open: boolean; onClose: () => void; onSave: (m: Omit<ModelItem, "id">) => void; initial?: ModelItem }) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [ativo, setAtivo] = useState(initial?.ativo ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({ nome, descricao, ativo, atributos: initial?.atributos ?? [] });
    setSaving(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={glassDialog} className="text-foreground">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Modelo" : "Novo Modelo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)}
              style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.11)" }} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)}
              style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.11)" }}
              className="resize-none" rows={3} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={ativo} onCheckedChange={setAtivo} />
            <Label className="cursor-pointer">{ativo ? "Ativo (visível no agente)" : "Inativo (oculto no agente)"}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="cursor-pointer">Cancelar</Button>
          <Button onClick={handleSave} disabled={!nome || saving} className="cursor-pointer">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ModelosCrud({ initialModelos }: { initialModelos: ModeloRow[] }) {
  const [items, setItems] = useState<ModelItem[]>(initialModelos.map(rowToModel));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ModelItem | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nome: string } | null>(null);
  const [, startTransition] = useTransition();

  function openNew() { setEditing(undefined); setDialogOpen(true); }
  function openEdit(m: ModelItem) { setEditing(m); setDialogOpen(true); }

  async function handleSave(data: Omit<ModelItem, "id">) {
    const id = editing?.id;
    const row = { id, nome: data.nome, descricao: data.descricao, ativo: data.ativo, atributos: data.atributos };
    if (id) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
    } else {
      setItems((prev) => [...prev, { ...data, id: crypto.randomUUID() }]);
    }
    startTransition(async () => {
      const res = await upsertModelo(row);
      if ((res as { error?: string })?.error) toast.error("Falha ao salvar modelo.");
      else toast.success(id ? "Modelo atualizado." : "Modelo criado.");
    });
  }

  function toggleAtivo(item: ModelItem) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ativo: !i.ativo } : i)));
    startTransition(() => { upsertModelo({ id: item.id, nome: item.nome, descricao: item.descricao, ativo: !item.ativo, atributos: item.atributos }); });
  }

  function execDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      const res = await deleteModelo(id);
      if ((res as { error?: string })?.error) toast.error("Falha ao remover modelo.");
      else toast.success("Modelo removido.");
    });
    setConfirmDelete(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} className="gap-2 cursor-pointer"><Plus className="w-4 h-4" /> Novo Modelo</Button>
      </div>
      <div className="rounded-[16px] overflow-hidden" style={glassTable}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(255, 255, 255, 0.06)", borderBottom: "1px solid rgba(255, 255, 255, 0.10)" }}>
              {["Nome", "Descrição", "Status", "Ações"].map((h, i) => (
                <th key={h} className={cn("px-4 py-3", i === 3 ? "text-right" : "text-left")} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="transition-colors duration-150 last:border-0"
                style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255, 255, 255, 0.045)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                <td className="px-4 py-3 font-medium text-foreground">{item.nome}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{item.descricao}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={item.ativo} onCheckedChange={() => toggleAtivo(item)} />
                    <span className={cn("text-xs", item.ativo ? "text-[#39d98a]" : "text-muted-foreground")}>
                      {item.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="w-7 h-7 cursor-pointer" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive cursor-pointer"
                      onClick={() => setConfirmDelete({ id: item.id, nome: item.nome })}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">Nenhum modelo cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <ModelDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} initial={editing} />
      <ConfirmDeleteDialog
        label={confirmDelete?.nome ?? ""}
        open={!!confirmDelete}
        onConfirm={() => confirmDelete && execDelete(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ─── Tecidos ─────────────────────────────────────────────────────────────────

function rowToTecido(r: TecidoRow): TecidoItem {
  return { id: r.id, nome: r.nome, descricaoSensorial: r.descricao_sensorial ?? "", imagemUrl: r.imagem_url ?? "", ativo: r.ativo };
}

export function TecidosCrud({ initialTecidos }: { initialTecidos: TecidoRow[] }) {
  const [items, setItems] = useState<TecidoItem[]>(initialTecidos.map(rowToTecido));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TecidoItem | undefined>();
  const [form, setForm] = useState({ nome: "", descricaoSensorial: "", imagemUrl: "", ativo: true });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nome: string } | null>(null);
  const [, startTransition] = useTransition();

  function openNew() { setEditing(undefined); setForm({ nome: "", descricaoSensorial: "", imagemUrl: "", ativo: true }); setDialogOpen(true); }
  function openEdit(t: TecidoItem) { setEditing(t); setForm({ nome: t.nome, descricaoSensorial: t.descricaoSensorial, imagemUrl: t.imagemUrl, ativo: t.ativo }); setDialogOpen(true); }

  async function handleSave() {
    setSaving(true);
    const row = { id: editing?.id, nome: form.nome, descricao_sensorial: form.descricaoSensorial, imagem_url: form.imagemUrl || null, ativo: form.ativo };
    if (editing) {
      setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...form } : i)));
    } else {
      setItems((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
    }
    startTransition(async () => {
      const res = await upsertTecido(row);
      if ((res as { error?: string })?.error) toast.error("Falha ao salvar tecido.");
      else toast.success(editing ? "Tecido atualizado." : "Tecido criado.");
    });
    setSaving(false);
    setDialogOpen(false);
  }

  function execDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      const res = await deleteTecido(id);
      if ((res as { error?: string })?.error) toast.error("Falha ao remover tecido.");
      else toast.success("Tecido removido.");
    });
    setConfirmDelete(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} className="gap-2 cursor-pointer"><Plus className="w-4 h-4" /> Novo Tecido</Button>
      </div>
      <div className="rounded-[16px] overflow-hidden" style={glassTable}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(255, 255, 255, 0.06)", borderBottom: "1px solid rgba(255, 255, 255, 0.10)" }}>
              {["Nome", "Descrição sensorial", "Status", "Ações"].map((h, i) => (
                <th key={h} className={cn("px-4 py-3", i === 3 ? "text-right" : "text-left")} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="transition-colors duration-150 last:border-0"
                style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255, 255, 255, 0.045)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                <td className="px-4 py-3 font-medium text-foreground">{item.nome}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{item.descricaoSensorial}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("text-xs border", item.ativo ? "bg-[#39d98a]/15 text-[#39d98a] border-[#39d98a]/20" : "bg-muted text-muted-foreground border-border")}>
                    {item.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="w-7 h-7 cursor-pointer" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive cursor-pointer"
                      onClick={() => setConfirmDelete({ id: item.id, nome: item.nome })}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">Nenhum tecido cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent style={glassDialog} className="text-foreground">
          <DialogHeader><DialogTitle>{editing ? "Editar Tecido" : "Novo Tecido"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.11)" }} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição sensorial</Label>
              <Textarea value={form.descricaoSensorial} onChange={(e) => setForm((f) => ({ ...f, descricaoSensorial: e.target.value }))}
                style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.11)" }}
                className="resize-none" rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>URL da imagem de referência</Label>
              <Input value={form.imagemUrl} onChange={(e) => setForm((f) => ({ ...f, imagemUrl: e.target.value }))} placeholder="https://..."
                style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.11)" }} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))} />
              <Label>{form.ativo ? "Ativo" : "Inativo"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome || saving} className="cursor-pointer">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        label={confirmDelete?.nome ?? ""}
        open={!!confirmDelete}
        onConfirm={() => confirmDelete && execDelete(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ─── Atributos ────────────────────────────────────────────────────────────────

const atributoCategories: AtributoCategory[] = ["Gola", "Manga", "Punho", "Escudo", "Acabamento", "Outro"];

function rowToAtributo(r: AtributoRow): AtributoItem {
  return { id: r.id, categoria: r.categoria as AtributoCategory, nome: r.nome, descricao: r.descricao ?? "", imagemUrl: r.imagem_url ?? "", ativo: r.ativo };
}

export function AtributosCrud({ initialAtributos }: { initialAtributos: AtributoRow[] }) {
  const [items, setItems] = useState<AtributoItem[]>(initialAtributos.map(rowToAtributo));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AtributoItem | undefined>();
  const [form, setForm] = useState<Omit<AtributoItem, "id">>({ categoria: "Gola", nome: "", descricao: "", imagemUrl: "", ativo: true });
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AtributoCategory | "all">("all");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nome: string } | null>(null);
  const [, startTransition] = useTransition();

  const filtered = activeCategory === "all" ? items : items.filter((i) => i.categoria === activeCategory);

  function openNew() { setEditing(undefined); setForm({ categoria: "Gola", nome: "", descricao: "", imagemUrl: "", ativo: true }); setDialogOpen(true); }
  function openEdit(a: AtributoItem) { setEditing(a); setForm({ categoria: a.categoria, nome: a.nome, descricao: a.descricao, imagemUrl: a.imagemUrl, ativo: a.ativo }); setDialogOpen(true); }

  async function handleSave() {
    setSaving(true);
    const row = { id: editing?.id, categoria: form.categoria, nome: form.nome, descricao: form.descricao, imagem_url: form.imagemUrl || null, ativo: form.ativo };
    if (editing) {
      setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...form } : i)));
    } else {
      setItems((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
    }
    startTransition(async () => {
      const res = await upsertAtributo(row);
      if ((res as { error?: string })?.error) toast.error("Falha ao salvar atributo.");
      else toast.success(editing ? "Atributo atualizado." : "Atributo criado.");
    });
    setSaving(false);
    setDialogOpen(false);
  }

  function execDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      const res = await deleteAtributo(id);
      if ((res as { error?: string })?.error) toast.error("Falha ao remover atributo.");
      else toast.success("Atributo removido.");
    });
    setConfirmDelete(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div
          className="flex items-center gap-1 p-1 rounded-[12px] flex-wrap"
          style={{ background: "rgba(255, 255, 255, 0.045)", border: "1px solid rgba(255, 255, 255, 0.10)" }}
        >
          {(["all", ...atributoCategories] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn("px-3 py-1.5 rounded-[9px] text-xs font-medium transition-all duration-180 cursor-pointer",
                activeCategory !== cat && "text-muted-foreground hover:text-foreground")}
              style={activeCategory === cat ? { background: "#0f6b3f", color: "#fff", boxShadow: "0 0 10px rgba(57,217,138,0.20)" } : undefined}
            >
              {cat === "all" ? "Todos" : cat}
            </button>
          ))}
        </div>
        <Button onClick={openNew} className="gap-2 cursor-pointer"><Plus className="w-4 h-4" /> Novo Atributo</Button>
      </div>

      <div className="rounded-[16px] overflow-hidden" style={glassTable}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(255, 255, 255, 0.06)", borderBottom: "1px solid rgba(255, 255, 255, 0.10)" }}>
              {["Categoria", "Nome", "Descrição", "Status", "Ações"].map((h, i) => (
                <th key={h} className={cn("px-4 py-3", i === 4 ? "text-right" : "text-left")} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="transition-colors duration-150 last:border-0"
                style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255, 255, 255, 0.045)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: "rgba(255, 255, 255, 0.09)", border: "1px solid rgba(57, 217, 138, 0.22)", color: "#39d98a" }}>
                    {item.categoria}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{item.nome}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{item.descricao}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("text-xs border", item.ativo ? "bg-[#39d98a]/15 text-[#39d98a] border-[#39d98a]/20" : "bg-muted text-muted-foreground border-border")}>
                    {item.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="w-7 h-7 cursor-pointer" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive cursor-pointer"
                      onClick={() => setConfirmDelete({ id: item.id, nome: item.nome })}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Nenhum atributo encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent style={glassDialog} className="text-foreground">
          <DialogHeader><DialogTitle>{editing ? "Editar Atributo" : "Novo Atributo"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as AtributoCategory }))}
                className="w-full rounded-md px-3 py-2 text-sm text-foreground cursor-pointer"
                style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.11)" }}>
                {atributoCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.11)" }} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.11)" }}
                className="resize-none" rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>URL da imagem de referência</Label>
              <Input value={form.imagemUrl} onChange={(e) => setForm((f) => ({ ...f, imagemUrl: e.target.value }))} placeholder="https://..."
                style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.11)" }} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))} />
              <Label>{form.ativo ? "Ativo" : "Inativo"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome || saving} className="cursor-pointer">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        label={confirmDelete?.nome ?? ""}
        open={!!confirmDelete}
        onConfirm={() => confirmDelete && execDelete(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
