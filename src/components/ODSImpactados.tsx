"use client";

import type { ODSImpacto } from "@/data/indicadores";
import { ODS_CATALOGO } from "@/constants/ods";

interface Props {
  impactos: ODSImpacto[];
}

export default function ODSImpactados({ impactos }: Props) {
  if (impactos.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">
        No hay ODS impactados con la configuración actual.
      </p>
    );
  }

  const positivos = impactos.filter((i) => i.direccion === "positivo");
  const negativos = impactos.filter((i) => i.direccion === "negativo");

  return (
    <div className="space-y-4">
      {positivos.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-sostenibilidad-600 mb-2">
            Impactos positivos
          </h4>
          <div className="flex flex-wrap gap-2">
            {positivos.map((imp) => (
              <div
                key={`${imp.ods}-${imp.direccion}`}
                className="group relative"
              >
                <div
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white cursor-default"
                  style={{ backgroundColor: imp.color }}
                >
                  <span className="font-bold">{imp.ods}</span>
                  <span className="opacity-80">•</span>
                  <span>{imp.nombre.split(" ").slice(0, 2).join(" ")}</span>
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <p className="font-medium mb-0.5">ODS {imp.ods}</p>
                    <p className="text-gray-300">{imp.razon}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-gray-400">Intensidad:</span>
                      {Array.from({ length: imp.intensidad }, (_, i) => (
                        <span key={i} className="text-yellow-400">★</span>
                      ))}
                    </div>
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {negativos.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-2">
            Impactos negativos
          </h4>
          <div className="flex flex-wrap gap-2">
            {negativos.map((imp) => (
              <div
                key={`${imp.ods}-${imp.direccion}`}
                className="group relative"
              >
                <div
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white cursor-default opacity-80"
                  style={{ backgroundColor: imp.color }}
                >
                  <span className="font-bold">{imp.ods}</span>
                  <span className="opacity-80">•</span>
                  <span>{imp.nombre.split(" ").slice(0, 2).join(" ")}</span>
                  <span className="ml-0.5">⚠</span>
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <p className="font-medium mb-0.5">ODS {imp.ods}</p>
                    <p className="text-gray-300">{imp.razon}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-gray-400">Intensidad:</span>
                      {Array.from({ length: imp.intensidad }, (_, i) => (
                        <span key={i} className="text-red-400">★</span>
                      ))}
                    </div>
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
