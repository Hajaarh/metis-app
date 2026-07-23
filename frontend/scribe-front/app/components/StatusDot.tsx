"use client";

import type { NoteStatus } from "@/app/lib/mock-data";

const STATUS_CONFIG = {
  ready: { color: "#5E9E72", label: "Prêt" },
  transcribing: { color: "#8A8A85", label: "Transcription…" },
  enhancing: { color: "#D9A15B", label: "Enrichissement…" },
} as const;

export function StatusDot({ status }: { status: NoteStatus }) {
  const { color, label } = STATUS_CONFIG[status];
  const isAnimated = status !== "ready";

  return (
    <span className="flex items-center gap-1.5">
      <span className="relative flex h-1.5 w-1.5">
        {isAnimated && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ background: color }}
          />
        )}
        <span
          className="relative inline-flex rounded-full h-1.5 w-1.5"
          style={{ background: color }}
        />
      </span>
      <span className="text-[11px] font-medium" style={{ color }}>
        {label}
      </span>
    </span>
  );
}
