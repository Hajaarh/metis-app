"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { MeetingAvatar } from "./MeetingAvatar";
import { formatTimestamp } from "@/app/lib/mock-data";
import type { MockSegment, MockLocuteur } from "@/app/lib/mock-data";

interface TranscriptViewProps {
  segments: MockSegment[];
  locuteurs: MockLocuteur[];
}

export function TranscriptView({ segments, locuteurs }: TranscriptViewProps) {
  const [editingLocuteur, setEditingLocuteur] = useState<string | null>(null);
  const [locuteurNames, setLocuteurNames] = useState<Record<string, string>>(
    Object.fromEntries(locuteurs.map((l) => [l.id, l.nomNominatif || l.label]))
  );

  function getLocuteurName(id: string) {
    return locuteurNames[id] || "Inconnu";
  }

  function handleRename(locuteurId: string, newName: string) {
    setLocuteurNames((prev) => ({ ...prev, [locuteurId]: newName }));
    setEditingLocuteur(null);
  }

  return (
    <div className="space-y-4">
      {segments.map((segment) => {
        const name = getLocuteurName(segment.locuteurId);
        return (
          <div key={segment.id} className="flex gap-3">
            <MeetingAvatar name={name} size={28} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {editingLocuteur === segment.locuteurId ? (
                  <input
                    autoFocus
                    defaultValue={name}
                    className="text-[13px] font-medium text-foreground bg-input-background border border-ring rounded px-1.5 py-0.5 outline-none"
                    onBlur={(e) => handleRename(segment.locuteurId, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(segment.locuteurId, (e.target as HTMLInputElement).value);
                      if (e.key === "Escape") setEditingLocuteur(null);
                    }}
                  />
                ) : (
                  <button
                    onClick={() => setEditingLocuteur(segment.locuteurId)}
                    className="text-[13px] font-medium text-foreground hover:text-primary transition-colors"
                    title="Cliquer pour renommer"
                  >
                    {name}
                  </button>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {formatTimestamp(segment.horodatageDebut)} – {formatTimestamp(segment.horodatageFin)}
                </span>
              </div>
              {segment.inaudible ? (
                <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground italic">
                  <AlertTriangle size={12} className="text-muted-foreground" />
                  Passage inaudible
                </div>
              ) : (
                <p className="text-[14px] leading-relaxed text-foreground">
                  {segment.texte}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
