"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, MoreHorizontal, Trash2, Pencil, ChevronDown, ChevronRight } from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { StatusDot, type BackendStatus } from "@/app/components/StatusDot";
import { Button } from "@/app/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { apiFetch } from "@/app/lib/api";

interface Reunion {
  id: string;
  titre: string;
  statut_traitement: BackendStatus;
  date_debut: string;
  type_reunion: string | null;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDayKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (day.getTime() === today.getTime()) return "Aujourd'hui";
  if (day.getTime() === yesterday.getTime()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

export default function DashboardPage() {
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "type">("date");
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    apiFetch("/meetings")
      .then((r) => r.ok ? r.json() : [])
      .then(setReunions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggleDay(key: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function startRename(reunion: Reunion) {
    setRenamingId(reunion.id);
    setRenameDraft(reunion.titre);
  }

  async function saveRename(id: string) {
    setRenameError(null);
    if (!renameDraft.trim()) { setRenamingId(null); return; }
    const original = reunions.find((r) => r.id === id)?.titre;
    if (renameDraft.trim() === original) { setRenamingId(null); return; }
    const r = await apiFetch(`/meetings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ titre: renameDraft.trim() }),
    });
    if (r.ok) {
      setReunions((prev) => prev.map((re) => re.id === id ? { ...re, titre: renameDraft.trim() } : re));
      setRenamingId(null);
    } else {
      setRenameError("Impossible de renommer. Réessayez.");
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const r = await apiFetch(`/meetings/${id}`, { method: "DELETE" });
    if (r.ok || r.status === 204) {
      setReunions((prev) => prev.filter((re) => re.id !== id));
    }
    setDeleting(null);
  }

  const filtered = reunions.filter((r) =>
    r.titre.toLowerCase().includes(search.toLowerCase())
  );

  const TODAY_KEY = getTodayKey();

  const dateGroups = (() => {
    const map = new Map<string, Reunion[]>();
    for (const r of filtered) {
      const key = toDayKey(r.date_debut);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => ({
        key,
        label: dayLabel(items[0].date_debut),
        isToday: key === TODAY_KEY,
        items,
      }));
  })();

  const typeGroups = [...new Set(filtered.map((r) => r.type_reunion ?? "__none__"))]
    .sort((a, b) => {
      if (a === "__none__") return 1;
      if (b === "__none__") return -1;
      return a.localeCompare(b, "fr");
    })
    .map((type) => ({
      key: type,
      label: type === "__none__" ? "Sans type" : type,
      items: filtered.filter((r) => (r.type_reunion ?? "__none__") === type),
    }))
    .filter((g) => g.items.length > 0);

  function renderItem(reunion: Reunion) {
    return (
      <div
        key={reunion.id}
        className="group flex items-center gap-2 px-4 py-3 rounded-xl transition-colors hover:bg-muted/50"
      >
        {renamingId === reunion.id ? (
          <div className="flex-1 flex flex-col gap-0.5">
            <input
              autoFocus
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onBlur={() => saveRename(reunion.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRename(reunion.id);
                if (e.key === "Escape") { setRenamingId(null); setRenameError(null); }
              }}
              className="text-[13.5px] font-medium text-foreground bg-transparent border-b border-primary outline-none"
            />
            {renameError && <p className="text-[11px] text-destructive">{renameError}</p>}
          </div>
        ) : (
          <Link href={`/reunions/${reunion.id}`} className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[13.5px] font-medium text-foreground truncate">
                {reunion.titre}
              </span>
              <StatusDot status={reunion.statut_traitement} />
            </div>
            <span className="text-[12px] text-muted-foreground">
              {formatTime(reunion.date_debut)}
            </span>
          </Link>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
              <MoreHorizontal size={15} strokeWidth={2} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2" onSelect={() => startRename(reunion)}>
              <Pencil size={13} />
              Renommer
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive gap-2"
              disabled={deleting === reunion.id}
              onSelect={() => handleDelete(reunion.id)}
            >
              <Trash2 size={13} />
              {deleting === reunion.id ? "Suppression…" : "Supprimer"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  const isEmpty = sortBy === "date" ? dateGroups.length === 0 : typeGroups.length === 0;

  return (
    <AppSidebar>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-8 pt-6 pb-4 shrink-0 border-b border-border gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl font-medium text-foreground">Réunions</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground">{reunions.length} réunion{reunions.length !== 1 ? "s" : ""}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-[10px] p-[3px] gap-0.5 bg-muted">
            {(["date", "type"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setSortBy(value)}
                className={`px-3 py-1 rounded-[8px] text-[12px] font-medium transition-all ${
                  sortBy === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {value === "date" ? "Par date" : "Par type"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 h-8 rounded-xl px-3 bg-secondary">
            <Search size={12} strokeWidth={2} className="text-muted-foreground" />
            <input
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-[12.5px] outline-none border-none placeholder:text-muted-foreground text-foreground w-40"
            />
          </div>
          <Button asChild size="sm">
            <Link href="/reunions/new">
              <Plus size={14} />
              Nouvelle réunion
            </Link>
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 scrollbar-hide">
        {loading && (
          <p className="text-sm text-muted-foreground text-center py-12">Chargement…</p>
        )}
        {!loading && isEmpty && (
          <p className="text-sm text-muted-foreground text-center py-12">
            {search ? "Aucun résultat." : "Aucune réunion pour l'instant."}
          </p>
        )}

        {sortBy === "date" && dateGroups.map(({ key, label, isToday, items }) => (
          <div key={key} className="mb-6">
            <button
              onClick={() => toggleDay(key)}
              className="flex items-center gap-1.5 w-full text-left px-1 mb-2 group/toggle"
            >
              {(!isToday && !expandedDays.has(key)) || (isToday && expandedDays.has(key))
                ? <ChevronRight size={11} className="text-muted-foreground shrink-0" />
                : <ChevronDown size={11} className="text-muted-foreground shrink-0" />
              }
              <span className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground group-hover/toggle:text-foreground transition-colors">
                {label}
              </span>
              <span className="text-[10.5px] text-muted-foreground/50 normal-case tracking-normal ml-1">
                {items.length}
              </span>
            </button>
            {(isToday ? !expandedDays.has(key) : expandedDays.has(key)) && (
              <div className="space-y-1">
                {items.map((reunion) => renderItem(reunion))}
              </div>
            )}
          </div>
        ))}

        {sortBy === "type" && typeGroups.map(({ key, label, items }) => (
          <div key={key} className="mb-8">
            <p className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground mb-3 px-1">
              {label}
            </p>
            <div className="space-y-1">
              {items.map((reunion) => renderItem(reunion))}
            </div>
          </div>
        ))}
      </div>
    </AppSidebar>
  );
}
