"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const modelRanking = [
  { nome: "Polo Feminina", pedidos: 142 },
  { nome: "Polo Masculina", pedidos: 118 },
  { nome: "Camiseta Básica", pedidos: 87 },
  { nome: "Regata Premium", pedidos: 64 },
  { nome: "Camiseta Dry Fit", pedidos: 43 },
];

const tecidoRanking = [
  { nome: "Malha PV", pedidos: 198 },
  { nome: "Piquet", pedidos: 134 },
  { nome: "Dry Fit", pedidos: 97 },
  { nome: "Cotton", pedidos: 55 },
];

const gradeData = [
  { name: "P", value: 18 },
  { name: "M", value: 28 },
  { name: "G", value: 24 },
  { name: "GG", value: 16 },
  { name: "G1", value: 8 },
  { name: "G2", value: 4 },
  { name: "G3", value: 2 },
];

const gradeColors = ["#10dc8c", "#34d399", "#6ee7b7", "#059669", "#047857", "#a7f3d0", "#065f46"];

const acabamentos = [
  { categoria: "Gola", mais_escolhido: "Gola Polo", pct: "68%" },
  { categoria: "Manga", mais_escolhido: "Manga Curta", pct: "82%" },
  { categoria: "Escudo", mais_escolhido: "Bordado Peito", pct: "54%" },
  { categoria: "Acabamento", mais_escolhido: "Barra Reta", pct: "71%" },
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

export default function ProdutoPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Ranking modelos */}
      <div style={glassCard} className="p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Ranking de Modelos</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={modelRanking} layout="vertical" margin={{ left: 0, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
            <XAxis type="number" tick={tickStyle} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="nome" tick={tickStyle} tickLine={false} axisLine={false} width={110} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(5, 150, 105, 0.08)" }} />
            <Bar dataKey="pedidos" fill="#10dc8c" radius={[0, 6, 6, 0]}
              style={{ filter: "drop-shadow(0 0 6px rgba(16, 220, 140, 0.4))" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ranking tecidos */}
      <div style={glassCard} className="p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Ranking de Tecidos</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={tecidoRanking} layout="vertical" margin={{ left: 0, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
            <XAxis type="number" tick={tickStyle} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="nome" tick={tickStyle} tickLine={false} axisLine={false} width={70} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(5, 150, 105, 0.08)" }} />
            <Bar dataKey="pedidos" fill="#059669" radius={[0, 6, 6, 0]}
              style={{ filter: "drop-shadow(0 0 6px rgba(5, 150, 105, 0.4))" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Grade distribution */}
      <div style={glassCard} className="p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Distribuição de Grade</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={gradeData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
              {gradeData.map((_, i) => (
                <Cell key={i} fill={gradeColors[i % gradeColors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "rgba(160, 210, 185, 0.65)" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Acabamentos */}
      <div style={glassCard} className="p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Acabamentos mais escolhidos</p>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(5, 150, 105, 0.18)" }}>
              <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "rgba(160, 210, 185, 0.65)" }}>Categoria</th>
              <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "rgba(160, 210, 185, 0.65)" }}>Mais escolhido</th>
              <th className="text-right py-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "rgba(160, 210, 185, 0.65)" }}>%</th>
            </tr>
          </thead>
          <tbody>
            {acabamentos.map((a) => (
              <tr key={a.categoria} style={{ borderBottom: "1px solid rgba(5, 150, 105, 0.08)" }}
                className="last:border-0">
                <td className="py-3 text-muted-foreground">{a.categoria}</td>
                <td className="py-3 text-foreground font-medium">{a.mais_escolhido}</td>
                <td className="py-3 text-right font-semibold" style={{ color: "#10dc8c" }}>{a.pct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
