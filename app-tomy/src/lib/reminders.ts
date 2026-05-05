import { addDays, addMonths, addWeeks } from "date-fns";

export type RepeatUnit = "days" | "weeks" | "months";

export function calcularFechasRecordatorio(
  startAt: Date,
  repeatEveryN: number,
  repeatUnit: RepeatUnit,
  repeatCount: number,
): Date[] {
  const fechas: Date[] = [];
  for (let i = 0; i < repeatCount; i++) {
    const offset = repeatEveryN * i;
    let fecha: Date;
    if (repeatUnit === "days") fecha = addDays(startAt, offset);
    else if (repeatUnit === "weeks") fecha = addWeeks(startAt, offset);
    else fecha = addMonths(startAt, offset);
    fechas.push(fecha);
  }
  return fechas;
}
