"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Escenario } from "@/scenarios/manager";

interface Props {
  escenarios: Escenario[];
  metricas: {
    key: string;
    label: string;
    color: string;
    formatter?: (v: number) => string;
  }[];
}

const COLORES_BARRA = ["#059669", "#2563eb", "#d97706", "#dc2626", "#7c3aed"];

export default function GraficoBarras({ escenarios, metricas }: Props) {
  if (escenarios.length === 0 || metricas.length === 0) return null;

  const data = escenarios.map((esc) => {
    const punto: Record<string, string | number> = {
      nombre: esc.variables.nombre.length > 12
        ? esc.variables.nombre.slice(0, 12) + "…"
        : esc.variables.nombre,
    };
    metricas.forEach((m) => {
      const valor = (esc.indicadores as unknown as Record<string, number>)[m.key] ?? 0;
      punto[m.key] = Math.round(valor * 100) / 100;
    });
    return punto;
  });

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="nombre"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          {metricas.map((m, idx) => (
            <Bar
              key={m.key}
              dataKey={m.key}
              name={m.label}
              fill={m.color ?? COLORES_BARRA[idx % COLORES_BARRA.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
