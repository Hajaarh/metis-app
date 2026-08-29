"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { AppSidebar } from "@/app/components/AppSidebar";
import { StatusDot, type BackendStatus } from "@/app/components/StatusDot";
import { MeetingAvatar } from "@/app/components/MeetingAvatar";
import { apiFetch } from "@/app/lib/api";

interface Client {
  id: string;
  nom: string;
  date_creation: string;
}

interface Reunion {
  id: string;
  titre: string;
  statut_traitement: BackendStatus;
  date_debut: string;
}

interface Action {
  id: string;
  intitule: string;
  responsable: string | null;
  echeance: string | null;
  reunion_id: string;
  reunion_titre: string;
}

type Tab = "reunions" | "actions" | "temps_parole";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#f97316"];

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "10px",
    fontSize: "12px",
    color: "hsl(var(--foreground))",
  },
  cursor: { fill: "rgba(128,128,128,0.08)" },
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
}

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [tempsParole, setTempsParole] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<Tab>("reunions");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch(`/clients/${id}`),
      apiFetch(`/meetings?client_id=${id}`),
      apiFetch(`/clients/${id}/actions`),
      apiFetch(`/clients/${id}/stats`),
    ]).then(async ([clientRes, meetingsRes, actionsRes, statsRes]) => {
      if (clientRes.status === 404) { setNotFound(true); return; }
      const [clientData, meetingsData, actionsData, statsData] = await Promise.all([
        clientRes.json(),
        meetingsRes.json(),
        actionsRes.ok ? actionsRes.json() : Promise.resolve([]),
        statsRes.ok ? statsRes.json() : Promise.resolve({ temps_parole: {} }),
      ]);
      setClient(clientData);
      setReunions(meetingsData);
      setActions(actionsData);
      setTempsParole(statsData.temps_parole ?? {});
    }).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppSidebar>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </AppSidebar>
    );
  }

  if (notFound || !client) {
    return (
      <AppSidebar>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Client introuvable.</p>
        </div>
      </AppSidebar>
    );
  }

  const tempsParoleData = Object.entries(tempsParole).map(([name, seconds]) => ({ name, seconds }));
  const totalParole = tempsParoleData.reduce((acc, d) => acc + d.seconds, 0);

  const TABS: { key: Tab; label: string }[] = [
    { key: "reunions", label: "Réunions" },
    { key: "actions", label: "Actions" },
    { key: "temps_parole", label: "Temps de parole" },
  ];

  return (
    <AppSidebar>
      {/* Header */}
      <div className="px-4 sm:px-8 pt-6 pb-4 shrink-0 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/clients"
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft size={16} />
          </Link>
          <MeetingAvatar name={client.nom} size={32} />
          <div>
            <h1 className="text-xl font-medium text-foreground">{client.nom}</h1>
            <span className="text-[12px] text-muted-foreground">
              Créé le{" "}
              {new Date(client.date_creation).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-[52px] mb-4">
          <Calendar size={12} className="text-muted-foreground" />
          <span className="text-[12.5px] text-foreground font-medium">{reunions.length}</span>
          <span className="text-[12.5px] text-muted-foreground">
            réunion{reunions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center rounded-[10px] p-[3px] gap-0.5 bg-muted w-fit">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-medium transition-all ${
                tab === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 scrollbar-hide">

        {/* Tab: Réunions */}
        {tab === "reunions" && (
          reunions.length > 0 ? (
            <div className="space-y-1">
              {reunions.map((reunion) => (
                <Link
                  key={reunion.id}
                  href={`/reunions/${reunion.id}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13.5px] font-medium text-foreground truncate">
                        {reunion.titre}
                      </span>
                      <StatusDot status={reunion.statut_traitement} />
                    </div>
                    <span className="text-[12px] text-muted-foreground">
                      {new Date(reunion.date_debut).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              Aucune réunion avec ce client pour le moment.
            </p>
          )
        )}

        {/* Tab: Actions */}
        {tab === "actions" && (
          actions.length > 0 ? (
            <div className="space-y-2">
              {actions.map((action) => (
                <Link
                  key={action.id}
                  href={`/reunions/${action.reunion_id}`}
                  className="flex flex-col gap-1 px-4 py-3 rounded-xl transition-colors hover:bg-muted/50"
                >
                  <span className="text-[13.5px] font-medium text-foreground">{action.intitule}</span>
                  <div className="flex items-center gap-3 flex-wrap">
                    {action.responsable && (
                      <span className="text-[12px] text-muted-foreground">{action.responsable}</span>
                    )}
                    {action.echeance && (
                      <span className="text-[12px] text-muted-foreground">
                        {new Date(action.echeance).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground/60 truncate">{action.reunion_titre}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              Aucune action extraite pour ce client.
            </p>
          )
        )}

        {/* Tab: Temps de parole */}
        {tab === "temps_parole" && (
          tempsParoleData.length > 0 ? (
            <div className="flex flex-col items-center gap-6 pt-4">
              <div style={{ height: 240, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tempsParoleData}
                      dataKey="seconds"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {tempsParoleData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(v) => [formatDuration(v as number), "temps de parole"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                {tempsParoleData
                  .sort((a, b) => b.seconds - a.seconds)
                  .map((d, i) => {
                    const pct = totalParole > 0 ? Math.round((d.seconds / totalParole) * 100) : 0;
                    return (
                      <div key={d.name} className="flex items-center justify-between text-[13px]">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-foreground">{d.name}</span>
                        </div>
                        <span className="text-muted-foreground">{formatDuration(d.seconds)} · {pct}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              Aucune donnée de temps de parole disponible.
            </p>
          )
        )}
      </div>
    </AppSidebar>
  );
}
