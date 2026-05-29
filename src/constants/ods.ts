export interface ODSInfo {
  numero: number;
  nombre: string;
  descripcion: string;
  color: string;
}

export const ODS_CATALOGO: ODSInfo[] = [
  { numero: 1, nombre: "Fin de la pobreza", descripcion: "Poner fin a la pobreza en todas sus formas", color: "#E5243B" },
  { numero: 2, nombre: "Hambre cero", descripcion: "Poner fin al hambre", color: "#DDA63A" },
  { numero: 3, nombre: "Salud y bienestar", descripcion: "Garantizar una vida sana", color: "#4C9F38" },
  { numero: 4, nombre: "Educación de calidad", descripcion: "Garantizar una educación inclusiva", color: "#C5192D" },
  { numero: 5, nombre: "Igualdad de género", descripcion: "Lograr la igualdad de género", color: "#FF3A21" },
  { numero: 6, nombre: "Agua limpia y saneamiento", descripcion: "Garantizar disponibilidad de agua", color: "#26BDE2" },
  { numero: 7, nombre: "Energía asequible y no contaminante", descripcion: "Garantizar acceso a energía", color: "#FCC30B" },
  { numero: 8, nombre: "Trabajo decente y crecimiento económico", descripcion: "Promover el crecimiento económico sostenido", color: "#A21942" },
  { numero: 9, nombre: "Industria, innovación e infraestructura", descripcion: "Construir infraestructuras resilientes", color: "#FD6925" },
  { numero: 10, nombre: "Reducción de las desigualdades", descripcion: "Reducir la desigualdad en los países", color: "#DD1367" },
  { numero: 11, nombre: "Ciudades y comunidades sostenibles", descripcion: "Lograr que las ciudades sean inclusivas", color: "#FD9D24" },
  { numero: 12, nombre: "Producción y consumo responsables", descripcion: "Garantizar modalidades de consumo sostenible", color: "#E89E4A" },
  { numero: 13, nombre: "Acción por el clima", descripcion: "Adoptar medidas urgentes contra el cambio climático", color: "#3F7E44" },
  { numero: 14, nombre: "Vida submarina", descripcion: "Conservar y utilizar sosteniblemente los océanos", color: "#0A97D9" },
  { numero: 15, nombre: "Vida de ecosistemas terrestres", descripcion: "Gestionar sosteniblemente los bosques", color: "#56C02B" },
  { numero: 16, nombre: "Paz, justicia e instituciones sólidas", descripcion: "Promover sociedades pacíficas", color: "#00689D" },
  { numero: 17, nombre: "Alianzas para lograr los objetivos", descripcion: "Fortalecer los medios de implementación", color: "#19486A" },
];

export type DireccionODS = "positivo" | "negativo";

export interface ImpactoODS {
  ods: number;
  direccion: DireccionODS;
  intensidad: number;
  razon: string;
}

export const MAPA_ACCIONES_ODS: Record<string, ImpactoODS[]> = {
  tasaReparabilidad_alta: [
    { ods: 12, direccion: "positivo", intensidad: 5, razon: "Reduce residuos electrónicos al alargar la vida útil" },
  ],
  tasaReparabilidad_baja: [
    { ods: 12, direccion: "negativo", intensidad: 3, razon: "Más residuos generados al no reparar" },
  ],
  vehiculoElectrico: [
    { ods: 13, direccion: "positivo", intensidad: 4, razon: "Reduce emisiones de CO₂ en transporte" },
    { ods: 11, direccion: "positivo", intensidad: 3, razon: "Menos contaminación acústica y atmosférica en ciudades" },
  ],
  vehiculoHibrido: [
    { ods: 13, direccion: "positivo", intensidad: 2, razon: "Emisiones reducidas frente a combustión pura" },
    { ods: 11, direccion: "positivo", intensidad: 1, razon: "Menor contaminación que vehículos diésel" },
  ],
  vehiculoDiesel: [
    { ods: 13, direccion: "negativo", intensidad: 3, razon: "Mayores emisiones de CO₂" },
    { ods: 11, direccion: "negativo", intensidad: 2, razon: "Contaminación en zonas urbanas" },
  ],
  vehiculoGasolina: [
    { ods: 13, direccion: "negativo", intensidad: 3, razon: "Mayores emisiones de CO₂" },
    { ods: 11, direccion: "negativo", intensidad: 2, razon: "Contaminación en zonas urbanas" },
  ],
  salarioAlto: [
    { ods: 8, direccion: "positivo", intensidad: 4, razon: "Mejora las condiciones laborales" },
    { ods: 1, direccion: "positivo", intensidad: 2, razon: "Contribuye a reducir la pobreza" },
  ],
  salarioBajo: [
    { ods: 8, direccion: "negativo", intensidad: 3, razon: "Condiciones laborales precarias" },
  ],
  embalajeReducido: [
    { ods: 12, direccion: "positivo", intensidad: 3, razon: "Reduce residuos de envases" },
    { ods: 14, direccion: "positivo", intensidad: 2, razon: "Menos plásticos que pueden llegar al mar" },
  ],
  rutaOptimizada: [
    { ods: 11, direccion: "positivo", intensidad: 3, razon: "Menos tráfico y emisiones en ciudades" },
    { ods: 13, direccion: "positivo", intensidad: 2, razon: "Menos km recorridos = menos emisiones" },
  ],
  donanteEscuela: [
    { ods: 4, direccion: "positivo", intensidad: 4, razon: "Aporta recursos económicos a centros educativos" },
    { ods: 10, direccion: "positivo", intensidad: 2, razon: "Reduce brecha digital en entornos educativos" },
  ],
  donanteEmpresa: [
    { ods: 12, direccion: "positivo", intensidad: 2, razon: "Responsabilidad extendida del productor" },
  ],
  usaEPI: [
    { ods: 3, direccion: "positivo", intensidad: 3, razon: "Protege la salud de los trabajadores" },
  ],
  noUsaEPI: [
    { ods: 3, direccion: "negativo", intensidad: 4, razon: "Riesgo para la salud por manipulación de tóxicos" },
  ],
  reciclajeAlto: [
    { ods: 12, direccion: "positivo", intensidad: 3, razon: "Favorece la economía circular" },
  ],
  frecuenciaRecogidaBaja: [
    { ods: 11, direccion: "positivo", intensidad: 2, razon: "Menos viajes = menos impacto urbano" },
    { ods: 13, direccion: "positivo", intensidad: 2, razon: "Menos emisiones totales de transporte" },
  ],
};
