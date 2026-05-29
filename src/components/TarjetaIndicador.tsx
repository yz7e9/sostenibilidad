"use client";

import { formatearNumero } from "@/lib/utils";

interface Props {
  titulo: string;
  valor: number;
  unidad?: string;
  icono?: React.ReactNode;
  color?: "green" | "red" | "blue" | "amber" | "gray";
  detalle?: string;
}

const COLORES = {
  green: "border-l-sostenibilidad-500 bg-sostenibilidad-50",
  red: "border-l-red-500 bg-red-50",
  blue: "border-l-blue-500 bg-blue-50",
  amber: "border-l-amber-500 bg-amber-50",
  gray: "border-l-gray-500 bg-gray-50",
};

const COLORES_TEXTO = {
  green: "text-sostenibilidad-700",
  red: "text-red-700",
  blue: "text-blue-700",
  amber: "text-amber-700",
  gray: "text-gray-700",
};

export default function TarjetaIndicador({
  titulo,
  valor,
  unidad,
  icono,
  color = "green",
  detalle,
}: Props) {
  const esPorcentaje = unidad === "%";

  return (
    <div
      className={`rounded-lg border-l-4 p-4 ${COLORES[color]} animate-fade-in`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {titulo}
          </p>
          <p className={`text-2xl font-bold ${COLORES_TEXTO[color]}`}>
            {esPorcentaje
              ? `${valor.toFixed(1)}%`
              : `${formatearNumero(valor, 1)}${unidad ?? ""}`}
          </p>
          {detalle && (
            <p className="text-xs text-gray-400">{detalle}</p>
          )}
        </div>
        {icono && (
          <div className={`${COLORES_TEXTO[color]} opacity-60`}>
            {icono}
          </div>
        )}
      </div>
    </div>
  );
}
