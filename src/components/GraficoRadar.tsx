"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Escenario } from "@/scenarios/manager";

interface Props {
  escenarios: Escenario[];
}

const DIMENSIONES = [
  { key: "impactoAmbiental", label: "Ambiental" },
  { key: "impactoSocial", label: "Social" },
  { key: "impactoEconomico", label: "Económico" },
  { key: "reputacion", label: "Reputación" },
  { key: "seguridad", label: "Seguridad" },
];

const COLORES = ["#059669", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

function calcularDimension(escenario: Escenario, dimension: string): number {
  const i = escenario.indicadores;
  switch (dimension) {
    case "impactoAmbiental":
      return Math.min(100, Math.max(0, 100 - (i.huellaCarbonoTotal / 5000) * 100));
    case "impactoSocial":
      return Math.min(100, Math.max(0, (i.empleosGenerados / 5) * 100));
    case "impactoEconomico":
      return Math.min(100, Math.max(0, (i.margenBeneficio + 100) / 2));
    case "reputacion":
      return i.indiceReputacion;
    case "seguridad":
      return 100 - i.riesgoLaboral;
    default:
      return 50;
  }
}

export default function GraficoRadar({ escenarios }: Props) {
  if (escenarios.length === 0) return null;

  const data = DIMENSIONES.map((dim) => {
    const punto: Record<string, string | number> = {
      dimension: dim.label,
    };
    escenarios.forEach((esc, idx) => {
      punto[esc.variables.nombre] = calcularDimension(esc, dim.key);
    });
    return punto;
  });

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
          />
          {escenarios.map((esc, idx) => (
            <Radar
              key={esc.variables.id}
              name={esc.variables.nombre}
              dataKey={esc.variables.nombre}
              stroke={COLORES[idx % COLORES.length]}
              fill={COLORES[idx % COLORES.length]}
              fillOpacity={0.08}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
