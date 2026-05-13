"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Chama router.refresh() a cada `intervalMs` ms para manter dados do servidor atualizados
 * sem exigir reload manual do usuário.
 */
export function AutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
