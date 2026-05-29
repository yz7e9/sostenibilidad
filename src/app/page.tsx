"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Leaf,
  TrendingUp,
  Users,
  Award,
  Truck,
  Coins,
  BarChart3,
  Recycle,
  LogOut,
  Gauge,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import PanelSimulacion from "@/components/PanelSimulacion";
import TarjetaIndicador from "@/components/TarjetaIndicador";
import TablaEscenarios from "@/components/TablaEscenarios";
import GraficoRadar from "@/components/GraficoRadar";
import GraficoBarras from "@/components/GraficoBarras";
import ODSImpactados from "@/components/ODSImpactados";
import EcoScene from "@/components/EcoScene";
import FinancialProjection from "@/components/FinancialProjection";
import {
  crearEscenario,
  actualizarVariables,
  duplicarEscenario,
  eliminarEscenario,
  guardarEscenarios,
  cargarEscenarios,
  type Escenario,
} from "@/scenarios/manager";
import type { Variables } from "@/data/variables";
import { createSimState } from "@/lib/useEcoSimulation";

export default function Home() {
  const { usuario, logout } = useAuth();
  const [escenarios, setEscenarios] = useState<Escenario[]>([]);
  const [activoId, setActivoId] = useState<string | null>(null);
  const [panelAbierto, setPanelAbierto] = useState(true);

  const simRef = useRef(createSimState());
  const [simTick, setSimTick] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1);
  const [simPaused, setSimPaused] = useState(false);
  const [sceneWebglOk, setSceneWebglOk] = useState(true);
  const debugMode = process.env.NEXT_PUBLIC_DEBUG === "true";
  const simDayRef = useRef(1);
  const lastDayRef = useRef(1);
  const pickupCountRef = useRef(0);

  const sim = simRef.current;
  sim.speed = simSpeed;
  sim.paused = simPaused;

  useEffect(() => {
    const guardados = cargarEscenarios();
    if (guardados && guardados.length > 0) {
      setEscenarios(guardados);
      setActivoId(guardados[0].variables.id);
    } else {
      const inicial = crearEscenario({ nombre: "Escenario actual" });
      setEscenarios([inicial]);
      setActivoId(inicial.variables.id);
    }
  }, []);

  useEffect(() => {
    if (escenarios.length > 0) {
      guardarEscenarios(escenarios);
    }
  }, [escenarios]);

  const escenarioActivo = escenarios.find(
    (e) => e.variables.id === activoId,
  );

  const handleCambiarVariables = useCallback(
    (cambios: Partial<Variables>) => {
      if (!activoId) return;
      setEscenarios((prev) =>
        prev.map((e) =>
          e.variables.id === activoId
            ? actualizarVariables(e, cambios)
            : e,
        ),
      );
    },
    [activoId],
  );

  const handleDuplicar = useCallback(() => {
    if (!escenarioActivo) return;
    const nuevo = duplicarEscenario(escenarioActivo);
    setEscenarios((prev) => [...prev, nuevo]);
    setActivoId(nuevo.variables.id);
  }, [escenarioActivo]);

  const handleEliminar = useCallback(
    (id: string) => {
      setEscenarios((prev) => {
        const restantes = eliminarEscenario(prev, id);
        if (activoId === id && restantes.length > 0) {
          setActivoId(restantes[0].variables.id);
        } else if (restantes.length === 0) {
          const nuevo = crearEscenario({ nombre: "Escenario actual" });
          setActivoId(nuevo.variables.id);
          return [nuevo];
        }
        return restantes;
      });
    },
    [activoId],
  );

  const handlePickup = useCallback((count: number) => {
    pickupCountRef.current += count;
  }, []);

  // Simulation tick
  useEffect(() => {
    if (!escenarioActivo) return;
    const DAY_DURATION = 4.0;
    let lastTime = performance.now();
    let animFrame = 0;

    function tick(time: number) {
      const raw = (time - lastTime) / 1000;
      lastTime = time;
      if (raw > 0.5) { animFrame = requestAnimationFrame(tick); return; }

      const s = simRef.current;
      if (!s.paused) {
        s.dayProgress += (raw * s.speed) / DAY_DURATION;
        while (s.dayProgress >= 1) {
          s.dayProgress -= 1;
          s.day++;
          simDayRef.current = s.day;
          s.totalPickups += pickupCountRef.current;
          pickupCountRef.current = 0;
        }
      }
      setSimTick((t) => t + 1);
      animFrame = requestAnimationFrame(tick);
    }
    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [escenarioActivo]);

  // New day event (runs on each render to sync day display)
  useEffect(() => {
    if (!escenarioActivo || simDayRef.current <= 1) return;
  });

  if (!escenarioActivo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  const i = escenarioActivo.indicadores;
  const simState = simRef.current;

  const riesgoLabel = { bajo: "Bajo", medio: "Medio", alto: "Alto" }[i.riesgo] ?? "Medio";
  const riesgoColor = i.riesgo === "bajo" ? "text-sostenibilidad-600" : i.riesgo === "alto" ? "text-red-600" : "text-amber-600";
  const riesgoBg = i.riesgo === "bajo" ? "bg-sostenibilidad-50" : i.riesgo === "alto" ? "bg-red-50" : "bg-amber-50";

  const vehLabel = escenarioActivo.variables.tipoVehiculo === "diesel" ? "Diésel"
    : escenarioActivo.variables.tipoVehiculo === "hibrido" ? "Híbrido"
    : escenarioActivo.variables.tipoVehiculo === "electrico" ? "Eléctrico" : "Gasolina";

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">E</div>
          <div className="brand-text">
            <h1>EcoTech</h1>
            <p>Cuadro de mandos de sostenibilidad</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {usuario && (
            <span className="text-sm text-gray-500 hidden sm:inline">
              {usuario.nombre}
            </span>
          )}
          <button
            onClick={() => setPanelAbierto(!panelAbierto)}
            className="mobile-toggle"
            id="mobileToggle"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <button
            onClick={logout}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors flex items-center gap-1.5"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <aside id="sidebar" className={`app-sidebar ${panelAbierto ? "open" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <p className="section-title" style={{ margin: 0 }}>Controles</p>
          <button
            onClick={handleDuplicar}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-sostenibilidad-100 text-sostenibilidad-700 hover:bg-sostenibilidad-200 transition-colors"
          >
            + Duplicar
          </button>
        </div>
        <PanelSimulacion
          variables={escenarioActivo.variables}
          onChange={handleCambiarVariables}
        />
      </aside>

      <main className="app-main" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {/* 3D Scene */}
          <div className="scene-wrap" style={{ display: sceneWebglOk || debugMode ? "block" : "none" }}>
            <EcoScene
              variables={escenarioActivo.variables}
              sim={simState}
              onPickup={handlePickup}
              onWebglStatus={setSceneWebglOk}
              debug={debugMode}
            />
            {/* Scene overlay */}
            <div className="scene-overlay">
              <div className="scene-tag day-tag">Día {simDayRef.current}</div>
              <div className="scene-tag">{vehLabel} · {escenarioActivo.variables.numVehicles} vehículo{escenarioActivo.variables.numVehicles > 1 ? "s" : ""}</div>
              <div className="scene-tag">{escenarioActivo.variables.numTrabajadores} trabajadore{escenarioActivo.variables.numTrabajadores > 1 ? "s" : ""}</div>
              <div className="scene-tag">Recogidas: {simState.totalPickups}</div>
            </div>
            {/* Scene controls */}
            <div className="scene-control">
              <button
                onClick={() => {
                  const speeds = [1, 2, 4];
                  const idx = speeds.indexOf(simSpeed);
                  setSimSpeed(speeds[(idx + 1) % speeds.length]);
                }}
                className="ctrl-btn"
              >
                {simSpeed}× velocidad
              </button>
              <button
                onClick={() => setSimPaused(!simPaused)}
                className="ctrl-btn"
              >
                {simPaused ? "▶ Reanudar" : "⏸ Pausar"}
              </button>
            </div>
            {/* Legend */}
            <div className="scene-legend">
              <div className="legend-item"><span className="legend-dot" style={{ background: "#2D7A4F" }}></span>Tienda EcoTech</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: "#D97757" }}></span>Edificio con basura</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: "#3B6FA8" }}></span>Vehículos</div>
              <div className="legend-item" style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid #E8E8E2", color: "#9A9A93", fontSize: 10 }}>
                ↻ Arrastra para girar · rueda = zoom
              </div>
            </div>
          </div>

          {/* KPI Indicators - Merged from both projects */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Indicadores clave
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              <TarjetaIndicador
                titulo="CO₂ semanal"
                valor={i.co2Semanal}
                unidad=" kg"
                color={i.co2Semanal <= 50 ? "green" : i.co2Semanal <= 200 ? "amber" : "red"}
                icono={<Leaf className="w-5 h-5" />}
              />
              <TarjetaIndicador
                titulo="Recuperación"
                valor={i.tasaRecuperacion}
                unidad="%"
                color={i.tasaRecuperacion >= 70 ? "green" : i.tasaRecuperacion >= 50 ? "amber" : "red"}
                icono={<Recycle className="w-5 h-5" />}
              />
              <TarjetaIndicador
                titulo="Coste logístico"
                valor={i.costeLogisticoSemanal}
                unidad=" €/sem"
                color="blue"
                icono={<Truck className="w-5 h-5" />}
              />
              <TarjetaIndicador
                titulo="Coste laboral"
                valor={i.costeLaboralMensual}
                unidad=" €/mes"
                color="blue"
                icono={<Users className="w-5 h-5" />}
              />
              <TarjetaIndicador
                titulo="Reputación"
                valor={i.indiceReputacion}
                unidad="/100"
                color={i.indiceReputacion >= 70 ? "green" : i.indiceReputacion >= 40 ? "amber" : "red"}
                icono={<Award className="w-5 h-5" />}
              />
              <div className={`rounded-lg border-l-4 border-l-${i.riesgo === "bajo" ? "sostenibilidad-500" : i.riesgo === "alto" ? "red-500" : "amber-500"} p-4 ${riesgoBg} animate-fade-in`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Riesgo laboral
                    </p>
                    <div className={`text-lg font-bold ${riesgoColor}`}>
                      {riesgoLabel}
                    </div>
                  </div>
                  <Gauge className={`w-5 h-5 ${riesgoColor} opacity-60`} />
                </div>
              </div>
            </div>
          </section>

          {/* ODS */}
          <section className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-gray-400" />
              Objetivos de Desarrollo Sostenible impactados
            </h3>
            <ODSImpactados impactos={i.odsImpactados} />
          </section>

          {/* Financial Projection (from project 2) */}
          <FinancialProjection variables={escenarioActivo.variables} />

          {/* Charts (from project 1) */}
          <section className="grid lg:grid-cols-2 gap-4">
            {escenarios.length >= 2 ? (
              <>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    Comparativa de dimensiones
                  </h3>
                  <GraficoRadar escenarios={escenarios} />
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    Coste vs Ingresos
                  </h3>
                  <GraficoBarras
                    escenarios={escenarios}
                    metricas={[
                      { key: "costeTotal", label: "Coste", color: "#ef4444" },
                      { key: "ingresosSegundaMano", label: "Ingresos 2ª mano", color: "#059669" },
                      { key: "ingresosMateriales", label: "Ingresos materiales", color: "#2563eb" },
                    ]}
                  />
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-8 border border-gray-200 col-span-2 text-center">
                <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Duplica este escenario para ver gráficos comparativos
                </p>
                <button
                  onClick={handleDuplicar}
                  className="mt-3 text-sm px-4 py-2 rounded-lg bg-sostenibilidad-100 text-sostenibilidad-700 hover:bg-sostenibilidad-200 transition-colors"
                >
                  + Duplicar escenario
                </button>
              </div>
            )}
          </section>

          {/* Scenario table */}
          <section className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-400" />
              Comparativa de escenarios
            </h3>
            <TablaEscenarios
              escenarios={escenarios}
              activoId={activoId}
              onSelect={setActivoId}
              onEliminar={handleEliminar}
            />
          </section>

          <footer style={{ fontSize: 11, color: "#9A9A93", textAlign: "center", paddingBottom: 16 }}>
            Los valores son estimaciones basadas en factores estándar del sector.
            Usa los controles para explorar diferentes escenarios.
          </footer>
        </main>
    </div>
  );
}
