"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Tecidex]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "rgba(239, 68, 68, 0.10)", border: "1px solid rgba(239, 68, 68, 0.22)" }}
      >
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Algo deu errado</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ocorreu um erro inesperado ao carregar esta página. Tente novamente ou entre em contato com a Nexuz.
        </p>
      </div>
      <Button onClick={reset} className="gap-2 cursor-pointer">
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  );
}
