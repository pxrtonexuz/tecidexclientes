"use client";

import { cn } from "@/lib/utils";
import type { AtendimentoData } from "@/app/actions/inteligencia";

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}h`);

function heatColor(value: number, maxValue: number) {
  if (value === 0 || maxValue === 0) return "rgba(255, 255, 255, 0.04)";
  const ratio = value / maxValue;
  if (ratio < 0.2) return "rgba(255, 255, 255, 0.09)";
  if (ratio < 0.4) return "rgba(57, 217, 138, 0.28)";
  if (ratio < 0.65) return "rgba(57, 217, 138, 0.50)";
  return "rgba(57, 217, 138, 0.80)";
}

function EmptyCard({ title, reason }: { title: string; reason: string }) {
  return (
    <div className="tec-panel p-5 flex flex-col gap-3 min-h-[160px] justify-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{reason}</p>
    </div>
  );
}

export function AtendimentoClient({ data }: { data: AtendimentoData }) {
  return (
    <div className="space-y-6">
      {/* Heatmap — dado real (baseado em horário de criação dos leads) */}
      <div className="tec-panel p-5">
        <p className="text-sm font-semibold text-foreground mb-1">
          Mapa de calor — Hora × Dia da semana{" "}
          <span className="text-xs font-normal text-[#39d98a] ml-1">• dados reais</span>
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Baseado no horário de entrada dos leads ({data.totalLeads} total)
        </p>

        {data.totalLeads > 0 ? (
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              <div className="flex flex-col gap-0.5 pt-6">
                {days.map((d) => (
                  <div
                    key={d}
                    className="h-5 w-8 flex items-center text-xs"
                    style={{ color: "rgba(160, 210, 185, 0.65)" }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="w-5 text-center"
                      style={{ fontSize: 9, color: "rgba(160, 210, 185, 0.65)" }}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {data.heatmap.map((row, di) => (
                  <div key={di} className="flex gap-0.5 mb-0.5">
                    {row.map((val, hi) => (
                      <div
                        key={hi}
                        title={`${days[di]} ${hours[hi]}: ${val} lead${val !== 1 ? "s" : ""}`}
                        className={cn("w-5 h-5 rounded-sm cursor-default transition-opacity")}
                        style={{
                          background: heatColor(val, data.maxValue),
                          border: "1px solid rgba(255, 255, 255, 0.075)",
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Legenda */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Menos</span>
              {[0.05, 0.15, 0.30, 0.50, 0.80].map((opacity, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-sm"
                  style={{ background: `rgba(57, 217, 138, ${opacity})`, border: "1px solid rgba(255, 255, 255, 0.09)" }}
                />
              ))}
              <span className="text-xs text-muted-foreground">Mais</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhum lead registrado ainda.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmptyCard
          title="Tempo médio de resposta"
          reason="Em desenvolvimento — requer registro de timestamp por mensagem no banco."
        />
        <EmptyCard
          title="Taxa de abandono por fase"
          reason="Em desenvolvimento — requer rastreamento de fase por atendimento no banco."
        />
      </div>
    </div>
  );
}
