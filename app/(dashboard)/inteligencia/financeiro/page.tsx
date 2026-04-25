"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  backgroundColor: "oklch(0.11 0 0)",
  border: "1px solid oklch(0.22 0 0)",
  borderRadius: "8px",
  fontSize: 12,
};

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
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Evolução do Ticket Médio</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={ticketMedioData} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "oklch(0.635 0 0)" }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.635 0 0)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`R$ ${Number(v).toLocaleString("pt-BR")}`, "Ticket médio"]} />
              <Line type="monotone" dataKey="ticket" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Faturamento por modelo */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Faturamento por Modelo</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">Modelo</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Pedidos</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Faturamento</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Ticket Médio</th>
              </tr>
            </thead>
            <tbody>
              {faturamentoPorModelo.map((r) => (
                <tr key={r.modelo} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 font-medium text-foreground">{r.modelo}</td>
                  <td className="py-3 text-right text-muted-foreground">{r.pedidos}</td>
                  <td className="py-3 text-right text-emerald-400 font-semibold">{r.faturamento}</td>
                  <td className="py-3 text-right text-muted-foreground">{r.ticket}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
