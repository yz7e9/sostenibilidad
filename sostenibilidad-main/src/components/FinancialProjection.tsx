"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Variables } from "@/data/variables";
import { computeFinancials } from "@/data/calculos";

interface Props {
  variables: Variables;
}

export default function FinancialProjection({ variables }: Props) {
  const data = useMemo(() => {
    const cur = computeFinancials(variables);
    const baseInversion = 0;
    const baseBeneficioMes = 2000;

    const labels = ["Inicio"];
    for (let m = 1; m <= 12; m++) labels.push(`M${m}`);

    const curData = [-cur.inversion];
    const baseData = [-baseInversion];
    for (let m = 1; m <= 12; m++) {
      curData.push(curData[m - 1] + cur.beneficioMes);
      baseData.push(baseData[m - 1] + baseBeneficioMes);
    }

    return labels.map((label, i) => ({
      mes: label,
      "Tu configuración": curData[i],
      "Situación actual": baseData[i],
    }));
  }, [variables]);

  const cur = useMemo(() => computeFinancials(variables), [variables]);

  let crossover = -1;
  for (let m = 1; m <= 12; m++) {
    const curD = -cur.inversion + cur.beneficioMes * m;
    const baseD = 2000 * m;
    if (curD >= baseD) { crossover = m; break; }
  }

  const paybackText = cur.inversion === 0 && cur.beneficioMes >= 2000
    ? "Inmediato"
    : crossover === -1
      ? "> 12 meses"
      : `Mes ${crossover}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Análisis económico a 12 meses
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 font-medium">Inversión inicial</div>
          <div className="text-lg font-bold text-gray-800">
            {cur.inversion.toLocaleString("es-ES")} €
          </div>
          <div className="text-xs text-gray-400">
            {variables.tipoVehiculo === "diesel"
              ? "Diésel ya propiedad"
              : `${variables.numVehicles}× vehículo${variables.numVehicles > 1 ? "s" : ""}${variables.usaEPI ? " + EPI" : ""}`}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 font-medium">Beneficio neto / mes</div>
          <div className={`text-lg font-bold ${cur.beneficioMes >= 0 ? "text-sostenibilidad-600" : "text-red-600"}`}>
            {cur.beneficioMes.toLocaleString("es-ES")} €
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 font-medium">Retorno de inversión</div>
          <div className={`text-lg font-bold ${crossover !== -1 ? "text-sostenibilidad-600" : "text-red-600"}`}>
            {paybackText}
          </div>
          <div className="text-xs text-gray-400">vs. situación actual</div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
              tickFormatter={(v: number) => v.toLocaleString("es-ES") + "€"}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
              formatter={(value: number) => value.toLocaleString("es-ES") + " €"}
            />
            <Line
              type="monotone"
              dataKey="Situación actual"
              stroke="#9CA3AF"
              strokeWidth={2}
              dot={false}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="Tu configuración"
              stroke="#059669"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#059669" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
