import type { PaisRecogida, TipoVehiculo } from "@/data/variables";

export const FACTORES_EMISION_VEHICULO: Record<TipoVehiculo, number> = {
  electrico: 0.04,
  hibrido: 0.09,
  diesel: 0.17,
  gasolina: 0.19,
};

export const FACTORES_EMISION_ELECTRICIDAD: Record<PaisRecogida, number> = {
  spain: 0.18,
  portugal: 0.22,
  france: 0.06,
};

export const AHORRO_CO2_POR_DISPOSITIVO = 180;

export const COSTES_POR_KM: Record<TipoVehiculo, number> = {
  electrico: 0.06,
  hibrido: 0.09,
  diesel: 0.12,
  gasolina: 0.14,
};

export const PRECIO_ELECTRICIDAD: Record<PaisRecogida, number> = {
  spain: 0.15,
  portugal: 0.14,
  france: 0.12,
};

export const PRECIO_MEDIO_VENTA = 120;
export const PRECIO_MEDIO_MATERIAL = 3;
export const PRECIO_NUEVO_MEDIO = 450;
export const COSTE_EMBALAJE_UNITARIO = 2.5;
export const ENERGIA_POR_KG = 0.02;
export const PESO_MEDIO_DISPOSITIVO = 1;
export const FACTOR_ACCESO_DIGITAL = 1.2;
export const FACTOR_TOXICIDAD = 1.5;
export const PROPORCION_RECUPERABLE = 0.7;
export const HORAS_POR_FTE = 160;
export const HORAS_PROCESAMIENTO_POR_10KG = 0.5;
export const VELOCIDAD_MEDIA_KMH = 40;
export const CONDUCTORES_POR_RUTA = 2;
export const SEMANAS_POR_MES = 4.33;
