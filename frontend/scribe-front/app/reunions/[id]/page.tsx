"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Copy, Check } from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { StatusDot, type BackendStatus } from "@/app/components/StatusDot";
import { TranscriptView, type Segment, type Locuteur } from "@/app/components/TranscriptView";
import { SummaryView, type CompteRendu, type PointCle, type Decision, type Action } from "@/app/components/SummaryView";
import { AudioRecorder } from "@/app/components/AudioRecorder";
import { AudioImport } from "@/app/components/AudioImport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { apiFetch, API_URL } from "@/app/lib/api";
import { getToken } from "@/app/lib/auth";

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
  jeton_consentement: string | null;
  segments: Segment[];
  locuteurs: Locuteur[];
  compte_rendu: CompteRendu | null;
  points_cles: PointCle[];
  decisions: Decision[];
  actions: Action[];
}

const TERMINAL_STATUSES: BackendStatus[] = ["termine", "erreur", "attestation_manquante", "consentement_refuse"];

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

  const [audioSource, setAudioSource] = useState<"record" | "import">("record");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function fetchDetail() {
      const r = await apiFetch(`/meetings/${id}`);
      if (r.status === 404) { setNotFound(true); return; }
      const data: MeetingDetail = await r.json();
      setDetail(data);
      if (TERMINAL_STATUSES.includes(data.reunion.statut_traitement) && intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    fetchDetail().finally(() => setLoading(false));
    intervalId = setInterval(fetchDetail, 5000);

    return () => { if (intervalId) clearInterval(intervalId); };
  }, [id]);

  async function handleUpload() {
    const audioFile =
      importedFile ??
      (recordedBlob ? new File([recordedBlob], "enregistrement.webm", { type: recordedBlob.type }) : null);
    if (!audioFile) return;

    setUploadError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", audioFile);
    formData.append("consentement_organisateur", "true");

    const token = getToken();
    const r = await fetch(`${API_URL}/meetings/${id}/audio`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!r.ok) {
      setUploadError("L'upload a échoué. Réessayez.");
    }
    setUploading(false);
  }

  function copyConsentLink(jeton: string) {
    const url = `${window.location.origin}/consent/${jeton}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

  const { reunion, jeton_consentement, segments, locuteurs, compte_rendu, points_cles, decisions, actions } = detail;
  const isEnAttente = reunion.statut_traitement === "en_attente";
  const audioReady = audioSource === "import" ? importedFile !== null : recordedBlob !== null;

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

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-[680px] mx-auto px-8 py-8 space-y-8">

          {/* Consent link + audio upload — visible only when en_attente */}
          {isEnAttente && (
            <div className="space-y-6">
              {/* Consent link */}
              {jeton_consentement && (
                <div className="rounded-xl border border-border p-5 space-y-3">
                  <div>
                    <p className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground mb-1">
                      Lien de consentement
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      Partagez ce lien aux participants <strong>avant</strong> de démarrer l&apos;enregistrement.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[12px] bg-muted px-3 py-2 rounded-lg truncate text-foreground">
                      {typeof window !== "undefined"
                        ? `${window.location.origin}/consent/${jeton_consentement}`
                        : `/consent/${jeton_consentement}`}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyConsentLink(jeton_consentement)}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copié" : "Copier"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Audio upload */}
              <div className="rounded-xl border border-border p-5 space-y-4">
                <div>
                  <p className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground mb-1">
                    Audio
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    Enregistrez ou importez l&apos;audio de la réunion une fois le consentement obtenu.
                  </p>
                </div>

                {/* Source toggle */}
                <div className="flex items-center rounded-[10px] p-[3px] gap-0.5 bg-muted w-fit">
                  {(["record", "import"] as const).map((value) => {
                    const active = audioSource === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAudioSource(value)}
                        className={`px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-medium transition-all ${
                          active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                        }`}
                      >
                        {value === "record" ? "Enregistrer" : "Importer"}
                      </button>
                    );
                  })}
                </div>

                {audioSource === "record" ? (
                  <AudioRecorder onBlobReady={setRecordedBlob} />
                ) : (
                  <AudioImport onFileChange={setImportedFile} />
                )}

                {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

                <Button
                  onClick={handleUpload}
                  disabled={!audioReady || uploading}
                  className="w-full"
                >
                  {uploading ? "Envoi en cours…" : "Lancer la transcription"}
                </Button>
              </div>
            </div>
          )}

          {/* Transcription + compte rendu tabs */}
          {!isEnAttente && (
            <Tabs defaultValue="transcription" className="flex flex-col">
              <TabsList className="mb-6">
                <TabsTrigger value="transcription">Transcription</TabsTrigger>
                <TabsTrigger value="compte-rendu">Compte rendu</TabsTrigger>
              </TabsList>

              <TabsContent value="transcription">
                {segments.length > 0 ? (
                  <TranscriptView meetingId={id} segments={segments} locuteurs={locuteurs} />
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
            </Tabs>
          )}
        </div>
      </div>
    </AppSidebar>
  );
}
