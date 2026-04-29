"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  upsertModelo, deleteModelo, type ModeloRow,
  upsertTecido, deleteTecido, type TecidoRow,
  upsertAtributo, deleteAtributo, type AtributoRow,
} from "@/app/actions/catalogo";

// ─── Re-export types for external use ────────────────────────────────────────

export type ModelItem = { id: string; nome: string; descricao: string; ativo: boolean; atributos: string[] };
export type TecidoItem = { id: string; nome: string; descricaoSensorial: string; imagemUrl: string; ativo: boolean };
export type AtributoCategory = "Gola" | "Manga" | "Punho" | "Escudo" | "Acabamento" | "Outro";
export type AtributoItem = { id: string; categoria: AtributoCategory; nome: string; descricao: string; imagemUrl: string; ativo: boolean };

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
      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Modelo" : "Novo Modelo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} className="bg-muted border-border" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="bg-muted border-border resize-none" rows={3} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={ativo} onCheckedChange={setAtivo} />
            <Label className="cursor-pointer">{ativo ? "Ativo (visível no agente)" : "Inativo (oculto no agente)"}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="cursor-pointer">Cancelar</Button>
          <Button onClick={handleSave} disabled={!nome || saving} className="cursor-pointer">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Salvar
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
  const [, startTransition] = useTransition();

  function openNew() { setEditing(undefined); setDialogOpen(true); }
  function openEdit(m: ModelItem) { setEditing(m); setDialogOpen(true); }

  async function handleSave(data: Omit<ModelItem, "id">) {
    const id = editing?.id;
    const row = { id, nome: data.nome, descricao: data.descricao, ativo: data.ativo, atributos: data.atributos };
    if (id) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
    } else {
      const tempId = crypto.randomUUID();
      setItems((prev) => [...prev, { ...data, id: tempId }]);
    }
    startTransition(() => { upsertModelo(row); });
  }

  function toggleAtivo(item: ModelItem) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ativo: !i.ativo } : i)));
    startTransition(() => { upsertModelo({ id: item.id, nome: item.nome, descricao: item.descricao, ativo: !item.ativo, atributos: item.atributos }); });
  }

  function remove(id: string) {
    if (!confirm("Remover este modelo?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(() => { deleteModelo(id); });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} className="gap-2 cursor-pointer">
          <Plus className="w-4 h-4" /> Novo Modelo
        </Button>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{item.nome}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{item.descricao}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={item.ativo} onCheckedChange={() => toggleAtivo(item)} />
                    <span className={cn("text-xs", item.ativo ? "text-emerald-400" : "text-muted-foreground")}>
                      {item.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="w-7 h-7 cursor-pointer" onClick={() => openEdit(item)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive cursor-pointer" onClick={() => remove(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhum modelo cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ModelDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} initial={editing} />
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
  const [, startTransition] = useTransition();

  function openNew() {
    setEditing(undefined);
    setForm({ nome: "", descricaoSensorial: "", imagemUrl: "", ativo: true });
    setDialogOpen(true);
  }
  function openEdit(t: TecidoItem) {
    setEditing(t);
    setForm({ nome: t.nome, descricaoSensorial: t.descricaoSensorial, imagemUrl: t.imagemUrl, ativo: t.ativo });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const row = { id: editing?.id, nome: form.nome, descricao_sensorial: form.descricaoSensorial, imagem_url: form.imagemUrl || null, ativo: form.ativo };
    if (editing) {
      setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...form } : i)));
    } else {
      setItems((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
    }
    startTransition(() => { upsertTecido(row); });
    setSaving(false);
    setDialogOpen(false);
  }

  function remove(id: string) {
    if (!confirm("Remover este tecido?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(() => { deleteTecido(id); });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} className="gap-2 cursor-pointer">
          <Plus className="w-4 h-4" /> Novo Tecido
        </Button>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição sensorial</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{item.nome}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{item.descricaoSensorial}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("text-xs border", item.ativo ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground border-border")}>
                    {item.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="w-7 h-7 cursor-pointer" onClick={() => openEdit(item)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive cursor-pointer" onClick={() => remove(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhum tecido cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Tecido" : "Novo Tecido"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="bg-muted border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição sensorial</Label>
              <Textarea value={form.descricaoSensorial} onChange={(e) => setForm((f) => ({ ...f, descricaoSensorial: e.target.value }))} className="bg-muted border-border resize-none" rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>URL da imagem de referência</Label>
              <Input value={form.imagemUrl} onChange={(e) => setForm((f) => ({ ...f, imagemUrl: e.target.value }))} placeholder="https://..." className="bg-muted border-border" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))} />
              <Label>{form.ativo ? "Ativo" : "Inativo"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome || saving} className="cursor-pointer">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const [, startTransition] = useTransition();

  const filtered = activeCategory === "all" ? items : items.filter((i) => i.categoria === activeCategory);

  function openNew() {
    setEditing(undefined);
    setForm({ categoria: "Gola", nome: "", descricao: "", imagemUrl: "", ativo: true });
    setDialogOpen(true);
  }
  function openEdit(a: AtributoItem) {
    setEditing(a);
    setForm({ categoria: a.categoria, nome: a.nome, descricao: a.descricao, imagemUrl: a.imagemUrl, ativo: a.ativo });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const row = { id: editing?.id, categoria: form.categoria, nome: form.nome, descricao: form.descricao, imagem_url: form.imagemUrl || null, ativo: form.ativo };
    if (editing) {
      setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...form } : i)));
    } else {
      setItems((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
    }
    startTransition(() => { upsertAtributo(row); });
    setSaving(false);
    setDialogOpen(false);
  }

  function remove(id: string) {
    if (!confirm("Remover este atributo?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(() => { deleteAtributo(id); });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {(["all", ...atributoCategories] as const).map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              className={cn("cursor-pointer text-xs", activeCategory !== cat && "border-border text-muted-foreground hover:text-foreground")}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === "all" ? "Todos" : cat}
            </Button>
          ))}
        </div>
        <Button onClick={openNew} className="gap-2 cursor-pointer">
          <Plus className="w-4 h-4" /> Novo Atributo
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoria</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Badge className="bg-primary/15 text-primary border-primary/20 text-xs border">{item.categoria}</Badge>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{item.nome}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{item.descricao}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("text-xs border", item.ativo ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground border-border")}>
                    {item.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="w-7 h-7 cursor-pointer" onClick={() => openEdit(item)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive cursor-pointer" onClick={() => remove(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhum atributo encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Atributo" : "Novo Atributo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <select
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as AtributoCategory }))}
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground cursor-pointer"
              >
                {atributoCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="bg-muted border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} className="bg-muted border-border resize-none" rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>URL da imagem de referência</Label>
              <Input value={form.imagemUrl} onChange={(e) => setForm((f) => ({ ...f, imagemUrl: e.target.value }))} placeholder="https://..." className="bg-muted border-border" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))} />
              <Label>{form.ativo ? "Ativo" : "Inativo"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome || saving} className="cursor-pointer">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
