"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
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

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch(`/clients/${id}`),
      apiFetch(`/meetings?client_id=${id}`),
    ]).then(async ([clientRes, meetingsRes]) => {
      if (clientRes.status === 404) { setNotFound(true); return; }
      const [clientData, meetingsData] = await Promise.all([clientRes.json(), meetingsRes.json()]);
      setClient(clientData);
      setReunions(meetingsData);
    }).finally(() => setLoading(false));
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

  return (
    <AppSidebar>
      {/* Header */}
      <div className="px-8 pt-6 pb-4 shrink-0 border-b border-border">
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

        <div className="flex items-center gap-1.5 ml-[52px]">
          <Calendar size={12} className="text-muted-foreground" />
          <span className="text-[12.5px] text-foreground font-medium">{reunions.length}</span>
          <span className="text-[12.5px] text-muted-foreground">
            réunion{reunions.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Meetings */}
      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-hide">
        <p className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground mb-3 px-1">
          Historique des réunions
        </p>

        {reunions.length > 0 ? (
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
        )}
      </div>
    </AppSidebar>
  );
}
