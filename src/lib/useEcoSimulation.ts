"use client";

import { useRef, useCallback, useEffect } from "react";

export interface SimState {
  day: number;
  dayProgress: number;
  speed: number;
  paused: boolean;
  totalPickups: number;
  pickupBusy: boolean;
}

export function createSimState(): SimState {
  return { day: 1, dayProgress: 0, speed: 1, paused: false, totalPickups: 0, pickupBusy: false };
}

export type SimAction =
  | { type: "TICK"; dt: number; dayDuration: number }
  | { type: "SET_SPEED"; speed: number }
  | { type: "TOGGLE_PAUSE" }
  | { type: "RESET" }
  | { type: "PICKUP"; count: number }
  | { type: "SET_PICKUP_BUSY"; busy: boolean };

export function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case "TICK": {
      if (state.paused) return state;
      const raw = action.dt * state.speed;
      let { day, dayProgress, totalPickups } = state;
      dayProgress += raw / action.dayDuration;
      while (dayProgress >= 1) {
        dayProgress -= 1;
        day++;
      }
      return { ...state, day, dayProgress, totalPickups };
    }
    case "SET_SPEED":
      return { ...state, speed: action.speed };
    case "TOGGLE_PAUSE":
      return { ...state, paused: !state.paused };
    case "RESET":
      return createSimState();
    case "PICKUP":
      return { ...state, totalPickups: state.totalPickups + action.count };
    case "SET_PICKUP_BUSY":
      return { ...state, pickupBusy: action.busy };
    default:
      return state;
  }
}

export function useDayCycle(
  simRef: React.MutableRefObject<SimState>,
  dayDuration: number,
  onNewDay: () => void,
) {
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  const tick = useCallback((time: number) => {
    const raw = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;
    if (raw > 0.5) { animRef.current = requestAnimationFrame(tick); return; }

    const s = simRef.current;
    if (!s.paused) {
      s.dayProgress += (raw * s.speed) / dayDuration;
      while (s.dayProgress >= 1) {
        s.dayProgress -= 1;
        s.day++;
        onNewDay();
      }
    }
    animRef.current = requestAnimationFrame(tick);
  }, [dayDuration, onNewDay, simRef]);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [tick]);
}

export function isPickupDay(day: number, frequency: number): boolean {
  if (frequency <= 0) return false;
  const daysBetween = Math.max(1, Math.round(7 / frequency));
  return (day - 1) % daysBetween === 0;
}
