import type { DireccionODS } from "@/constants/ods";

export interface ODSImpacto {
  ods: number;
  nombre: string;
  direccion: DireccionODS;
  intensidad: number;
  razon: string;
  color: string;
}

export interface Indicadores {
  huellaCarbonoTotal: number;
  co2AhorradoVsNuevo: number;
  co2Neto: number;
  residuosDesviados: number;
  materialesRecuperados: number;
  toxicidadEvitada: number;

  empleosGenerados: number;
  riesgoLaboral: number;
  dispositivosReutilizados: number;
  accesoDigital: number;

  costeTotal: number;
  costeSalarios: number;
  costeTransporte: number;
  costeEnergia: number;
  costeEmbalaje: number;
  ingresosSegundaMano: number;
  ingresosMateriales: number;
  repartoDonante: number;
  margenBeneficio: number;
  ahorroCliente: number;

  indiceReputacion: number;

  odsImpactados: ODSImpacto[];

  /** Project 2 indicators: interactive simulation KPIs */
  co2Semanal: number;
  tasaRecuperacion: number;
  costeLogisticoSemanal: number;
  costeLaboralMensual: number;
  riesgo: "bajo" | "medio" | "alto";
}
