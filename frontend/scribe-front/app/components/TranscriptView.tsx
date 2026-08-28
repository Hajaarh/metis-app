"use client";

import { useState } from "react";
import { AlertTriangle, Pencil } from "lucide-react";
import { MeetingAvatar } from "./MeetingAvatar";
import { apiFetch } from "@/app/lib/api";

export interface Segment {
  id: string;
  locuteur_id: string;
  texte: string;
  horodatage_debut: number;
  horodatage_fin: number;
  inaudible: boolean;
}

export interface Locuteur {
  id: string;
  label: string;
}

interface TranscriptViewProps {
  meetingId: string;
  segments: Segment[];
  locuteurs: Locuteur[];
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function TranscriptView({ meetingId, segments, locuteurs }: TranscriptViewProps) {
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [locuteurNames, setLocuteurNames] = useState<Record<string, string>>(
    Object.fromEntries(locuteurs.map((l) => [l.id, l.label]))
  );
  const [renameError, setRenameError] = useState<string | null>(null);

  function getLocuteurName(id: string) {
    return locuteurNames[id] ?? "Inconnu";
  }

  async function handleRename(locuteurId: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) { setEditingSegmentId(null); return; }
    const previous = locuteurNames[locuteurId];
    setLocuteurNames((prev) => ({ ...prev, [locuteurId]: trimmed }));
    setEditingSegmentId(null);
    setRenameError(null);
    const r = await apiFetch(`/meetings/${meetingId}/locuteurs/${locuteurId}`, {
      method: "PATCH",
      body: JSON.stringify({ label: trimmed }),
    });
    if (!r.ok) {
      setLocuteurNames((prev) => ({ ...prev, [locuteurId]: previous }));
      setRenameError("Impossible de renommer l'intervenant.");
    }
  }

  return (
    <div className="space-y-4">
      {renameError && (
        <p className="text-[12px] text-destructive">{renameError}</p>
      )}
      {segments.map((segment) => {
        const name = getLocuteurName(segment.locuteur_id);
        return (
          <div key={segment.id} className="flex gap-3">
            <MeetingAvatar name={name} size={28} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {editingSegmentId === segment.id ? (
                  <input
                    autoFocus
                    defaultValue={name}
                    className="text-[13px] font-medium text-foreground bg-input-background border border-ring rounded px-1.5 py-0.5 outline-none"
                    onBlur={(e) => handleRename(segment.locuteur_id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(segment.locuteur_id, (e.target as HTMLInputElement).value);
                      if (e.key === "Escape") setEditingSegmentId(null);
                    }}
                  />
                ) : (
                  <button
                    onClick={() => setEditingSegmentId(segment.id)}
                    className="group flex items-center gap-1 text-[13px] font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {name}
                    <Pencil size={11} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                  </button>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {formatTimestamp(segment.horodatage_debut)} – {formatTimestamp(segment.horodatage_fin)}
                </span>
              </div>
              {segment.inaudible ? (
                <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground italic">
                  <AlertTriangle size={12} />
                  Passage inaudible
                </div>
              ) : (
                <p className="text-[14px] leading-relaxed text-foreground">{segment.texte}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
