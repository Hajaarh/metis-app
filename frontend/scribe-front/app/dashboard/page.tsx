"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ListTodo, Video, Clock } from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { apiFetch } from "@/app/lib/api";

interface Metrics {
  nombre_reunions: number;
  nombre_reunions_terminees: number;
  nombre_actions: number;
  duree_totale_secondes: number;
  repartition_par_type: Record<string, number>;
  repartition_par_theme: Record<string, number>;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
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

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/dashboard/metrics")
      .then((r) => r.ok ? r.json() : null)
      .then(setMetrics)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppSidebar>
      {/* Header */}
      <div className="flex items-center px-4 sm:px-8 pt-6 pb-4 shrink-0 border-b border-border">
        <h1 className="text-xl font-medium text-foreground">Tableau de bord</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-8 space-y-8">

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
                <StatCard
                  label="Réunions au total"
                  value={metrics.nombre_reunions}
                  icon={<Video size={16} />}
                />
                <StatCard
                  label="Réunions terminées"
                  value={metrics.nombre_reunions_terminees}
                  icon={<CheckCircle2 size={16} />}
                />
                <StatCard
                  label="Actions extraites"
                  value={metrics.nombre_actions}
                  icon={<ListTodo size={16} />}
                />
                <StatCard
                  label="Durée totale enregistrée"
                  value={metrics.duree_totale_secondes > 0 ? formatDuration(metrics.duree_totale_secondes) : "—"}
                  icon={<Clock size={16} />}
                />
              </div>

              {/* Répartition par type */}
              {Object.keys(metrics.repartition_par_type).length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground">
                    Par type
                  </p>
                  <div className="space-y-2">
                    {Object.entries(metrics.repartition_par_type)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between text-[13px]">
                          <span className="text-foreground capitalize">{type.replace(/_/g, " ")}</span>
                          <span className="text-muted-foreground font-medium">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Répartition par thème */}
              {Object.keys(metrics.repartition_par_theme).length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground">
                    Par thème
                  </p>
                  <div className="space-y-2">
                    {Object.entries(metrics.repartition_par_theme)
                      .sort((a, b) => b[1] - a[1])
                      .map(([theme, count]) => (
                        <div key={theme} className="flex items-center justify-between text-[13px]">
                          <span className="text-foreground capitalize">{theme}</span>
                          <span className="text-muted-foreground font-medium">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppSidebar>
  );
}
