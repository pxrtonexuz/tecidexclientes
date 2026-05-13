"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ProdutoData } from "@/app/actions/inteligencia";

const tooltipStyle = {
  backgroundColor: "rgba(5, 12, 8, 0.92)",
  border: "1px solid rgba(57, 217, 138, 0.28)",
  borderRadius: "12px",
  fontSize: 12,
  backdropFilter: "blur(20px)",
};

const tickStyle = { fontSize: 11, fill: "rgba(160, 210, 185, 0.65)" };
const gridStroke = "rgba(255, 255, 255, 0.085)";

function EmptyCard({ title, reason }: { title: string; reason: string }) {
  return (
    <div className="tec-panel p-5 flex flex-col gap-3 min-h-[160px] justify-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{reason}</p>
    </div>
  );
}

export function ProdutoClient({ data }: { data: ProdutoData }) {
  return (
    <div className="space-y-6">
      {/* Ranking de Modelos — dado real */}
      <div className="tec-panel p-5">
        <p className="text-sm font-semibold text-foreground mb-4">
          Ranking de Modelos{" "}
          <span className="text-xs font-normal text-[#39d98a] ml-1">• dados reais</span>
        </p>
        {data.modelRanking.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(180, data.modelRanking.length * 36)}>
            <BarChart
              data={data.modelRanking}
              layout="vertical"
              margin={{ left: 0, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis type="number" tick={tickStyle} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="nome"
                tick={tickStyle}
                tickLine={false}
                axisLine={false}
                width={130}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(255, 255, 255, 0.06)" }}
                formatter={(v) => [v, "Pedidos fechados"]}
              />
              <Bar
                dataKey="pedidos"
                fill="#39d98a"
                radius={[0, 6, 6, 0]}
                style={{ filter: "drop-shadow(0 0 6px rgba(57, 217, 138, 0.4))" }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhum pedido fechado registrado ainda.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EmptyCard
          title="Ranking de Tecidos"
          reason="Em desenvolvimento — o agente ainda não registra o tecido escolhido por pedido."
        />
        <EmptyCard
          title="Distribuição de Grade"
          reason="Em desenvolvimento — o agente ainda não registra a grade (P/M/G/GG) por pedido."
        />
        <EmptyCard
          title="Acabamentos mais escolhidos"
          reason="Em desenvolvimento — o agente ainda não registra os acabamentos separadamente."
        />
      </div>
    </div>
  );
}
