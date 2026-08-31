"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Pencil } from "lucide-react";
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
  highlightedSegmentId?: string | null;
  onSegmentHighlighted?: () => void;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, query: string, startIdx: number, activeIdx: number) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, "gi"));
  let matchIdx = startIdx;
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const idx = matchIdx++;
      return (
        <mark
          key={i}
          data-match={idx}
          className={`rounded px-0.5 ${idx === activeIdx ? "bg-yellow-400 text-foreground" : "bg-yellow-200 text-foreground"}`}
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function TranscriptView({ meetingId, segments, locuteurs, highlightedSegmentId, onSegmentHighlighted }: TranscriptViewProps) {
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [locuteurNames, setLocuteurNames] = useState<Record<string, string>>(
    Object.fromEntries(locuteurs.map((l) => [l.id, l.label]))
  );
  const [renameError, setRenameError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  useEffect(() => {
    if (!highlightedSegmentId) return;
    const el = document.querySelector(`[data-segment-id="${highlightedSegmentId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => onSegmentHighlighted?.(), 3000);
    return () => clearTimeout(timer);
  }, [highlightedSegmentId]);

  // Compute cumulative match offsets per segment
  const matchOffsets: number[] = [];
  let totalMatches = 0;
  for (const seg of segments) {
    matchOffsets.push(totalMatches);
    if (!seg.inaudible && query.trim()) {
      totalMatches += (seg.texte.match(new RegExp(escapeRegex(query), "gi")) || []).length;
    }
  }

  useEffect(() => { setCurrentMatchIdx(0); }, [query]);

  useEffect(() => {
    if (!query.trim() || totalMatches === 0) return;
    const marks = document.querySelectorAll("[data-match]");
    (marks[currentMatchIdx] as HTMLElement | undefined)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentMatchIdx, query, totalMatches]);

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
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Rechercher dans la transcription…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 text-[13px] bg-muted rounded-lg px-3 py-1.5 outline-none placeholder:text-muted-foreground text-foreground"
        />
        {query.trim() && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[12px] text-muted-foreground">
              {totalMatches === 0 ? "0 résultat" : `${currentMatchIdx + 1} / ${totalMatches}`}
            </span>
            <button
              onClick={() => setCurrentMatchIdx((i) => (i - 1 + totalMatches) % totalMatches)}
              disabled={totalMatches === 0}
              className="p-1 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground hover:text-foreground"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => setCurrentMatchIdx((i) => (i + 1) % totalMatches)}
              disabled={totalMatches === 0}
              className="p-1 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground hover:text-foreground"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}
      </div>

      {renameError && (
        <p className="text-[12px] text-destructive">{renameError}</p>
      )}

      {segments.map((segment, segIdx) => {
        const name = getLocuteurName(segment.locuteur_id);
        const isHighlighted = highlightedSegmentId === segment.id;
        return (
          <div
            key={segment.id}
            data-segment-id={segment.id}
            className={`flex gap-3 rounded-xl px-2 py-1 -mx-2 transition-colors duration-500 ${isHighlighted ? "bg-primary/8 ring-1 ring-primary/20" : ""}`}
          >
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
                <p className="text-[14px] leading-relaxed text-foreground">
                  {highlightText(segment.texte, query, matchOffsets[segIdx], currentMatchIdx)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
