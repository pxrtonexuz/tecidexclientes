"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Modelos ─────────────────────────────────────────────────────────────────

export type ModelItem = {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  atributos: string[];
};

const initialModels: ModelItem[] = [
  { id: "1", nome: "Polo Feminina", descricao: "Camisa polo corte feminino", ativo: true, atributos: ["Gola", "Manga", "Escudo"] },
  { id: "2", nome: "Polo Masculina", descricao: "Camisa polo corte masculino", ativo: true, atributos: ["Gola", "Manga"] },
  { id: "3", nome: "Regata Premium", descricao: "Regata com tecido premium", ativo: true, atributos: ["Acabamento"] },
  { id: "4", nome: "Camiseta Básica", descricao: "Camiseta de algodão básica", ativo: false, atributos: [] },
];

function ModelDialog({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (m: Omit<ModelItem, "id">) => void;
  initial?: ModelItem;
}) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [ativo, setAtivo] = useState(initial?.ativo ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300)); // TODO: replace with Supabase upsert
    onSave({ nome, descricao, ativo, atributos: initial?.atributos ?? [] });
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
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ModelosCrud() {
  const [items, setItems] = useState(initialModels);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ModelItem | undefined>();

  function openNew() { setEditing(undefined); setDialogOpen(true); }
  function openEdit(m: ModelItem) { setEditing(m); setDialogOpen(true); }

  function handleSave(data: Omit<ModelItem, "id">) {
    if (editing) {
      setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...data } : i)));
    } else {
      setItems((prev) => [...prev, { ...data, id: crypto.randomUUID() }]);
    }
  }

  function toggleAtivo(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ativo: !i.ativo } : i))
    );
    // TODO: UPDATE modelos SET ativo = !ativo WHERE id = id
  }

  function remove(id: string) {
    if (!confirm("Remover este modelo?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    // TODO: DELETE FROM modelos WHERE id = id
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
                    <Switch checked={item.ativo} onCheckedChange={() => toggleAtivo(item.id)} />
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
          </tbody>
        </table>
      </div>
      <ModelDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} initial={editing} />
    </div>
  );
}

// ─── Tecidos ─────────────────────────────────────────────────────────────────

export type TecidoItem = {
  id: string;
  nome: string;
  descricaoSensorial: string;
  imagemUrl: string;
  ativo: boolean;
};

const initialTecidos: TecidoItem[] = [
  { id: "1", nome: "Malha PV", descricaoSensorial: "Macio, levemente encorpado, não amare", imagemUrl: "", ativo: true },
  { id: "2", nome: "Piquet", descricaoSensorial: "Textura quadriculada, firme e respirável", imagemUrl: "", ativo: true },
  { id: "3", nome: "Dry Fit", descricaoSensorial: "Leve, fresco, seca rápido", imagemUrl: "", ativo: true },
];

export function TecidosCrud() {
  const [items, setItems] = useState(initialTecidos);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TecidoItem | undefined>();
  const [form, setForm] = useState({ nome: "", descricaoSensorial: "", imagemUrl: "", ativo: true });
  const [saving, setSaving] = useState(false);

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
    await new Promise((r) => setTimeout(r, 300)); // TODO: Supabase upsert tecidos
    if (editing) {
      setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...form } : i)));
    } else {
      setItems((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
    }
    setSaving(false);
    setDialogOpen(false);
  }

  function remove(id: string) {
    if (!confirm("Remover este tecido?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Atributos ────────────────────────────────────────────────────────────────

export type AtributoCategory = "Gola" | "Manga" | "Punho" | "Escudo" | "Acabamento" | "Outro";
export type AtributoItem = {
  id: string;
  categoria: AtributoCategory;
  nome: string;
  descricao: string;
  imagemUrl: string;
  ativo: boolean;
};

const atributoCategories: AtributoCategory[] = ["Gola", "Manga", "Punho", "Escudo", "Acabamento", "Outro"];

const initialAtributos: AtributoItem[] = [
  { id: "1", categoria: "Gola", nome: "Gola Polo", descricao: "Gola polo tradicional com botões", imagemUrl: "", ativo: true },
  { id: "2", categoria: "Gola", nome: "Gola Careca", descricao: "Gola redonda sem botões", imagemUrl: "", ativo: true },
  { id: "3", categoria: "Manga", nome: "Manga Curta", descricao: "Manga curta padrão", imagemUrl: "", ativo: true },
  { id: "4", categoria: "Escudo", nome: "Escudo Bordado", descricao: "Bordado no peito esquerdo", imagemUrl: "", ativo: true },
  { id: "5", categoria: "Acabamento", nome: "Barra Reta", descricao: "Barra reta sem elastico", imagemUrl: "", ativo: true },
];

export function AtributosCrud() {
  const [items, setItems] = useState(initialAtributos);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AtributoItem | undefined>();
  const [form, setForm] = useState<Omit<AtributoItem, "id">>({ categoria: "Gola", nome: "", descricao: "", imagemUrl: "", ativo: true });
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AtributoCategory | "all">("all");

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
    await new Promise((r) => setTimeout(r, 300)); // TODO: Supabase upsert atributos
    if (editing) {
      setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...form } : i)));
    } else {
      setItems((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
    }
    setSaving(false);
    setDialogOpen(false);
  }

  function remove(id: string) {
    if (!confirm("Remover este atributo?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
