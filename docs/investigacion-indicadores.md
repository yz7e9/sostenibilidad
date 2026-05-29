# Investigación de Indicadores de Sostenibilidad

## Contexto del modelo de negocio

Nuestra actividad consiste en la reparación, mantenimiento y reutilización de dispositivos electrónicos (ordenadores, móviles, tablets, periféricos). Recogemos dispositivos usados de empresas, centros escolares y particulares, y:

1. **Dispositivos reutilizables**: los reparamos, limpiamos y vendemos como segunda mano.
2. **Dispositivos no reutilizables**: extraemos metales y componentes valiosos (placas base, procesadores, memorias RAM, cables de cobre, baterías de litio, oro, plata, aluminio) y los vendemos a empresas especializadas.
3. **Retorno al donante**: entregamos un 10-15% de las ganancias generadas a la fuente de los residuos.

La distribución se realiza con vehículos propios, y estamos en proceso de transición hacia vehículos eléctricos, recogidas semanales y rutas optimizadas.

---

## 1. Indicadores Ambientales

### 1.1 Huella de Carbono Total (kg CO₂e/mes)

**Fórmula:**

```
HuellaTotal = EmisionesTransporte + EmisionesProcesamiento
```

**Emisiones de transporte:**

```
EmisionesTransporte = DistanciaTotalKm × FactorEmisión(vehículo)
```

Donde:
- `DistanciaTotalKm = FrecuenciaSemanal × 4.33 × DistanciaMediaRuta`
- Factores de emisión (fuente: IDAE 2024, DGE):
  - Vehículo diésel: 0.17 kg CO₂e/km
  - Vehículo gasolina: 0.19 kg CO₂e/km
  - Vehículo eléctrico (mix España ~50% renovable): 0.04 kg CO₂e/km

**Emisiones de procesamiento:**

```
EmisionesProcesamiento = VolumenMensualKg × 0.02 × FactorRedElectrico(pais)
```

Se estiman 0.02 kWh por kg procesado (limpieza, reparación, pruebas). Factores de red eléctrica (fuente: AIE 2024):
- España: 0.18 kg CO₂e/kWh
- Portugal: 0.22 kg CO₂e/kWh
- Francia: 0.06 kg CO₂e/kWh

**Justificación de factores:**
- IDAE (2024): "Factores de emisión de la energía eléctrica en España"
- IEA (2024): "Emissions Factors – Energy System"
- IPCC (2023): "AR6 – Transport emission factors"

### 1.2 CO₂ Ahorrado vs Fabricación Nueva (kg CO₂e/mes)

**Fórmula:**

```
CO2Ahorrado = DispositivosReutilizados × FactorAhorroPorDispositivo(tipo)
```

Factores de ahorro (fuente: EEB 2019, Fraunhofer ISI 2020):
- Portátil: 300 kg CO₂e evitados por unidad reutilizada
- Móvil: 60 kg CO₂e evitados por unidad reutilizada
- Tablet: 100 kg CO₂e evitados por unidad reutilizada
- Monitor: 200 kg CO₂e evitados por unidad reutilizada
- Periférico: 15 kg CO₂e evitados por unidad reutilizada

La fabricación de un dispositivo electrónico representa el 70-85% de su huella de carbono total a lo largo de su ciclo de vida (fuente: EEB 2019, "Coolproducts don't cost the earth"). Extender su vida útil evita la mayoría de esas emisiones.

Para nuestro modelo, asumimos una composición media ponderada del volumen recogido:
- 40% portátiles → 120 kg CO₂e ahorro medio ponderado por dispositivo
- Se usa valor medio: **180 kg CO₂e ahorrados por dispositivo reutilizado**

**Referencias:**
- European Environmental Bureau (2019): "Coolproducts don't cost the earth"
- Fraunhofer ISI (2020): "Resource efficiency and climate protection"
- Greenpeace (2021): "The carbon footprint of electronics"

### 1.3 Residuos Electrónicos Desviados de Vertedero (kg/mes)

**Fórmula:**

```
ResiduosDesviados = VolumenMensualKg × TasaReparabilidad
```

Todo dispositivo recogido que de otro modo iría a vertedero o incineración se considera desviado. Los dispositivos no reparables también se desvían mediante la extracción de materiales.

**Justificación:** El 100% del volumen recogido se desvía de vertedero, ya sea mediante reutilización o reciclaje de materiales. Según el Global E-waste Monitor 2024, solo el 22.3% de los RAEE globales se reciclan formalmente.

**Referencia:**
- UNITAR/ITU (2024): "Global E-waste Monitor 2024"

### 1.4 Materiales Recuperados (kg/mes)

**Fórmula:**

```
MaterialesRecuperados = VolumenMensualKg × (1 - TasaReparabilidad) × 0.7
```

Se estima que el 70% del peso de un dispositivo no reparable se puede recuperar como material valioso (metales, plásticos reciclables).

**Composición típica de un dispositivo electrónico (fuente: WEEE Forum):**
- Metales férreos: 20%
- Metales no férreos (Al, Cu): 15%
- Metales preciosos (Au, Ag, Pd): 0.01%
- Plásticos: 30%
- Vidrio (pantallas): 25%
- Otros (baterías, cables): 10%

### 1.5 Toxicidad Evitada (puntuación 0-100)

**Fórmula:**

```
ToxicidadEvitada = ResiduosDesviados × FactorToxicidad / VolumenTotal × 100
```

Donde `FactorToxicidad = 1.5` si hay baterías de litio y pantallas (riesgo de plomo, mercurio, cadmio). Se asume que nuestro flujo siempre contiene estos componentes.

---

## 2. Indicadores Sociales

### 2.1 Empleos Generados (FTE)

**Fórmula:**

```
EmpleosGenerados = (HorasMensualesProcesamiento / 160) + (HorasTransporte / 160)
```

- Horas de procesamiento: 0.5 horas por cada 10 kg recogidos
- Horas de transporte: frecuencia × 4.33 × (distancia / velocidad media) × 2 conductores

Base: 160 horas/mes = 1 FTE

### 2.2 Riesgo Laboral (puntuación 0-100)

**Fórmula:**

```
RiesgoLaboral = RiesgoBase - (UsaEPI ? 30 : 0) - (FormacionSeguridad ? 20 : 0) + RiesgoMateriales
```

- Riesgo base: 40 (manipulación de electrónica)
- Riesgo añadido por manipulación de baterías de litio: +20
- Riesgo añadido por manipulación de pantallas rotas: +15
- Penalización por no usar EPI: +30
- Penalización por no tener formación: +20

**Referencias:**
- ILO (2022): "SafeWork – Electronic waste management"
- WHO (2021): "Children and digital dumpsites"
- INSST (España): "Guía de buenas prácticas para la gestión de RAEE"

### 2.3 Dispositivos Reutilizados (unidades/mes)

**Fórmula:**

```
DispositivosReutilizados = (VolumenMensualKg × 0.01) × TasaReparabilidad
```

Estimación: 1 dispositivo pesa ~1 kg de media (incluyendo portátiles, móviles, periféricos).

**Nota:** Este es un indicador clave de economía circular. Cuantos más dispositivos se reutilizan versus reciclan, mayor es el beneficio ambiental y social.

### 2.4 Personas Beneficiadas (acceso digital)

**Fórmula:**

```
AccesoDigital = DispositivosReutilizados × FactorAcceso
```

Donde `FactorAcceso = 1.2` (cada dispositivo puede beneficiar a más de una persona: familia, estudiantes compartiendo recursos).

---

## 3. Indicadores Económicos

### 3.1 Coste Total (€/mes)

**Fórmula:**

```
CosteTotal = CosteSalarios + CosteTransporte + CosteEnergia + CosteEmbalaje
```

**Coste salarial:**

```
CosteSalarios = HorasMensualesProcesamiento × SalarioHora + HorasTransporte × SalarioHora
```

**Coste de transporte:**

```
CosteTransporte = DistanciaTotalKm × CostePorKm(vehículo)
```

Costes por km (fuente: DGT 2024, IDAE):
- Diésel: 0.12 €/km (combustible + mantenimiento)
- Gasolina: 0.14 €/km
- Eléctrico: 0.06 €/km (electricidad + mantenimiento reducido)

**Coste de energía en taller:**

```
CosteEnergia = VolumenMensualKg × 0.02 kWh × PrecioElectricidad(pais)
```

Precios electricidad (fuente: Eurostat 2024):
- España: 0.15 €/kWh
- Portugal: 0.14 €/kWh
- Francia: 0.12 €/kWh

**Coste de embalaje:**

```
CosteEmbalaje = DispositivosReutilizados × 2.50 € × (1 - ReducciónEmbalaje/100)
```

Coste base de embalaje: 2.50 € por dispositivo (caja, protección, cinta).

### 3.2 Ingresos por Venta de Segunda Mano (€/mes)

**Fórmula:**

```
IngresosSegundaMano = DispositivosReutilizados × PrecioMedioVenta
```

Precio medio venta: 120 €/dispositivo (mix de portátiles ~200 €, móviles ~80 €, periféricos ~30 €).

### 3.3 Ingresos por Venta de Materiales (€/mes)

**Fórmula:**

```
IngresosMateriales = MaterialesRecuperados × PrecioMedioMaterial
```

Precio medio material recuperado: 3 €/kg (mix de cobre, aluminio, metales preciosos, plásticos).

### 3.4 Reparto al Donante (€/mes)

**Fórmula:**

```
RepartoDonante = (IngresosSegundaMano + IngresosMateriales - CosteTotal) × PorcentajeDonante / 100 × (TipoDonante === 'escuela' ? 1.5 : 1)
```

Se aplica un factor 1.5 para escuelas como incentivo social.

### 3.5 Margen de Beneficio (%)

**Fórmula:**

```
MargenBeneficio = (IngresosSegundaMano + IngresosMateriales - CosteTotal - RepartoDonante) / (IngresosSegundaMano + IngresosMateriales) × 100
```

### 3.6 Ahorro para el Cliente (€/dispositivo)

**Fórmula:**

```
AhorroCliente = PrecioNuevoMedio - PrecioMedioVenta
```

Precio nuevo medio: 450 € (fabricación nueva). Ahorro: 330 €/dispositivo.

---

## 4. Índice de Reputación (0-100)

**Fórmula:**

```
Reputacion = ponderado de:
  - Impacto ambiental (peso 30%): inverso normalizado de huella de carbono
  - Impacto social (peso 25%): empleos generados normalizados
  - Transparencia (peso 15%): 80 base + 10 si reparto a donante > 0
  - Economía circular (peso 30%): tasa de reparabilidad normalizada
```

Se normaliza cada subindicador al rango [0, 100] y se calcula la media ponderada.

---

## 5. Objetivos de Desarrollo Sostenible (ODS)

### Mapeo de acciones a ODS

| Variable / Decisión | ODS Impactado | Dirección | Justificación |
|---|---|---|---|
| Aumentar tasa de reparabilidad | ODS 12 (Producción responsable) | + | Reduce residuos, alarga vida útil |
| Usar vehículo eléctrico | ODS 13 (Acción climática) | + | Reduce emisiones CO₂ |
| Aumentar salario | ODS 8 (Trabajo decente) | + | Mejora condiciones laborales |
| Reducir embalaje | ODS 12 (Producción responsable) | + | Reduce residuos de envases |
| Recogida semanal optimizada | ODS 11 (Ciudades sostenibles) | + | Menos tráfico, menos emisiones |
| Reparto a escuelas (15%) | ODS 4 (Educación de calidad) | + | Aporta recursos a educación |
| No usar EPI | ODS 3 (Salud y bienestar) | - | Riesgo para trabajadores |
| Baja tasa de reparabilidad | ODS 12 (Producción responsable) | - | Más residuos generados |
| Vehículo diésel | ODS 13 (Acción climática) | - | Mayores emisiones |
| Sin optimización de rutas | ODS 11 (Ciudades sostenibles) | - | Más km, más emisiones |
| Alta reducción de embalaje | ODS 14 (Vida submarina) | + | Menos plásticos en océanos |

### ODS Principales de Nuestra Actividad

1. **ODS 8: Trabajo decente y crecimiento económico** — Generamos empleo local en reparación y recogida, con salarios justos.
2. **ODS 11: Ciudades y comunidades sostenibles** — Promovemos la reutilización local y reducimos el impacto logístico.
3. **ODS 12: Producción y consumo responsables** — Núcleo de nuestro modelo: economía circular, reparación, reciclaje responsable.
4. **ODS 13: Acción por el clima** — Reducción de emisiones mediante reutilización y transporte sostenible.
5. **ODS 3: Salud y bienestar** — Afectado positivamente (menos contaminación) o negativamente (riesgos laborales sin EPI).
6. **ODS 4: Educación de calidad** — Vinculado al reparto con centros educativos.

---

## 6. Fuentes y Referencias

| # | Fuente | Año | Contenido |
|---|---|---|---|
| 1 | IDAE — Factores de emisión eléctrica España | 2024 | Factores de emisión por kWh |
| 2 | IEA — Emissions Factors | 2024 | Factores por país y combustible |
| 3 | IPCC AR6 — Transport | 2023 | Emisiones de transporte |
| 4 | EEB — Coolproducts don't cost the earth | 2019 | Ahorro CO₂ por reutilización |
| 5 | Fraunhofer ISI — Resource efficiency | 2020 | Ciclo de vida de electrónica |
| 6 | UNITAR/ITU — Global E-waste Monitor | 2024 | Estadísticas de RAEE |
| 7 | Eurostat — Electricity prices | 2024 | Precios electricidad por país |
| 8 | DGT — Costes de combustible | 2024 | Costes por km y tipo vehículo |
| 9 | ILO — SafeWork e-waste | 2022 | Riesgos laborales en RAEE |
| 10 | WHO — Children and digital dumpsites | 2021 | Impacto salud de RAEE |
| 11 | INSST España — Guía RAEE | 2023 | Buenas prácticas en RAEE |
| 12 | Naciones Unidas — ODS | 2015 | Objetivos de Desarrollo Sostenible |

---

## 7. Supuestos y Limitaciones

1. **Peso medio por dispositivo:** 1 kg (mezcla de portátiles 2.5 kg, móviles 0.2 kg, periféricos 0.5 kg). Valor sensible a la composición real del flujo.
2. **Ahorro CO₂ por reutilización:** 180 kg CO₂e/dispositivo es una media ponderada. El ahorro real varía según el tipo de dispositivo y su estado.
3. **Composición de materiales:** 70% recuperable del peso no reparable es una estimación conservadora. Depende del tipo de dispositivo y las técnicas de extracción.
4. **Precios de venta:** Los precios de segunda mano varían con la oferta, demanda y estado del dispositivo.
5. **Factores de emisión:** Varían por país, mix eléctrico y año. Se usan los valores más recientes disponibles (2024).
6. **Los indicadores son órdenes de magnitud**, no valores exactos. El objetivo es comparar escenarios, no predecir resultados precisos.
