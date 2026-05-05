"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { RespuestaSheet } from "@/components/RespuestaSheet";
import { formatFechaHora } from "@/lib/fechas";

interface Respuesta {
  id: string;
  text: string;
  createdAt: string;
}

interface PreguntaDetalle {
  id: string;
  title: string;
  answers: Respuesta[];
}

export default function DetallePreguntaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<PreguntaDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`/api/preguntas/${id}/respuestas`, { cache: "no-store" });
      if (res.status === 404) {
        setError("Pregunta no encontrada");
        return;
      }
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("No se pudo cargar la pregunta");
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="px-4 md:px-8 py-6 pb-24 md:pb-6 max-w-3xl mx-auto">
      <Link
        href="/preguntas"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-secondary)]/70 hover:text-[var(--color-primary)] mb-4"
      >
        <ArrowLeft size={14} /> Volver
      </Link>

      {error && (
        <div className="bg-white border border-[var(--color-danger)] rounded-lg p-4 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="space-y-3">
          <div className="h-6 bg-[var(--color-muted)] rounded w-2/3 animate-pulse" />
          <div className="h-20 bg-white border border-[var(--color-border)] rounded-lg animate-pulse" />
        </div>
      )}

      {data && (
        <>
          <div className="flex items-start justify-between gap-3 mb-5">
            <h1 className="font-heading text-2xl break-words">{data.title}</h1>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] text-sm whitespace-nowrap"
            >
              <Plus size={14} /> Responder
            </button>
          </div>

          {data.answers.length === 0 ? (
            <div className="bg-white border border-[var(--color-border)] rounded-lg p-10 text-center text-sm text-[var(--color-secondary)]/70">
              Todavía no respondiste esta pregunta.
            </div>
          ) : (
            <ul className="space-y-3">
              {data.answers.map((r) => (
                <li key={r.id} className="bg-white border border-[var(--color-border)] rounded-lg p-4">
                  <div className="text-xs font-small uppercase tracking-wider text-[var(--color-secondary)]/60 mb-1">
                    {formatFechaHora(r.createdAt)}
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{r.text}</p>
                </li>
              ))}
            </ul>
          )}

          <RespuestaSheet
            open={sheetOpen}
            preguntaId={data.id}
            preguntaTitle={data.title}
            onClose={() => setSheetOpen(false)}
            onSaved={cargar}
          />
        </>
      )}
    </div>
  );
}
