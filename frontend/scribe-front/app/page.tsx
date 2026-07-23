"use client";

import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { StatusDot } from "@/app/components/StatusDot";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { MOCK_REUNIONS, formatDuration, formatTime } from "@/app/lib/mock-data";

const GROUPS: [string, typeof MOCK_REUNIONS][] = [
  ["Aujourd'hui", MOCK_REUNIONS.filter((r) => r.date === "today")],
  ["Hier", MOCK_REUNIONS.filter((r) => r.date === "yesterday")],
  ["Cette semaine", MOCK_REUNIONS.filter((r) => r.date === "week")],
];

export default function DashboardPage() {
  return (
    <AppSidebar>
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4 shrink-0 border-b border-border">
        <div>
          <h1 className="text-xl font-medium text-foreground">Réunions</h1>
          <p className="text-sm text-muted-foreground">{MOCK_REUNIONS.length} réunions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 h-8 rounded-xl px-3 bg-secondary">
            <Search size={12} strokeWidth={2} className="text-muted-foreground" />
            <input
              placeholder="Rechercher…"
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

      {/* Meeting list */}
      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-hide">
        {GROUPS.map(([label, reunions]) =>
          reunions.length > 0 ? (
            <div key={label} className="mb-8">
              <p className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground mb-3 px-1">
                {label}
              </p>
              <div className="space-y-1">
                {reunions.map((reunion) => (
                  <Link
                    key={reunion.id}
                    href={`/reunions/${reunion.id}`}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors hover:bg-muted/50 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13.5px] font-medium text-foreground truncate">
                          {reunion.titre}
                        </span>
                        <StatusDot status={reunion.statutTraitement} />
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <span>{formatTime(reunion.dateDebut)}</span>
                        <span>·</span>
                        <span>{formatDuration(reunion.dureeSecondes)}</span>
                        {reunion.clientNom && (
                          <>
                            <span>·</span>
                            <span className="text-foreground/70">{reunion.clientNom}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1">
                        <Users size={12} className="text-muted-foreground" />
                        <span className="text-[12px] text-muted-foreground">
                          {reunion.nombreParticipants}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-[11px]">
                        {reunion.mode === "dictaphone" ? "Dictaphone" : "Visio"}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null,
        )}
      </div>
    </AppSidebar>
  );
}
