"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { preguntaSchema, type PreguntaInput } from "@/lib/validators";
import { MiniCalendarPreview } from "./MiniCalendarPreview";
import { toLocalInputValue } from "@/lib/fechas";
import type { RepeatUnit } from "@/lib/reminders";

export interface PreguntaParaEditar {
  id: string;
  title: string;
  reminderEnabled: boolean;
  reminderStartAt: string | null;
  repeatEveryN: number | null;
  repeatUnit: RepeatUnit | null;
  repeatCount: number | null;
}

interface Props {
  open: boolean;
  pregunta?: PreguntaParaEditar | null;
  onClose: () => void;
  onSaved: () => void;
}

export function PreguntaModal({ open, pregunta, onClose, onSaved }: Props) {
  const isEdit = !!pregunta;

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PreguntaInput>({
    resolver: zodResolver(preguntaSchema),
    defaultValues: {
      title: "",
      reminderEnabled: false,
      reminderStartAt: null,
      repeatEveryN: 1,
      repeatUnit: "weeks",
      repeatCount: 4,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (pregunta) {
      reset({
        title: pregunta.title,
        reminderEnabled: pregunta.reminderEnabled,
        reminderStartAt: pregunta.reminderStartAt,
        repeatEveryN: pregunta.repeatEveryN ?? 1,
        repeatUnit: (pregunta.repeatUnit as RepeatUnit) ?? "weeks",
        repeatCount: pregunta.repeatCount ?? 4,
      });
    } else {
      reset({
        title: "",
        reminderEnabled: false,
        reminderStartAt: null,
        repeatEveryN: 1,
        repeatUnit: "weeks",
        repeatCount: 4,
      });
    }
  }, [open, pregunta, reset]);

  const reminderEnabled = watch("reminderEnabled");
  const startAt = watch("reminderStartAt");
  const everyN = watch("repeatEveryN");
  const unit = watch("repeatUnit");
  const count = watch("repeatCount");

  if (!open) return null;

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      ...values,
      reminderStartAt: values.reminderStartAt ? new Date(values.reminderStartAt).toISOString() : null,
    };
    const url = isEdit ? `/api/preguntas/${pregunta!.id}` : "/api/preguntas";
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("Error guardando pregunta", await res.text());
      return;
    }
    onSaved();
    onClose();
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full md:max-w-lg md:rounded-lg rounded-t-2xl border border-[var(--color-border)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] sticky top-0 bg-white z-10">
          <h2 className="font-heading text-lg">{isEdit ? "Editar pregunta" : "Nueva pregunta"}</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--color-muted)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-5">
          <div>
            <label htmlFor="title" className="block text-xs font-small uppercase tracking-wider mb-1">
              Pregunta
            </label>
            <input
              id="title"
              type="text"
              placeholder="Pregunta"
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-primary)]"
              {...register("title")}
            />
            {errors.title && <p className="text-xs text-[var(--color-danger)] mt-1">{errors.title.message}</p>}
          </div>

          <div className="flex items-center justify-between border border-[var(--color-border)] rounded-lg px-3 py-2">
            <span className="text-sm">Recordatorios push</span>
            <Controller
              control={control}
              name="reminderEnabled"
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  onClick={() => {
                    const newVal = !field.value;
                    field.onChange(newVal);
                    if (newVal && !startAt) {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(9, 0, 0, 0);
                      setValue("reminderStartAt", tomorrow.toISOString());
                    }
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    field.value ? "bg-[var(--color-primary)]" : "bg-[var(--color-muted)]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      field.value ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              )}
            />
          </div>

          {reminderEnabled && (
            <div className="space-y-4 pl-1 border-l-2 border-[var(--color-muted)]">
              <div>
                <label htmlFor="reminderStartAt" className="block text-xs font-small uppercase tracking-wider mb-1">
                  Día y hora de inicio
                </label>
                <input
                  id="reminderStartAt"
                  type="datetime-local"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-primary)]"
                  value={startAt ? toLocalInputValue(startAt) : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setValue("reminderStartAt", v ? new Date(v).toISOString() : null, { shouldValidate: true });
                  }}
                />
                {errors.reminderStartAt && (
                  <p className="text-xs text-[var(--color-danger)] mt-1">{errors.reminderStartAt.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="repeatEveryN" className="block text-xs font-small uppercase tracking-wider mb-1">
                    Cada
                  </label>
                  <input
                    id="repeatEveryN"
                    type="number"
                    min={1}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-primary)]"
                    {...register("repeatEveryN", { valueAsNumber: true })}
                  />
                  {errors.repeatEveryN && (
                    <p className="text-xs text-[var(--color-danger)] mt-1">{errors.repeatEveryN.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="repeatUnit" className="block text-xs font-small uppercase tracking-wider mb-1">
                    Unidad
                  </label>
                  <select
                    id="repeatUnit"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-primary)]"
                    {...register("repeatUnit")}
                  >
                    <option value="days">días</option>
                    <option value="weeks">semanas</option>
                    <option value="months">meses</option>
                  </select>
                  {errors.repeatUnit && (
                    <p className="text-xs text-[var(--color-danger)] mt-1">{errors.repeatUnit.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="repeatCount" className="block text-xs font-small uppercase tracking-wider mb-1">
                  Cantidad de repeticiones
                </label>
                <input
                  id="repeatCount"
                  type="number"
                  min={1}
                  max={365}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-primary)]"
                  {...register("repeatCount", { valueAsNumber: true })}
                />
                {errors.repeatCount && (
                  <p className="text-xs text-[var(--color-danger)] mt-1">{errors.repeatCount.message}</p>
                )}
              </div>

              <MiniCalendarPreview
                startAt={startAt ?? null}
                repeatEveryN={everyN ?? null}
                repeatUnit={(unit as RepeatUnit) ?? null}
                repeatCount={count ?? null}
              />
            </div>
          )}

          <div className="flex gap-2 pt-2 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
