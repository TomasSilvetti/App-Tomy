"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  preguntaId: string | null;
  preguntaTitle: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function RespuestaSheet({ open, preguntaId, preguntaTitle, onClose, onSaved }: Props) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setText("");
      setError(null);
    }
  }, [open]);

  if (!open || !preguntaId) return null;

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("La respuesta no puede estar vacía");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/preguntas/${preguntaId}/respuestas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) {
        setError("Error al guardar");
        return;
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full md:max-w-lg rounded-t-2xl border-t border-[var(--color-border)] animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2">
          <div className="w-10 h-1 rounded-full bg-[var(--color-muted)]" />
        </div>
        <div className="flex items-start justify-between px-5 pt-3 pb-2">
          <h2 className="font-heading text-base flex-1 pr-3">{preguntaTitle}</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--color-muted)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 pt-2 space-y-3">
          <textarea
            autoFocus
            rows={5}
            placeholder="Tu respuesta..."
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-primary)] resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar respuesta"}
          </button>
        </div>
      </div>
    </div>
  );
}
