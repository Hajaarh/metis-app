"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { StatusDot, type BackendStatus } from "@/app/components/StatusDot";
import { TranscriptView, type Segment, type Locuteur } from "@/app/components/TranscriptView";
import { SummaryView, type CompteRendu, type PointCle, type Decision, type Action } from "@/app/components/SummaryView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { apiFetch } from "@/app/lib/api";

interface Reunion {
  id: string;
  titre: string;
  statut_traitement: BackendStatus;
  date_debut: string;
  duree_secondes: number | null;
  mode: string;
}

interface MeetingDetail {
  reunion: Reunion;
  segments: Segment[];
  locuteurs: Locuteur[];
  compte_rendu: CompteRendu | null;
  points_cles: PointCle[];
  decisions: Decision[];
  actions: Action[];
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m.toString().padStart(2, "0")}`;
  return `${m} min`;
}

export default function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiFetch(`/meetings/${id}`)
      .then(async (r) => {
        if (r.status === 404) { setNotFound(true); return; }
        setDetail(await r.json());
      })
      .finally(() => setLoading(false));
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

  if (notFound || !detail) {
    return (
      <AppSidebar>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Réunion introuvable.</p>
        </div>
      </AppSidebar>
    );
  }

  const { reunion, segments, locuteurs, compte_rendu, points_cles, decisions, actions } = detail;

  return (
    <AppSidebar>
      {/* Header */}
      <div className="px-8 pt-6 pb-4 shrink-0 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/"
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">{reunion.titre}</h1>
            <StatusDot status={reunion.statut_traitement} />
          </div>
        </div>

        <div className="flex items-center gap-3 ml-10">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} strokeWidth={2} className="text-muted-foreground" />
            <span className="text-[12.5px] text-muted-foreground">
              {formatTime(reunion.date_debut)}
              {reunion.duree_secondes && ` · ${formatDuration(reunion.duree_secondes)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="transcription" className="flex-1 flex flex-col">
          <div className="px-8 pt-4">
            <TabsList>
              <TabsTrigger value="transcription">Transcription</TabsTrigger>
              <TabsTrigger value="compte-rendu">Compte rendu</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="max-w-[680px] mx-auto px-8 py-8">
              <TabsContent value="transcription">
                {segments.length > 0 ? (
                  <TranscriptView
                    meetingId={id}
                    segments={segments}
                    locuteurs={locuteurs}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    {reunion.statut_traitement === "termine"
                      ? "Aucune transcription disponible."
                      : "La transcription est en cours…"}
                  </p>
                )}
              </TabsContent>

              <TabsContent value="compte-rendu">
                {compte_rendu ? (
                  <SummaryView
                    compteRendu={compte_rendu}
                    pointsCles={points_cles}
                    decisions={decisions}
                    actions={actions}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    {reunion.statut_traitement === "termine"
                      ? "Aucun compte rendu disponible."
                      : "Le compte rendu sera généré après la transcription."}
                  </p>
                )}
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </AppSidebar>
  );
}
