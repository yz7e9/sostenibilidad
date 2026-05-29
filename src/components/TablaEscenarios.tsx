"use client";

import type { Escenario } from "@/scenarios/manager";
import { formatearNumero } from "@/lib/utils";

interface Props {
  escenarios: Escenario[];
  activoId: string | null;
  onSelect: (id: string) => void;
  onEliminar: (id: string) => void;
}

interface Fila {
  label: string;
  color?: string;
  obtenerValor: (e: Escenario) => string;
}

const FILAS: Fila[] = [
  {
    label: "Huella CO₂",
    color: "text-red-600",
    obtenerValor: (e) => `${formatearNumero(e.indicadores.huellaCarbonoTotal, 1)} kg`,
  },
  {
    label: "CO₂ ahorrado",
    color: "text-sostenibilidad-600",
    obtenerValor: (e) => `${formatearNumero(e.indicadores.co2AhorradoVsNuevo, 1)} kg`,
  },
  {
    label: "CO₂ neto",
    obtenerValor: (e) =>
      `${e.indicadores.co2Neto >= 0 ? "+" : ""}${formatearNumero(e.indicadores.co2Neto, 1)} kg`,
  },
  {
    label: "Coste total",
    obtenerValor: (e) => `${formatearNumero(e.indicadores.costeTotal, 1)} €`,
  },
  {
    label: "Ingresos 2ª mano",
    color: "text-sostenibilidad-600",
    obtenerValor: (e) => `${formatearNumero(e.indicadores.ingresosSegundaMano, 1)} €`,
  },
  {
    label: "Margen beneficio",
    obtenerValor: (e) => `${e.indicadores.margenBeneficio.toFixed(1)}%`,
  },
  {
    label: "Reparto donante",
    obtenerValor: (e) => `${formatearNumero(e.indicadores.repartoDonante, 1)} €`,
  },
  {
    label: "Empleos",
    obtenerValor: (e) => `${e.indicadores.empleosGenerados.toFixed(2)} FTE`,
  },
  {
    label: "Riesgo laboral",
    obtenerValor: (e) => `${e.indicadores.riesgoLaboral}/100`,
  },
  {
    label: "Reputación",
    color: "text-amber-600",
    obtenerValor: (e) => `${e.indicadores.indiceReputacion}/100`,
  },
  {
    label: "Disp. reutilizados",
    obtenerValor: (e) => `${e.indicadores.dispositivosReutilizados} uds`,
  },
];

export default function TablaEscenarios({
  escenarios,
  activoId,
  onSelect,
  onEliminar,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
              Indicador
            </th>
            {escenarios.map((e) => (
              <th
                key={e.variables.id}
                className={`py-2 px-3 text-center font-medium text-xs uppercase tracking-wider ${
                  e.variables.id === activoId
                    ? "text-sostenibilidad-700"
                    : "text-gray-500"
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onSelect(e.variables.id)}
                    className="hover:text-sostenibilidad-700 transition-colors truncate max-w-[100px]"
                    title={e.variables.nombre}
                  >
                    {e.variables.nombre}
                  </button>
                  {escenarios.length > 1 && (
                    <button
                      onClick={() => onEliminar(e.variables.id)}
                      className="text-red-400 hover:text-red-600 flex-shrink-0"
                      title="Eliminar"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FILAS.map((fila) => (
            <tr key={fila.label} className="border-b border-gray-100">
              <td className="py-2 pr-4 text-gray-600">{fila.label}</td>
              {escenarios.map((e) => (
                <td
                  key={e.variables.id}
                  className={`py-2 px-3 text-center font-medium ${
                    fila.color ?? "text-gray-800"
                  }`}
                >
                  {fila.obtenerValor(e)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
