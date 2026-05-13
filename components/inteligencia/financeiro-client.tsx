"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, ShoppingCart } from "lucide-react";
import type { FinanceiroData } from "@/app/actions/inteligencia";

const tooltipStyle = {
  backgroundColor: "rgba(5, 12, 8, 0.92)",
  border: "1px solid rgba(57, 217, 138, 0.28)",
  borderRadius: "12px",
  fontSize: 12,
  backdropFilter: "blur(20px)",
};

const tickStyle = { fontSize: 11, fill: "rgba(160, 210, 185, 0.65)" };
const gridStroke = "rgba(255, 255, 255, 0.085)";

export function FinanceiroClient({ data }: { data: FinanceiroData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Faturamento total"
          value={
            data.faturamentoTotal > 0
              ? `R$ ${data.faturamentoTotal.toLocaleString("pt-BR")}`
              : "R$ 0"
          }
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard
          title="Pedidos confirmados"
          value={data.pedidosConfirmados}
          icon={<ShoppingCart className="w-4 h-4" />}
        />
      </div>

      {/* Evolução do ticket médio — últimos 30 dias */}
      <div className="tec-panel p-5">
        <p className="text-sm font-semibold text-foreground mb-1">
          Evolução do Ticket Médio{" "}
          <span className="text-xs font-normal text-[#39d98a] ml-1">• dados reais</span>
        </p>
        <p className="text-xs text-muted-foreground mb-4">Últimos 30 dias</p>
        {data.ticketEvolucao.some((d) => d.ticket > 0) ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.ticketEvolucao} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey="dia"
                tick={tickStyle}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={tickStyle}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `R$${v}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`R$ ${Number(v).toLocaleString("pt-BR")}`, "Ticket médio"]}
              />
              <Line
                type="monotone"
                dataKey="ticket"
                stroke="#39d98a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#39d98a", stroke: "rgba(57, 217, 138, 0.3)", strokeWidth: 4 }}
                style={{ filter: "drop-shadow(0 0 6px rgba(57, 217, 138, 0.5))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhum pedido com valor registrado ainda.
          </p>
        )}
      </div>

      {/* Faturamento por modelo */}
      <div className="tec-panel p-5">
        <p className="text-sm font-semibold text-foreground mb-1">
          Faturamento por Modelo{" "}
          <span className="text-xs font-normal text-[#39d98a] ml-1">• dados reais</span>
        </p>
        {data.faturamentoPorModelo.length > 0 ? (
          <table className="w-full text-sm mt-4">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.10)" }}>
                {["Modelo", "Pedidos", "Faturamento", "Ticket Médio"].map((h, i) => (
                  <th
                    key={h}
                    className={`py-2 text-xs font-semibold uppercase tracking-wider ${i === 0 ? "text-left" : "text-right"}`}
                    style={{ color: "rgba(160, 210, 185, 0.65)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.faturamentoPorModelo.map((r) => (
                <tr
                  key={r.modelo}
                  style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}
                  className="last:border-0 transition-colors duration-150"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255, 255, 255, 0.045)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                  }}
                >
                  <td className="py-3 font-medium text-foreground">{r.modelo}</td>
                  <td className="py-3 text-right text-muted-foreground">{r.pedidos}</td>
                  <td className="py-3 text-right font-semibold" style={{ color: "#39d98a" }}>
                    R$ {r.faturamento.toLocaleString("pt-BR")}
                  </td>
                  <td className="py-3 text-right text-muted-foreground">
                    R$ {r.ticket.toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhum pedido com valor e modelo registrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
