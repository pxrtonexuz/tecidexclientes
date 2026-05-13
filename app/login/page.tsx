"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("E-mail ou senha incorretos. Verifique suas credenciais.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 12%, rgba(57, 217, 138, 0.12), transparent 28rem), linear-gradient(180deg, rgba(255,255,255,0.035), transparent 34%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.55) 1px, transparent 1px)",
          backgroundSize: "140px 140px",
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-10">
        <section className="grid w-full max-w-4xl overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.035] shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:grid-cols-[1fr_420px]">
          <div className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden border-r border-white/10 p-8 md:flex">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 32% 34%, rgba(57,217,138,0.18), transparent 20rem), linear-gradient(135deg, rgba(6,53,31,0.78), rgba(3,20,13,0.92))",
              }}
            />
            <div className="relative">
              <div className="w-56 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                <Image
                  src="/LogoTecidexPlataforma.png"
                  alt="Tecidex"
                  width={320}
                  height={180}
                  priority
                  className="aspect-[16/9] h-auto w-full object-cover"
                />
              </div>
            </div>
            <div className="relative max-w-sm">
              <p className="tec-section-title mb-3">Operação comercial</p>
              <h1 className="text-3xl font-semibold leading-tight text-foreground">
                Controle o atendimento, o CRM e a inteligência da Tecidex em um só lugar.
              </h1>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Plataforma desenhada para acompanhar performance, pedidos e conversas com precisão operacional.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-8 flex justify-center md:hidden">
              <div className="w-44 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                <Image
                  src="/LogoTecidexPlataforma.png"
                  alt="Tecidex"
                  width={260}
                  height={146}
                  priority
                  className="aspect-[16/9] h-auto w-full object-cover"
                />
              </div>
            </div>

            <div className="mb-6">
              <p className="tec-section-title mb-2">Acesso seguro</p>
              <h2 className="text-2xl font-semibold text-foreground">Entrar na plataforma</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use as credenciais fornecidas pela Nexuz.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-10 border-white/10 bg-white/[0.055] pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-10 border-white/10 bg-white/[0.055] pl-9"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-10 w-full bg-primary font-medium text-primary-foreground shadow-[0_0_24px_rgba(57,217,138,0.14)] hover:bg-[#15834f]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Problemas para entrar? Entre em contato com a Nexuz.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
