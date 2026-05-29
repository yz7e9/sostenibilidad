import {
  type Variables,
  crearVariablesPorDefecto,
} from "@/data/variables";
import { type Indicadores } from "@/data/indicadores";
import { calcularIndicadores } from "@/data/calculos";

export interface Escenario {
  variables: Variables;
  indicadores: Indicadores;
}

const STORAGE_KEY = "sostenibilidad-escenarios";

function generarId(): string {
  return `escenario-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function crearEscenario(
  overrides?: Partial<Variables>,
): Escenario {
  const variables = {
    ...crearVariablesPorDefecto(),
    id: generarId(),
    ...overrides,
  };
  const indicadores = calcularIndicadores(variables);
  return { variables, indicadores };
}

export function guardarEscenarios(escenarios: Escenario[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(escenarios));
  } catch {
    /* localStorage may be full */
  }
}

export function cargarEscenarios(): Escenario[] | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const parsed: Escenario[] = JSON.parse(data);
    return parsed.map((e) => {
      const defaults = crearVariablesPorDefecto();
      const variables = { ...defaults, ...e.variables, id: e.variables.id };
      return { variables, indicadores: calcularIndicadores(variables) };
    });
  } catch {
    return null;
  }
}

export function duplicarEscenario(
  escenario: Escenario,
  nuevoNombre?: string,
): Escenario {
  return crearEscenario({
    ...escenario.variables,
    id: generarId(),
    nombre: nuevoNombre ?? `${escenario.variables.nombre} (copia)`,
  });
}

export function actualizarVariables(
  escenario: Escenario,
  cambios: Partial<Variables>,
): Escenario {
  const nuevasVariables = { ...escenario.variables, ...cambios };
  const nuevosIndicadores = calcularIndicadores(nuevasVariables);
  return { variables: nuevasVariables, indicadores: nuevosIndicadores };
}

export function eliminarEscenario(
  escenarios: Escenario[],
  id: string,
): Escenario[] {
  return escenarios.filter((e) => e.variables.id !== id);
}
