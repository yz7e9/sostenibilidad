import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatearNumero(n: number, decimals = 1): string {
  if (Math.abs(n) >= 1_000_000) {
    return (n / 1_000_000).toFixed(decimals) + "M";
  }
  if (Math.abs(n) >= 1_000) {
    return (n / 1_000).toFixed(decimals) + "k";
  }
  return n.toFixed(decimals);
}
