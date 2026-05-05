"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

interface Props {
  onEdit: () => void;
  onDelete: () => void;
}

export function PreguntaMenu({ onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Opciones"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-1.5 rounded hover:bg-[var(--color-muted)]"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden min-w-[140px]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-muted)] text-left"
          >
            <Pencil size={14} /> Editar
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-muted)] text-left text-[var(--color-danger)]"
          >
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
