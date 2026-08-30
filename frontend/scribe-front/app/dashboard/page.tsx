"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ListTodo, Video, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie,
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

type DatePreset = "30j" | "3m" | "6m" | "12m" | "all" | "custom";
type DashView = "activite" | "repartition";

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "30j", label: "30 j" },
  { key: "3m", label: "3 mois" },
  { key: "6m", label: "6 mois" },
  { key: "12m", label: "12 mois" },
  { key: "all", label: "Tout" },
  { key: "custom", label: "Personnalisé" },
];

const VIEWS: { key: DashView; label: string }[] = [
  { key: "activite", label: "Activité" },
  { key: "repartition", label: "Répartition" },
];

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

function getDateRange(preset: Exclude<DatePreset, "custom">): { debut: string | null; fin: string | null } {
  if (preset === "all") return { debut: null, fin: null };
  const fin = new Date();
  const debut = new Date();
  const days: Record<Exclude<DatePreset, "all" | "custom">, number> = { "30j": 30, "3m": 90, "6m": 180, "12m": 365 };
  debut.setDate(debut.getDate() - days[preset]);
  return {
    debut: debut.toISOString().slice(0, 10),
    fin: fin.toISOString().slice(0, 10),
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

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

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border px-4 py-3 flex items-center gap-3">
      <div className="p-1.5 rounded-lg bg-muted text-muted-foreground shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-semibold text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4 flex flex-col min-h-0">
      <p className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground mb-3 shrink-0">
        {title}
      </p>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

function ListCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 min-h-0 rounded-xl border border-border p-4 flex flex-col overflow-hidden">
      <p className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground mb-3 shrink-0">
        {title}
      </p>
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2">{children}</div>
    </div>
  );
}

function SegmentRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-foreground capitalize truncate mr-4">{label.replace(/_/g, " ")}</span>
      <span className="text-muted-foreground font-medium shrink-0">{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<DatePreset>("3m");
  const [customDebut, setCustomDebut] = useState<string>("");
  const [customFin, setCustomFin] = useState<string>(todayISO());
  const [view, setView] = useState<DashView>("activite");

  useEffect(() => {
    let debut: string | null = null;
    let fin: string | null = null;

    if (preset === "custom") {
      if (!customDebut || !customFin) return;
      debut = customDebut;
      fin = customFin;
    } else {
      ({ debut, fin } = getDateRange(preset));
    }

    setLoading(true);
    setMetrics(null);
    const params = new URLSearchParams();
    if (debut) params.set("date_debut", debut);
    if (fin) params.set("date_fin", fin);
    const qs = params.toString() ? `?${params}` : "";
    apiFetch(`/dashboard/metrics${qs}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setMetrics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [preset, customDebut, customFin]);

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

  const isEmpty = !loading && (!metrics || metrics.nombre_reunions === 0);

  return (
    <AppSidebar>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 pt-5 pb-3 shrink-0 border-b border-border gap-3">
        <h1 className="text-lg font-medium text-foreground">Tableau de bord</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date presets */}
          <div className="flex items-center rounded-[10px] p-[3px] gap-0.5 bg-muted">
            {DATE_PRESETS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key)}
                className={`px-2.5 py-1 rounded-[7px] text-[11.5px] font-medium transition-all ${
                  preset === key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          {preset === "custom" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customDebut}
                max={customFin || todayISO()}
                onChange={(e) => setCustomDebut(e.target.value)}
                className="h-7 rounded-lg border border-border bg-card px-2 text-[11.5px] text-foreground outline-none focus:ring-1 focus:ring-primary/40"
              />
              <span className="text-[11px] text-muted-foreground">→</span>
              <input
                type="date"
                value={customFin}
                min={customDebut}
                max={todayISO()}
                onChange={(e) => setCustomFin(e.target.value)}
                className="h-7 rounded-lg border border-border bg-card px-2 text-[11.5px] text-foreground outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          )}
          {/* View tabs */}
          <div className="flex items-center rounded-[10px] p-[3px] gap-0.5 bg-muted">
            {VIEWS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`px-3 py-1 rounded-[8px] text-[12px] font-medium transition-all ${
                  view === key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body — no scroll on desktop */}
      <div className="flex-1 min-h-0 p-4 sm:p-5">
        {loading && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </div>
        )}

        {isEmpty && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-foreground">Aucune réunion sur cette période</p>
            <p className="text-[12.5px] text-muted-foreground">
              Élargissez la période ou créez votre première réunion.
            </p>
          </div>
        )}

        {!loading && metrics && metrics.nombre_reunions > 0 && (
          <div className="h-full flex flex-col gap-4">
            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <StatCard label="Réunions" value={metrics.nombre_reunions} icon={<Video size={14} />} />
              <StatCard label="Terminées" value={metrics.nombre_reunions_terminees} icon={<CheckCircle2 size={14} />} />
              <StatCard label="Actions extraites" value={metrics.nombre_actions} icon={<ListTodo size={14} />} />
              <StatCard
                label="Durée totale"
                value={metrics.duree_totale_secondes > 0 ? formatDuration(metrics.duree_totale_secondes) : "—"}
                icon={<Clock size={14} />}
              />
            </div>

            {/* Vue Activité */}
            {view === "activite" && (
              <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ChartCard title="Fréquence des réunions">
                  {parMoisData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={parMoisData} barSize={18}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v as number, "réunions"]} />
                        <Bar dataKey="nombre" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-[12px] text-muted-foreground">Aucune donnée</p>
                    </div>
                  )}
                </ChartCard>

                <ChartCard title="Évolution de la charge (heures)">
                  {parMoisData.length > 0 ? (
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
                        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v as number}h`, "durée"]} />
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
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-[12px] text-muted-foreground">Aucune donnée</p>
                    </div>
                  )}
                </ChartCard>
              </div>
            )}

            {/* Vue Répartition */}
            {view === "repartition" && (
              <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ChartCard title="Temps par type de réunion (heures)">
                  {dureParTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dureParTypeData} layout="vertical" barSize={14}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} unit="h" />
                        <YAxis
                          type="category"
                          dataKey="type"
                          tick={AXIS_TICK}
                          axisLine={false}
                          tickLine={false}
                          width={90}
                        />
                        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v as number}h`, "durée"]} />
                        <Bar dataKey="heures" radius={[0, 4, 4, 0]}>
                          {dureParTypeData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-[12px] text-muted-foreground">Aucune donnée</p>
                    </div>
                  )}
                </ChartCard>

                <div className="flex flex-col gap-4 min-h-0">
                  <ChartCard title="Réunions par type">
                    {Object.keys(metrics.repartition_par_type).length > 0 ? (() => {
                      const pieData = Object.entries(metrics.repartition_par_type)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => ({ name: type.replace(/_/g, " "), value: count }));
                      const total = pieData.reduce((acc, d) => acc + d.value, 0);
                      return (
                        <div className="h-full flex items-center gap-4">
                          <div className="shrink-0" style={{ width: 140, height: 140 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={38}
                                  outerRadius={64}
                                  strokeWidth={2}
                                  stroke="hsl(var(--card))"
                                >
                                  {pieData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  {...TOOLTIP_STYLE}
                                  formatter={(v) => [v as number, "réunions"]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex flex-col gap-1.5 flex-1 min-w-0 overflow-y-auto scrollbar-hide">
                            {pieData.map((d, i) => (
                              <div key={d.name} className="flex items-center gap-2 text-[12px]">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: COLORS[i % COLORS.length] }}
                                />
                                <span className="text-foreground truncate flex-1 capitalize">{d.name}</span>
                                <span className="text-muted-foreground shrink-0">
                                  {d.value} · {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-[12px] text-muted-foreground">Aucune donnée</p>
                      </div>
                    )}
                  </ChartCard>

                  <ListCard title="Par thème">
                    {Object.keys(metrics.repartition_par_theme).length > 0 ? (
                      Object.entries(metrics.repartition_par_theme)
                        .sort((a, b) => b[1] - a[1])
                        .map(([theme, count]) => (
                          <SegmentRow key={theme} label={theme} value={count} />
                        ))
                    ) : (
                      <p className="text-[12px] text-muted-foreground">Aucune donnée</p>
                    )}
                  </ListCard>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppSidebar>
  );
}
