"use client";

import type { Variables } from "@/data/variables";
import { PAISES, VEHICULOS, DONANTES } from "@/data/variables";

interface Props {
  variables: Variables;
  onChange: (cambios: Partial<Variables>) => void;
  onDuplicate: () => void;
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium text-sostenibilidad-700">
          {value}
          {unit ?? ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-sostenibilidad-100 rounded-lg appearance-none cursor-pointer accent-sostenibilidad-600"
      />
    </div>
  );
}

function SelectControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sostenibilidad-500 focus:ring-1 focus:ring-sostenibilidad-500 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleControl({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between text-sm cursor-pointer">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-sostenibilidad-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

export default function PanelVariables({
  variables,
  onChange,
  onDuplicate,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Variables</h2>
        <button
          onClick={onDuplicate}
          className="text-xs px-3 py-1.5 rounded-lg bg-sostenibilidad-100 text-sostenibilidad-700 hover:bg-sostenibilidad-200 transition-colors"
        >
          + Duplicar escenario
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-sm">Nombre del escenario</label>
        <input
          type="text"
          value={variables.nombre}
          onChange={(e) => onChange({ nombre: e.target.value })}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sostenibilidad-500 focus:ring-1 focus:ring-sostenibilidad-500 outline-none"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Recolección
        </h3>
        <SelectControl
          label="País de recogida"
          value={variables.paisRecogida}
          options={PAISES}
          onChange={(v) => onChange({ paisRecogida: v as Variables["paisRecogida"] })}
        />
        <SliderControl
          label="Volumen mensual"
          value={variables.volumenMensualKg}
          min={50}
          max={5000}
          step={50}
          unit=" kg"
          onChange={(v) => onChange({ volumenMensualKg: v })}
        />
        <SelectControl
          label="Tipo de donante"
          value={variables.tipoDonante}
          options={DONANTES}
          onChange={(v) => onChange({ tipoDonante: v as Variables["tipoDonante"] })}
        />
        <SliderControl
          label="% ganancias al donante"
          value={variables.porcentajeDonante}
          min={5}
          max={20}
          unit="%"
          onChange={(v) => onChange({ porcentajeDonante: v })}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Procesamiento
        </h3>
        <SliderControl
          label="Salario por hora"
          value={variables.salarioHora}
          min={8}
          max={25}
          unit=" €"
          onChange={(v) => onChange({ salarioHora: v })}
        />
        <SliderControl
          label="Tasa de reparabilidad"
          value={variables.tasaReparabilidad}
          min={10}
          max={90}
          unit="%"
          onChange={(v) => onChange({ tasaReparabilidad: v })}
        />
        <SliderControl
          label="Materiales reciclados"
          value={variables.porcentajeReciclado}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => onChange({ porcentajeReciclado: v })}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Transporte
        </h3>
        <SelectControl
          label="Tipo de vehículo"
          value={variables.tipoVehiculo}
          options={VEHICULOS}
          onChange={(v) => onChange({ tipoVehiculo: v as Variables["tipoVehiculo"] })}
        />
        <SliderControl
          label="Frecuencia semanal"
          value={variables.frecuenciaSemanal}
          min={1}
          max={5}
          unit=" vez/veces"
          onChange={(v) => onChange({ frecuenciaSemanal: v })}
        />
        <SliderControl
          label="Distancia media por ruta"
          value={variables.distanciaMediaKm}
          min={5}
          max={200}
          step={5}
          unit=" km"
          onChange={(v) => onChange({ distanciaMediaKm: v })}
        />
        <ToggleControl
          label="Optimización de rutas"
          checked={variables.optimizacionRutas}
          onChange={(v) => onChange({ optimizacionRutas: v })}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Embalaje
        </h3>
        <SliderControl
          label="Reducción de embalaje"
          value={variables.reduccionEmbalaje}
          min={0}
          max={50}
          unit="%"
          onChange={(v) => onChange({ reduccionEmbalaje: v })}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Seguridad laboral
        </h3>
        <ToggleControl
          label="Uso de EPI"
          checked={variables.usaEPI}
          onChange={(v) => onChange({ usaEPI: v })}
        />
        <ToggleControl
          label="Formación en seguridad"
          checked={variables.formacionSeguridad}
          onChange={(v) => onChange({ formacionSeguridad: v })}
        />
      </div>

      {/* Project 2: Simulation-specific controls */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Simulación interactiva
        </h3>
        <SliderControl
          label="Número de vehículos"
          value={variables.numVehicles}
          min={1}
          max={10}
          onChange={(v) => onChange({ numVehicles: v })}
        />
        <SliderControl
          label="Dispositivos reutilizados"
          value={variables.reutilizados}
          min={20}
          max={80}
          step={5}
          unit="%"
          onChange={(v) => onChange({ reutilizados: v })}
        />
        <SliderControl
          label="Componentes extraídos"
          value={variables.componentes}
          min={10}
          max={50}
          step={5}
          unit="%"
          onChange={(v) => onChange({ componentes: v })}
        />
        <SliderControl
          label="% devuelto a colaboradores"
          value={variables.devuelto}
          min={5}
          max={30}
          unit="%"
          onChange={(v) => onChange({ devuelto: v })}
        />
      </div>
    </div>
  );
}
