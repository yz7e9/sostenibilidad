import type { Variables } from "./variables";
import type { Indicadores, ODSImpacto } from "./indicadores";
import { ODS_CATALOGO, MAPA_ACCIONES_ODS } from "@/constants/ods";
import {
  FACTORES_EMISION_VEHICULO,
  FACTORES_EMISION_ELECTRICIDAD,
  AHORRO_CO2_POR_DISPOSITIVO,
  COSTES_POR_KM,
  PRECIO_ELECTRICIDAD,
  PRECIO_MEDIO_VENTA,
  PRECIO_MEDIO_MATERIAL,
  PRECIO_NUEVO_MEDIO,
  COSTE_EMBALAJE_UNITARIO,
  ENERGIA_POR_KG,
  FACTOR_ACCESO_DIGITAL,
  FACTOR_TOXICIDAD,
  PROPORCION_RECUPERABLE,
  HORAS_POR_FTE,
  HORAS_PROCESAMIENTO_POR_10KG,
  VELOCIDAD_MEDIA_KMH,
  CONDUCTORES_POR_RUTA,
  SEMANAS_POR_MES,
} from "@/constants/factores-emision";

function calcularImpactosODS(v: Variables): ODSImpacto[] {
  const impactos: ODSImpacto[] = [];

  const accion = (clave: string) => {
    const mapa = MAPA_ACCIONES_ODS[clave];
    if (!mapa) return;
    for (const imp of mapa) {
      const info = ODS_CATALOGO.find((o) => o.numero === imp.ods);
      impactos.push({
        ods: imp.ods,
        nombre: info?.nombre ?? `ODS ${imp.ods}`,
        direccion: imp.direccion,
        intensidad: imp.intensidad,
        razon: imp.razon,
        color: info?.color ?? "#666",
      });
    }
  };

  if (v.tasaReparabilidad >= 50) accion("tasaReparabilidad_alta");
  else accion("tasaReparabilidad_baja");

  if (v.tipoVehiculo === "electrico") accion("vehiculoElectrico");
  if (v.tipoVehiculo === "hibrido") accion("vehiculoHibrido");
  if (v.tipoVehiculo === "diesel") accion("vehiculoDiesel");
  if (v.tipoVehiculo === "gasolina") accion("vehiculoGasolina");

  if (v.salarioHora >= 14) accion("salarioAlto");
  else if (v.salarioHora <= 9) accion("salarioBajo");

  if (v.reduccionEmbalaje >= 20) accion("embalajeReducido");

  if (v.optimizacionRutas) accion("rutaOptimizada");

  if (v.tipoDonante === "escuela") accion("donanteEscuela");
  if (v.tipoDonante === "empresa") accion("donanteEmpresa");

  if (v.usaEPI) accion("usaEPI");
  else accion("noUsaEPI");

  if (v.porcentajeReciclado >= 60) accion("reciclajeAlto");

  if (v.frecuenciaSemanal <= 2) accion("frecuenciaRecogidaBaja");

  const vistos = new Set<number>();
  return impactos.filter((i) => {
    if (vistos.has(i.ods)) return false;
    vistos.add(i.ods);
    return true;
  });
}

export function calcularIndicadores(v: Variables): Indicadores {
  const distanciaTotalKm =
    v.frecuenciaSemanal *
    SEMANAS_POR_MES *
    v.distanciaMediaKm *
    (v.optimizacionRutas ? 0.8 : 1);

  const horasProcesamiento =
    (v.volumenMensualKg / 10) * HORAS_PROCESAMIENTO_POR_10KG;
  const horasTransporte =
    (distanciaTotalKm / VELOCIDAD_MEDIA_KMH) * CONDUCTORES_POR_RUTA;

  const emisionesTransporte =
    distanciaTotalKm * FACTORES_EMISION_VEHICULO[v.tipoVehiculo];
  const emisionesProcesamiento =
    v.volumenMensualKg * ENERGIA_POR_KG * FACTORES_EMISION_ELECTRICIDAD[v.paisRecogida];
  const huellaCarbonoTotal = emisionesTransporte + emisionesProcesamiento;

  const dispositivosReutilizados = Math.round(
    (v.volumenMensualKg / 1) * (v.tasaReparabilidad / 100),
  );

  const co2AhorradoVsNuevo =
    dispositivosReutilizados * AHORRO_CO2_POR_DISPOSITIVO;
  const co2Neto = huellaCarbonoTotal - co2AhorradoVsNuevo;

  const residuosDesviados = v.volumenMensualKg;

  const materialesRecuperados =
    v.volumenMensualKg *
    (1 - v.tasaReparabilidad / 100) *
    PROPORCION_RECUPERABLE;

  const toxicidadEvitada = Math.min(
    100,
    (residuosDesviados * FACTOR_TOXICIDAD / v.volumenMensualKg) * 100,
  );

  const costeSalarios =
    (horasProcesamiento + horasTransporte) * v.salarioHora;
  const costeTransporte = distanciaTotalKm * COSTES_POR_KM[v.tipoVehiculo];
  const costeEnergia =
    v.volumenMensualKg * ENERGIA_POR_KG * PRECIO_ELECTRICIDAD[v.paisRecogida];
  const costeEmbalaje =
    dispositivosReutilizados *
    COSTE_EMBALAJE_UNITARIO *
    (1 - v.reduccionEmbalaje / 100);
  const costeTotal =
    costeSalarios + costeTransporte + costeEnergia + costeEmbalaje;

  const ingresosSegundaMano =
    dispositivosReutilizados * PRECIO_MEDIO_VENTA;
  const ingresosMateriales = materialesRecuperados * PRECIO_MEDIO_MATERIAL;

  const beneficioAntesReparto =
    ingresosSegundaMano + ingresosMateriales - costeTotal;
  const factorDonante = v.tipoDonante === "escuela" ? 1.5 : 1;
  const repartoDonante = Math.max(
    0,
    beneficioAntesReparto * (v.porcentajeDonante / 100) * factorDonante,
  );

  const beneficioNeto =
    ingresosSegundaMano + ingresosMateriales - costeTotal - repartoDonante;
  const margenBeneficio =
    ingresosSegundaMano + ingresosMateriales > 0
      ? (beneficioNeto / (ingresosSegundaMano + ingresosMateriales)) * 100
      : 0;

  const ahorroCliente = PRECIO_NUEVO_MEDIO - PRECIO_MEDIO_VENTA;

  const empleosGenerados = (horasProcesamiento + horasTransporte) / HORAS_POR_FTE;

  let riesgoLaboral = 40;
  if (v.usaEPI) riesgoLaboral -= 30;
  if (v.formacionSeguridad) riesgoLaboral -= 20;
  riesgoLaboral = Math.max(0, Math.min(100, riesgoLaboral));

  const accesoDigital = Math.round(
    dispositivosReutilizados * FACTOR_ACCESO_DIGITAL,
  );

  const normalizar = (valor: number, max: number): number =>
    Math.min(100, Math.max(0, (valor / max) * 100));

  const puntaieAmbiental = 100 - normalizar(huellaCarbonoTotal, 5000);
  const puntaieSocial = normalizar(empleosGenerados, 5);
  const puntaieTransparencia = 80 + (repartoDonante > 0 ? 10 : 0) + (v.usaEPI ? 5 : 0) + (v.formacionSeguridad ? 5 : 0);
  const puntaieCircular = normalizar(v.tasaReparabilidad, 100);

  const indiceReputacion = Math.round(
    puntaieAmbiental * 0.3 +
      puntaieSocial * 0.25 +
      puntaieTransparencia * 0.15 +
      puntaieCircular * 0.3,
  );

  const odsImpactados = calcularImpactosODS(v);

  /** Project 2 interactive simulation calculations */
  const co2Factor = v.tipoVehiculo === "diesel" ? 1.0 : v.tipoVehiculo === "hibrido" ? 0.55 : v.tipoVehiculo === "electrico" ? 0.12 : 1.0;
  const rutaFactor = v.optimizacionRutas ? 0.65 : 1.0;
  const co2Semanal = Math.round(40 * co2Factor * rutaFactor * v.frecuenciaSemanal * v.numVehicles);

  const recupPct = Math.min(100, v.reutilizados + v.componentes);
  const costBase = v.tipoVehiculo === "diesel" ? 70 : v.tipoVehiculo === "hibrido" ? 55 : 40;
  const costeLogisticoSemanal = Math.round(costBase * v.frecuenciaSemanal * v.numVehicles * (v.optimizacionRutas ? 0.7 : 1.0));

  const salarioMensual = Math.round(v.salarioHora * 160);
  const costeLaboralMensual = v.numTrabajadores * salarioMensual;

  let repSim = 22;
  if (v.tipoVehiculo === "electrico") repSim += 22;
  else if (v.tipoVehiculo === "hibrido") repSim += 11;
  if (v.optimizacionRutas) repSim += 10;
  if (salarioMensual >= 1500) repSim += 10;
  if (salarioMensual >= 2000) repSim += 5;
  if (v.usaEPI) repSim += 10;
  if (recupPct >= 80) repSim += 10;
  else if (recupPct >= 65) repSim += 5;
  if (v.devuelto >= 13) repSim += 5;
  repSim = Math.min(100, repSim);

  let riesgo: "bajo" | "medio" | "alto";
  if (v.usaEPI) riesgo = "bajo";
  else if (recupPct > 70 && v.numTrabajadores >= 4) riesgo = "alto";
  else if (recupPct > 50 || v.numTrabajadores >= 5) riesgo = "medio";
  else riesgo = "medio";

  return {
    huellaCarbonoTotal: Math.round(huellaCarbonoTotal * 100) / 100,
    co2AhorradoVsNuevo: Math.round(co2AhorradoVsNuevo * 100) / 100,
    co2Neto: Math.round(co2Neto * 100) / 100,
    residuosDesviados: Math.round(residuosDesviados * 100) / 100,
    materialesRecuperados: Math.round(materialesRecuperados * 100) / 100,
    toxicidadEvitada: Math.round(toxicidadEvitada),
    empleosGenerados: Math.round(empleosGenerados * 100) / 100,
    riesgoLaboral: Math.round(riesgoLaboral),
    dispositivosReutilizados,
    accesoDigital,
    costeTotal: Math.round(costeTotal * 100) / 100,
    costeSalarios: Math.round(costeSalarios * 100) / 100,
    costeTransporte: Math.round(costeTransporte * 100) / 100,
    costeEnergia: Math.round(costeEnergia * 100) / 100,
    costeEmbalaje: Math.round(costeEmbalaje * 100) / 100,
    ingresosSegundaMano: Math.round(ingresosSegundaMano * 100) / 100,
    ingresosMateriales: Math.round(ingresosMateriales * 100) / 100,
    repartoDonante: Math.round(repartoDonante * 100) / 100,
    margenBeneficio: Math.round(margenBeneficio * 100) / 100,
    ahorroCliente: Math.round(ahorroCliente * 100) / 100,
    indiceReputacion,
    odsImpactados,
    co2Semanal,
    tasaRecuperacion: recupPct,
    costeLogisticoSemanal,
    costeLaboralMensual,
    riesgo,
  };
}

/** Project 2 financial projection */
export interface Financials {
  inversion: number;
  ingMes: number;
  costeTotalMes: number;
  beneficioMes: number;
  devMes: number;
  costeLabMes: number;
  costeLogMes: number;
  costeEpiMes: number;
}

export function computeFinancials(v: Variables): Financials {
  const costBase = v.tipoVehiculo === "diesel" ? 70 : v.tipoVehiculo === "hibrido" ? 55 : 40;
  const costeLogSem = Math.round(costBase * v.frecuenciaSemanal * v.numVehicles * (v.optimizacionRutas ? 0.7 : 1.0));
  const costeLogMes = Math.round(costeLogSem * 4.3);

  const salarioMensual = Math.round(v.salarioHora * 160);
  const costeLabMes = v.numTrabajadores * salarioMensual;
  const costeEpiMes = v.usaEPI ? v.numTrabajadores * 30 : 0;

  const recup = Math.min(100, v.reutilizados + v.componentes);
  const volumen = 0.5 + v.frecuenciaSemanal * 0.08 + v.numVehicles * 0.15;
  const ingSem = Math.round((400 + v.reutilizados * 85 + v.componentes * 38) * Math.min(volumen, 1.6));
  const ingMes = Math.round(ingSem * 4.3);

  const devMes = Math.round(ingMes * v.devuelto / 100);
  const costeTotalMes = costeLogMes + costeLabMes + costeEpiMes + devMes;
  const beneficioMes = ingMes - costeTotalMes;

  const vehCostUnit = v.tipoVehiculo === "electrico" ? 45000 : v.tipoVehiculo === "hibrido" ? 30000 : 0;
  const inversionVeh = vehCostUnit * v.numVehicles;
  const inversionEpi = v.usaEPI ? v.numTrabajadores * 200 : 0;
  const inversion = inversionVeh + inversionEpi;

  return { inversion, ingMes, costeTotalMes, beneficioMes, devMes, costeLabMes, costeLogMes, costeEpiMes };
}
