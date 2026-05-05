"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Bell, BellOff, MessageSquare, Clock } from "lucide-react";
import { PreguntaModal, type PreguntaParaEditar } from "@/components/PreguntaModal";
import { RespuestaSheet } from "@/components/RespuestaSheet";
import { PreguntaMenu } from "@/components/PreguntaMenu";
import { formatFechaCorta } from "@/lib/fechas";

interface PreguntaItem {
  id: string;
  title: string;
  reminderEnabled: boolean;
  reminderStartAt: string | null;
  repeatEveryN: number | null;
  repeatUnit: string | null;
  repeatCount: number | null;
  createdAt: string;
  lastAnswerAt: string | null;
  answersCount: number;
  pendingCount: number;
}

export default function PreguntasPage() {
  return (
    <Suspense fallback={<div className="px-4 md:px-8 py-6" />}>
      <PreguntasInner />
    </Suspense>
  );
}

function PreguntasInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const responderId = searchParams.get("responder");

  const [preguntas, setPreguntas] = useState<PreguntaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PreguntaParaEditar | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTarget, setSheetTarget] = useState<{ id: string; title: string } | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/preguntas", { cache: "no-store" });
      if (!res.ok) throw new Error("Error");
      const data: PreguntaItem[] = await res.json();
      setPreguntas(data);
    } catch {
      setError("No se pudieron cargar las preguntas");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (responderId && preguntas) {
      const p = preguntas.find((x) => x.id === responderId);
      if (p) {
        setSheetTarget({ id: p.id, title: p.title });
        setSheetOpen(true);
      }
    }
  }, [responderId, preguntas]);

  const abrirCrear = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const abrirEditar = (p: PreguntaItem) => {
    setEditing({
      id: p.id,
      title: p.title,
      reminderEnabled: p.reminderEnabled,
      reminderStartAt: p.reminderStartAt,
      repeatEveryN: p.repeatEveryN,
      repeatUnit: p.repeatUnit as PreguntaParaEditar["repeatUnit"],
      repeatCount: p.repeatCount,
    });
    setModalOpen(true);
  };

  const eliminar = async (p: PreguntaItem) => {
    if (!confirm(`¿Eliminar "${p.title}" y todas sus respuestas?`)) return;
    const res = await fetch(`/api/preguntas/${p.id}`, { method: "DELETE" });
    if (res.ok) cargar();
  };

  const cerrarSheet = () => {
    setSheetOpen(false);
    setSheetTarget(null);
    if (responderId) {
      router.replace("/preguntas");
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 pb-24 md:pb-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading text-2xl">Preguntas</h1>
        <button
          type="button"
          onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] text-sm"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {error && (
        <div className="bg-white border border-[var(--color-danger)] rounded-lg p-4 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {!preguntas && !error && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-[var(--color-border)] rounded-lg p-5 animate-pulse">
              <div className="h-4 bg-[var(--color-muted)] rounded w-2/3 mb-3" />
              <div className="h-3 bg-[var(--color-muted)] rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {preguntas && preguntas.length === 0 && (
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-10 text-center">
          <MessageSquare className="mx-auto mb-3 text-[var(--color-muted)]" size={32} />
          <p className="text-sm text-[var(--color-secondary)]/70">
            Todavía no creaste ninguna pregunta. Tocá <strong>Agregar</strong> para empezar.
          </p>
        </div>
      )}

      {preguntas && preguntas.length > 0 && (
        <ul className="space-y-3">
          {preguntas.map((p) => (
            <li
              key={p.id}
              className="bg-white border border-[var(--color-border)] rounded-lg p-5 hover:border-[var(--color-primary)]/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <Link href={`/preguntas/${p.id}`} className="flex-1 min-w-0">
                  <h3 className="font-heading text-base mb-2 break-words">{p.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-secondary)]/80">
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare size={12} /> {p.answersCount} respuesta{p.answersCount === 1 ? "" : "s"}
                    </span>
                    {p.reminderEnabled && p.pendingCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[var(--color-danger)]">
                        <Bell size={12} /> {p.pendingCount} pendiente{p.pendingCount === 1 ? "" : "s"}
                      </span>
                    )}
                    {p.reminderEnabled ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> Inicio {formatFechaCorta(p.reminderStartAt)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 opacity-60">
                        <BellOff size={12} /> Sin recordatorios
                      </span>
                    )}
                    <span>Última: {formatFechaCorta(p.lastAnswerAt)}</span>
                  </div>
                </Link>
                <PreguntaMenu onEdit={() => abrirEditar(p)} onDelete={() => eliminar(p)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <PreguntaModal
        open={modalOpen}
        pregunta={editing}
        onClose={() => setModalOpen(false)}
        onSaved={cargar}
      />
      <RespuestaSheet
        open={sheetOpen}
        preguntaId={sheetTarget?.id ?? null}
        preguntaTitle={sheetTarget?.title ?? null}
        onClose={cerrarSheet}
        onSaved={cargar}
      />
    </div>
  );
}
