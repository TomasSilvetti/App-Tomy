import { format } from "date-fns";

export function formatFechaCorta(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return format(typeof d === "string" ? new Date(d) : d, "dd/MM/yyyy");
}

export function formatFechaHora(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return format(typeof d === "string" ? new Date(d) : d, "dd/MM/yyyy HH:mm");
}

export function toLocalInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}
