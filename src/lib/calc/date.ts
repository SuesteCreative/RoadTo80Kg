import { startOfWeek, addDays, format } from "date-fns";

export function weekStartISO(d = new Date()): string {
  return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function dayLabelPt(dayIdx: number): string {
  return ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][dayIdx] ?? "";
}

export function isoDay(weekStart: string, day: number): string {
  return format(addDays(new Date(weekStart), day), "yyyy-MM-dd");
}
