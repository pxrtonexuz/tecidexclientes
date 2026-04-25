"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const gradeColors = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e", "#ef4444"];

const acabamentos = [
  { categoria: "Gola", mais_escolhido: "Gola Polo", pct: "68%" },
  { categoria: "Manga", mais_escolhido: "Manga Curta", pct: "82%" },
  { categoria: "Escudo", mais_escolhido: "Bordado Peito", pct: "54%" },
  { categoria: "Acabamento", mais_escolhido: "Barra Reta", pct: "71%" },
];

const tooltipStyle = {
  backgroundColor: "oklch(0.11 0 0)",
  border: "1px solid oklch(0.22 0 0)",
  borderRadius: "8px",
  fontSize: 12,
};

export default function ProdutoPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Ranking modelos */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Ranking de Modelos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={modelRanking} layout="vertical" margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "oklch(0.635 0 0)" }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="nome" tick={{ fontSize: 11, fill: "oklch(0.635 0 0)" }} tickLine={false} axisLine={false} width={110} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.18 0 0)" }} />
              <Bar dataKey="pedidos" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ranking tecidos */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Ranking de Tecidos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tecidoRanking} layout="vertical" margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "oklch(0.635 0 0)" }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="nome" tick={{ fontSize: 11, fill: "oklch(0.635 0 0)" }} tickLine={false} axisLine={false} width={70} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.18 0 0)" }} />
              <Bar dataKey="pedidos" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Grade distribution */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Distribuição de Grade</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={gradeData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                {gradeData.map((_, i) => (
                  <Cell key={i} fill={gradeColors[i % gradeColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "oklch(0.635 0 0)" }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Acabamentos */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Acabamentos mais escolhidos</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">Categoria</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Mais escolhido</th>
                <th className="text-right py-2 text-muted-foreground font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {acabamentos.map((a) => (
                <tr key={a.categoria} className="border-b border-border last:border-0">
                  <td className="py-3 text-muted-foreground">{a.categoria}</td>
                  <td className="py-3 text-foreground font-medium">{a.mais_escolhido}</td>
                  <td className="py-3 text-right text-primary font-semibold">{a.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
