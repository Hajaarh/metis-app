"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, MoreHorizontal, Trash2, Pencil } from "lucide-react";
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
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getGroup(dateStr: string): "today" | "yesterday" | "week" | "older" {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (day.getTime() === today.getTime()) return "today";
  if (day.getTime() === yesterday.getTime()) return "yesterday";
  if (day >= weekAgo) return "week";
  return "older";
}

const GROUP_LABELS: Record<string, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  week: "Cette semaine",
  older: "Plus ancien",
};

export default function DashboardPage() {
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  useEffect(() => {
    apiFetch("/meetings")
      .then((r) => r.ok ? r.json() : [])
      .then(setReunions)
      .finally(() => setLoading(false));
  }, []);

  function startRename(reunion: Reunion) {
    setRenamingId(reunion.id);
    setRenameDraft(reunion.titre);
  }

  async function saveRename(id: string) {
    if (!renameDraft.trim()) { setRenamingId(null); return; }
    const original = reunions.find((r) => r.id === id)?.titre;
    if (renameDraft.trim() === original) { setRenamingId(null); return; }
    const r = await apiFetch(`/meetings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ titre: renameDraft.trim() }),
    });
    if (r.ok) {
      setReunions((prev) => prev.map((re) => re.id === id ? { ...re, titre: renameDraft.trim() } : re));
    }
    setRenamingId(null);
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

  const groups = (["today", "yesterday", "week", "older"] as const).map((key) => ({
    key,
    label: GROUP_LABELS[key],
    items: filtered.filter((r) => getGroup(r.date_debut) === key),
  })).filter((g) => g.items.length > 0);

  return (
    <AppSidebar>
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4 shrink-0 border-b border-border">
        <div>
          <h1 className="text-xl font-medium text-foreground">Réunions</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground">{reunions.length} réunion{reunions.length !== 1 ? "s" : ""}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
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
      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-hide">
        {loading && (
          <p className="text-sm text-muted-foreground text-center py-12">Chargement…</p>
        )}
        {!loading && groups.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            {search ? "Aucun résultat." : "Aucune réunion pour l'instant."}
          </p>
        )}
        {groups.map(({ key, label, items }) => (
          <div key={key} className="mb-8">
            <p className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground mb-3 px-1">
              {label}
            </p>
            <div className="space-y-1">
              {items.map((reunion) => (
                <div
                  key={reunion.id}
                  className="group flex items-center gap-2 px-4 py-3 rounded-xl transition-colors hover:bg-muted/50"
                >
                  {renamingId === reunion.id ? (
                    <input
                      autoFocus
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onBlur={() => saveRename(reunion.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(reunion.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="flex-1 text-[13.5px] font-medium text-foreground bg-transparent border-b border-primary outline-none"
                    />
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
                      <DropdownMenuItem
                        className="gap-2"
                        onSelect={() => startRename(reunion)}
                      >
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
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppSidebar>
  );
}
