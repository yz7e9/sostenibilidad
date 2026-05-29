"use client";

import type { Variables } from "@/data/variables";

interface Props {
  variables: Variables;
  onChange: (cambios: Partial<Variables>) => void;
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="var-group">
      <div className="var-header">
        <span className="var-label">{label}</span>
        <span className="var-value">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function ToggleControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="toggle-row">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`toggle-btn ${opt.value === value ? "active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function PanelSimulacion({ variables, onChange }: Props) {
  const salarioMensual = Math.round(variables.salarioHora * 160);

  const handleSalarioMensual = (v: number) => {
    const salarioHora = Math.round(v / 160);
    onChange({ salarioHora });
  };

  return (
    <div className="panel-simulacion">
      <p className="section-title">Transporte</p>

      <div className="var-group">
        <div className="var-header">
          <span className="var-label">Tipo de vehículo</span>
        </div>
        <ToggleControl
          options={[
            { value: "diesel", label: "Diésel" },
            { value: "hibrido", label: "Híbrido" },
            { value: "electrico", label: "Eléctrico" },
          ]}
          value={variables.tipoVehiculo}
          onChange={(v) => onChange({ tipoVehiculo: v as Variables["tipoVehiculo"] })}
        />
      </div>

      <SliderControl
        label="Número de vehículos"
        value={variables.numVehicles}
        min={1}
        max={10}
        onChange={(v) => onChange({ numVehicles: v })}
      />

      <SliderControl
        label="Recogidas / semana"
        value={variables.frecuenciaSemanal}
        min={1}
        max={7}
        onChange={(v) => onChange({ frecuenciaSemanal: v })}
      />

      <div className="var-group">
        <div className="var-header">
          <span className="var-label">Optimización de rutas</span>
        </div>
        <ToggleControl
          options={[
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ]}
          value={variables.optimizacionRutas ? "si" : "no"}
          onChange={(v) => onChange({ optimizacionRutas: v === "si" })}
        />
      </div>

      <p className="section-title">Procesamiento</p>

      <SliderControl
        label="Dispositivos reutilizados"
        value={variables.reutilizados}
        min={20}
        max={80}
        step={5}
        format={(v) => `${v}%`}
        onChange={(v) => onChange({ reutilizados: v })}
      />

      <SliderControl
        label="Componentes extraídos"
        value={variables.componentes}
        min={10}
        max={50}
        step={5}
        format={(v) => `${v}%`}
        onChange={(v) => onChange({ componentes: v })}
      />

      <p className="section-title">Personal</p>

      <SliderControl
        label="Número de trabajadores"
        value={variables.numTrabajadores}
        min={1}
        max={15}
        onChange={(v) => onChange({ numTrabajadores: v })}
      />

      <SliderControl
        label="Salario mensual"
        value={salarioMensual}
        min={1000}
        max={2500}
        step={50}
        format={(v) => `${v.toLocaleString("es-ES")} €`}
        onChange={handleSalarioMensual}
      />

      <div className="var-group">
        <div className="var-header">
          <span className="var-label">EPIs (protección)</span>
        </div>
        <ToggleControl
          options={[
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ]}
          value={variables.usaEPI ? "si" : "no"}
          onChange={(v) => onChange({ usaEPI: v === "si" })}
        />
      </div>

      <p className="section-title">Colaboraciones</p>

      <SliderControl
        label="% devuelto a colaboradores"
        value={variables.devuelto}
        min={5}
        max={30}
        format={(v) => `${v}%`}
        onChange={(v) => onChange({ devuelto: v })}
      />
    </div>
  );
}
