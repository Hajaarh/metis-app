"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { StatusDot } from "@/app/components/StatusDot";
import { MeetingAvatar } from "@/app/components/MeetingAvatar";
import { TranscriptView } from "@/app/components/TranscriptView";
import { SummaryView } from "@/app/components/SummaryView";
import { MeetingMetadata } from "@/app/components/MeetingMetadata";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import {
  MOCK_REUNIONS,
  MOCK_LOCUTEURS,
  MOCK_SEGMENTS,
  MOCK_COMPTES_RENDUS,
  MOCK_REUNION_THEMES,
  MOCK_ATTESTATIONS,
  MOCK_CONSENTEMENTS,
  formatDuration,
  formatTime,
  formatDate,
} from "@/app/lib/mock-data";

export default function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const reunion = MOCK_REUNIONS.find((r) => r.id === id) ?? MOCK_REUNIONS[0];
  const locuteurs = MOCK_LOCUTEURS.filter((l) => l.reunionId === reunion.id);
  const segments = MOCK_SEGMENTS.filter((s) => s.reunionId === reunion.id);
  const compteRendu = MOCK_COMPTES_RENDUS.find((cr) => cr.reunionId === reunion.id);
  const themes = MOCK_REUNION_THEMES[reunion.id] || [];
  const attestation = MOCK_ATTESTATIONS[reunion.id];
  const consentements = MOCK_CONSENTEMENTS[reunion.id];

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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium text-foreground">{reunion.titre}</h1>
              <StatusDot status={reunion.statutTraitement} />
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 ml-10">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} strokeWidth={2} className="text-muted-foreground" />
            <span className="text-[12.5px] text-muted-foreground">
              {formatTime(reunion.dateDebut)} · {formatDuration(reunion.dureeSecondes)}
            </span>
          </div>
          <span className="text-border">·</span>
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-muted-foreground" />
            <span className="text-[12.5px] text-muted-foreground">
              {reunion.nombreParticipants} participant{reunion.nombreParticipants > 1 ? "s" : ""}
            </span>
          </div>
          {reunion.clientNom && (
            <>
              <span className="text-border">·</span>
              <Badge variant="secondary" className="text-[11px]">{reunion.clientNom}</Badge>
            </>
          )}
          <Badge variant="outline" className="text-[11px]">
            {reunion.mode === "dictaphone" ? "Dictaphone" : "Visio"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="transcription" className="flex-1 flex flex-col">
          <div className="px-8 pt-4">
            <TabsList>
              <TabsTrigger value="transcription">Transcription</TabsTrigger>
              <TabsTrigger value="compte-rendu">Compte rendu</TabsTrigger>
              <TabsTrigger value="informations">Informations</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="max-w-[680px] mx-auto px-8 py-8">
              <TabsContent value="transcription">
                {segments.length > 0 ? (
                  <TranscriptView segments={segments} locuteurs={locuteurs} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">
                      Aucune transcription disponible pour cette réunion.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="compte-rendu">
                {compteRendu ? (
                  <SummaryView compteRendu={compteRendu} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">
                      Le compte rendu n&apos;a pas encore été généré.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="informations">
                <MeetingMetadata
                  reunion={reunion}
                  themes={themes}
                  attestation={attestation}
                  consentements={consentements}
                  modeleUtilise={compteRendu?.modeleUtilise}
                />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </AppSidebar>
  );
}
