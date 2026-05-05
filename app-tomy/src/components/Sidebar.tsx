"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquareQuote } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/preguntas", label: "Preguntas", icon: MessageSquareQuote },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col bg-[#253551] text-white border-r border-[var(--color-border)]">
        <div className="px-5 py-6">
          <h1 className="font-heading text-xl tracking-tight">Tomy</h1>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            const active = pathname?.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active ? "bg-white/10" : "hover:bg-white/5",
                )}
              >
                <Icon size={16} />
                <span>{it.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#253551] text-white border-t border-[var(--color-border)] flex items-stretch">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname?.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={clsx(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[11px]",
                active ? "bg-white/10" : "",
              )}
            >
              <Icon size={18} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
