"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileSettingsProps = {
  email: string;
  fullName?: string;
  preferredName?: string;
  accessRole?: string;
  avatarUrl?: string;
};

export function ProfileSettings({
  email,
  fullName = "",
  preferredName = "",
  accessRole = "Admin",
  avatarUrl = "",
}: ProfileSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    fullName,
    preferredName,
    accessRole,
    avatarUrl,
  });

  const displayName = useMemo(
    () => form.preferredName.trim() || form.fullName.trim() || email,
    [email, form.fullName, form.preferredName]
  );

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function saveProfile() {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: form.fullName.trim(),
          preferred_name: form.preferredName.trim(),
          access_role: form.accessRole.trim() || "Admin",
          avatar_url: form.avatarUrl.trim(),
        },
      });

      if (error) {
        toast.error("Nao foi possivel salvar o perfil.");
        return;
      }

      window.localStorage.setItem("tecidex.preferredName", form.preferredName.trim() || form.fullName.trim() || email);
      toast.success("Perfil atualizado.");
      await supabase.auth.refreshSession();
      router.refresh();
    });
  }

  return (
    <div className="tec-page">
      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="tec-panel p-5">
          <p className="tec-section-title text-[#6ee7b7]">Perfil</p>
          <div className="mt-8 flex flex-col items-center text-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              {form.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-[#6ee7b7]">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#17192b] text-[#6ee7b7]">
                <Camera className="h-4 w-4" />
              </div>
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-foreground">{displayName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{form.accessRole || "Admin"}</p>
            <div className="mt-6 w-full">
              <Label htmlFor="avatarUrl">Foto do perfil</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  id="avatarUrl"
                  value={form.avatarUrl}
                  onChange={(event) => updateField("avatarUrl", event.target.value)}
                  placeholder="https://..."
                />
                <Button type="button" variant="outline" size="icon" aria-label="Usar foto">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Cole uma URL publica de imagem. Upload de arquivo fica para a proxima etapa.</p>
            </div>
          </div>
        </section>

        <section className="tec-panel p-5">
          <p className="tec-section-title text-[#6ee7b7]">Minha conta</p>
          <div className="mt-2">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Configuracoes do perfil</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Essas informacoes alimentam a sidebar e a saudacao da tela Inicio.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input id="fullName" value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredName">Nome preferido</Label>
              <Input id="preferredName" value={form.preferredName} onChange={(event) => updateField("preferredName", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessRole">Perfil de acesso</Label>
              <Input id="accessRole" value={form.accessRole} onChange={(event) => updateField("accessRole", event.target.value)} />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={saveProfile} disabled={isPending} className="gap-2 bg-[#10b981] hover:bg-[#059669]">
              <Save className="h-4 w-4" />
              {isPending ? "Salvando..." : "Salvar alteracoes"}
            </Button>
          </div>

          <div className="mt-6 rounded-xl border border-[rgba(35,39,57,0.78)] bg-white/[0.025] p-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#10b981]/10 text-[#6ee7b7]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Administracao</h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Os controles sensiveis da plataforma continuam protegidos. Esta tela altera apenas as informacoes visuais do usuario.
                </p>
                <Button type="button" variant="outline" className="mt-4">Abrir auditoria</Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
