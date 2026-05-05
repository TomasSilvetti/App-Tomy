"use client";

import { calcularFechasRecordatorio, type RepeatUnit } from "@/lib/reminders";
import { format, isSameDay } from "date-fns";

interface Props {
  startAt: string | null;
  repeatEveryN: number | null;
  repeatUnit: RepeatUnit | null;
  repeatCount: number | null;
}

export function MiniCalendarPreview({ startAt, repeatEveryN, repeatUnit, repeatCount }: Props) {
  if (!startAt || !repeatEveryN || !repeatUnit || !repeatCount) {
    return (
      <div className="text-xs text-[var(--color-secondary)]/60 italic">
        Completá los campos para ver una vista previa de las fechas.
      </div>
    );
  }

  const fechas = calcularFechasRecordatorio(new Date(startAt), repeatEveryN, repeatUnit, repeatCount);
  const hoy = new Date();

  return (
    <div className="border border-[var(--color-border)] rounded-lg p-3 bg-[var(--color-surface)]">
      <div className="text-xs font-small uppercase tracking-wider text-[var(--color-secondary)]/70 mb-2">
        Fechas programadas ({fechas.length})
      </div>
      <ul className="space-y-1 max-h-40 overflow-y-auto">
        {fechas.map((f, i) => (
          <li
            key={i}
            className={`text-xs flex justify-between px-2 py-1 rounded ${
              isSameDay(f, hoy) ? "bg-[var(--color-primary)] text-white" : ""
            }`}
          >
            <span>{format(f, "dd/MM/yyyy")}</span>
            <span className="font-small opacity-70">{format(f, "HH:mm")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
