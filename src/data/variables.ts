export type PaisRecogida = "spain" | "portugal" | "france";
export type TipoVehiculo = "electrico" | "diesel" | "gasolina" | "hibrido";
export type TipoDonante = "empresa" | "escuela" | "particular";

export const PAISES: { value: PaisRecogida; label: string }[] = [
  { value: "spain", label: "España" },
  { value: "portugal", label: "Portugal" },
  { value: "france", label: "Francia" },
];

export const VEHICULOS: { value: TipoVehiculo; label: string }[] = [
  { value: "electrico", label: "Eléctrico" },
  { value: "hibrido", label: "Híbrido" },
  { value: "diesel", label: "Diésel" },
  { value: "gasolina", label: "Gasolina" },
];

export const DONANTES: { value: TipoDonante; label: string }[] = [
  { value: "empresa", label: "Empresa" },
  { value: "escuela", label: "Centro escolar" },
  { value: "particular", label: "Particular" },
];

export interface Variables {
  id: string;
  nombre: string;
  paisRecogida: PaisRecogida;
  volumenMensualKg: number;
  porcentajeDonante: number;
  tipoDonante: TipoDonante;
  salarioHora: number;
  tasaReparabilidad: number;
  porcentajeReciclado: number;
  tipoVehiculo: TipoVehiculo;
  frecuenciaSemanal: number;
  optimizacionRutas: boolean;
  distanciaMediaKm: number;
  reduccionEmbalaje: number;
  usaEPI: boolean;
  formacionSeguridad: boolean;
  /** Project 2 additions: simulation-specific controls */
  numVehicles: number;
  reutilizados: number;
  componentes: number;
  devuelto: number;
  numTrabajadores: number;
}

export function crearVariablesPorDefecto(id = "escenario-1"): Variables {
  return {
    id,
    nombre: "Escenario base",
    paisRecogida: "spain",
    volumenMensualKg: 500,
    porcentajeDonante: 10,
    tipoDonante: "empresa",
    salarioHora: 12,
    tasaReparabilidad: 60,
    porcentajeReciclado: 50,
    tipoVehiculo: "diesel",
    frecuenciaSemanal: 7,
    optimizacionRutas: false,
    distanciaMediaKm: 50,
    reduccionEmbalaje: 10,
    usaEPI: true,
    formacionSeguridad: true,
    numVehicles: 1,
    reutilizados: 45,
    componentes: 30,
    devuelto: 10,
    numTrabajadores: 4,
  };
}
