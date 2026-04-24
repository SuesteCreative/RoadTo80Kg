import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtEur(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export function fmtKcal(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${Math.round(n)} kcal`;
}
