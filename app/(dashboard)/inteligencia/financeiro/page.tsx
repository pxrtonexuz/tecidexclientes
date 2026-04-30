"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, ShoppingCart } from "lucide-react";

const ticketMedioData = Array.from({ length: 30 }, (_, i) => ({
  dia: `${i + 1}/04`,
  ticket: Math.floor(Math.random() * 400 + 800),
}));

const faturamentoPorModelo = [
  { modelo: "Polo Feminina", pedidos: 142, faturamento: "R$ 38.200", ticket: "R$ 269" },
  { modelo: "Polo Masculina", pedidos: 118, faturamento: "R$ 29.800", ticket: "R$ 252" },
  { modelo: "Camiseta Básica", pedidos: 87, faturamento: "R$ 14.500", ticket: "R$ 166" },
  { modelo: "Regata Premium", pedidos: 64, faturamento: "R$ 11.700", ticket: "R$ 182" },
];

const tooltipStyle = {
  backgroundColor: "rgba(5, 12, 8, 0.92)",
  border: "1px solid rgba(5, 150, 105, 0.30)",
  borderRadius: "12px",
  fontSize: 12,
  backdropFilter: "blur(20px)",
};

const glassCard: React.CSSProperties = {
  background: "rgba(5, 150, 105, 0.06)",
  backdropFilter: "blur(28px) saturate(160%)",
  WebkitBackdropFilter: "blur(28px) saturate(160%)",
  border: "1px solid rgba(5, 150, 105, 0.22)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  borderRadius: "22px",
};

const tickStyle = { fontSize: 11, fill: "rgba(160, 210, 185, 0.65)" };
const gridStroke = "rgba(5, 150, 105, 0.12)";

export default function FinanceiroPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Faturamento total"
          value="R$ 94.200"
          change={15}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard
          title="Pedidos confirmados"
          value={411}
          change={8}
          icon={<ShoppingCart className="w-4 h-4" />}
        />
      </div>

      {/* Evolução do ticket médio */}
      <div style={glassCard} className="p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Evolução do Ticket Médio</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={ticketMedioData} margin={{ left: 0, right: 10 }}>
            <defs>
              <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10dc8c" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10dc8c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="dia" tick={tickStyle} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={(v) => [`R$ ${Number(v).toLocaleString("pt-BR")}`, "Ticket médio"]} />
            <Line type="monotone" dataKey="ticket" stroke="#10dc8c" strokeWidth={2} dot={false}
              activeDot={{ r: 4, fill: "#10dc8c", stroke: "rgba(16, 220, 140, 0.3)", strokeWidth: 4 }}
              style={{ filter: "drop-shadow(0 0 6px rgba(16, 220, 140, 0.5))" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Faturamento por modelo */}
      <div style={glassCard} className="p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Faturamento por Modelo</p>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(5, 150, 105, 0.18)" }}>
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
            {faturamentoPorModelo.map((r) => (
              <tr
                key={r.modelo}
                style={{ borderBottom: "1px solid rgba(5, 150, 105, 0.08)" }}
                className="last:border-0 transition-colors duration-150"
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(5, 150, 105, 0.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
              >
                <td className="py-3 font-medium text-foreground">{r.modelo}</td>
                <td className="py-3 text-right text-muted-foreground">{r.pedidos}</td>
                <td className="py-3 text-right font-semibold" style={{ color: "#10dc8c" }}>{r.faturamento}</td>
                <td className="py-3 text-right text-muted-foreground">{r.ticket}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
