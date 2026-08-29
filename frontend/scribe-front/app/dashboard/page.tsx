"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ListTodo, Video, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import { AppSidebar } from "@/app/components/AppSidebar";
import { apiFetch } from "@/app/lib/api";

interface ParMois {
  periode: string;
  nombre: number;
  duree_secondes: number;
}

interface Metrics {
  nombre_reunions: number;
  nombre_reunions_terminees: number;
  nombre_actions: number;
  duree_totale_secondes: number;
  repartition_par_type: Record<string, number>;
  repartition_par_theme: Record<string, number>;
  duree_par_type: Record<string, number>;
  par_mois: ParMois[];
}

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

const AXIS_TICK = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
}

function formatPeriode(periode: string): string {
  const [year, month] = periode.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("fr-FR", {
    month: "short",
    year: "2-digit",
  });
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border p-5 flex items-start gap-4">
      <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground mb-3">
      {children}
    </p>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/dashboard/metrics")
      .then((r) => r.ok ? r.json() : null)
      .then(setMetrics)
      .finally(() => setLoading(false));
  }, []);

  const parMoisData = (metrics?.par_mois ?? []).map((m) => ({
    ...m,
    label: formatPeriode(m.periode),
    duree_heures: Math.round(m.duree_secondes / 360) / 10,
  }));

  const dureParTypeData = Object.entries(metrics?.duree_par_type ?? {})
    .map(([type, seconds]) => ({
      type: type.replace(/_/g, " "),
      heures: Math.round(seconds / 360) / 10,
    }))
    .sort((a, b) => b.heures - a.heures);

  return (
    <AppSidebar>
      {/* Header */}
      <div className="flex items-center px-4 sm:px-8 pt-6 pb-4 shrink-0 border-b border-border">
        <h1 className="text-xl font-medium text-foreground">Tableau de bord</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-8 space-y-10">

          {loading && (
            <p className="text-sm text-muted-foreground text-center py-12">Chargement…</p>
          )}

          {!loading && metrics?.nombre_reunions === 0 && (
            <div className="text-center py-16 space-y-2">
              <p className="text-sm font-medium text-foreground">Aucune réunion pour l&apos;instant</p>
              <p className="text-[12.5px] text-muted-foreground">Les métriques apparaîtront dès votre première réunion.</p>
            </div>
          )}

          {!loading && metrics && metrics.nombre_reunions > 0 && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard label="Réunions au total" value={metrics.nombre_reunions} icon={<Video size={16} />} />
                <StatCard label="Réunions terminées" value={metrics.nombre_reunions_terminees} icon={<CheckCircle2 size={16} />} />
                <StatCard label="Actions extraites" value={metrics.nombre_actions} icon={<ListTodo size={16} />} />
                <StatCard
                  label="Durée totale enregistrée"
                  value={metrics.duree_totale_secondes > 0 ? formatDuration(metrics.duree_totale_secondes) : "—"}
                  icon={<Clock size={16} />}
                />
              </div>

              {/* Fréquence des réunions */}
              {parMoisData.length > 0 && (
                <div>
                  <SectionLabel>Fréquence des réunions</SectionLabel>
                  <div className="rounded-xl border border-border p-4" style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={parMoisData} barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          {...TOOLTIP_STYLE}
                          formatter={(v) => [v as number, "réunions"]}
                        />
                        <Bar dataKey="nombre" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Évolution de la charge */}
              {parMoisData.length > 0 && (
                <div>
                  <SectionLabel>Évolution de la charge (heures)</SectionLabel>
                  <div className="rounded-xl border border-border p-4" style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={parMoisData}>
                        <defs>
                          <linearGradient id="chargeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <Tooltip
                          {...TOOLTIP_STYLE}
                          formatter={(v) => [`${v as number}h`, "durée"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="duree_heures"
                          stroke={COLORS[1]}
                          strokeWidth={2}
                          fill="url(#chargeGrad)"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Temps par type */}
              {dureParTypeData.length > 0 && (
                <div>
                  <SectionLabel>Temps passé par type de réunion</SectionLabel>
                  <div className="rounded-xl border border-border p-4" style={{ height: Math.max(160, dureParTypeData.length * 44) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dureParTypeData} layout="vertical" barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} unit="h" />
                        <YAxis type="category" dataKey="type" tick={AXIS_TICK} axisLine={false} tickLine={false} width={100} />
                        <Tooltip
                          {...TOOLTIP_STYLE}
                          formatter={(v) => [`${v as number}h`, "durée"]}
                        />
                        <Bar dataKey="heures" radius={[0, 4, 4, 0]}>
                          {dureParTypeData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Répartition par type (count) */}
              {Object.keys(metrics.repartition_par_type).length > 0 && (
                <div className="space-y-2">
                  <SectionLabel>Nombre de réunions par type</SectionLabel>
                  {Object.entries(metrics.repartition_par_type)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-[13px]">
                        <span className="text-foreground capitalize">{type.replace(/_/g, " ")}</span>
                        <span className="text-muted-foreground font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              )}

              {/* Répartition par thème */}
              {Object.keys(metrics.repartition_par_theme).length > 0 && (
                <div className="space-y-2">
                  <SectionLabel>Par thème</SectionLabel>
                  {Object.entries(metrics.repartition_par_theme)
                    .sort((a, b) => b[1] - a[1])
                    .map(([theme, count]) => (
                      <div key={theme} className="flex items-center justify-between text-[13px]">
                        <span className="text-foreground capitalize">{theme}</span>
                        <span className="text-muted-foreground font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppSidebar>
  );
}
