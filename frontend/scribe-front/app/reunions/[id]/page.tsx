"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Copy, Check, Loader2, AlertCircle, Pencil } from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { StatusDot, type BackendStatus } from "@/app/components/StatusDot";
import { TranscriptView, type Segment, type Locuteur } from "@/app/components/TranscriptView";
import { SummaryView, type CompteRendu, type PointCle, type Decision, type Action } from "@/app/components/SummaryView";
import { AudioRecorder } from "@/app/components/AudioRecorder";
import { AudioImport } from "@/app/components/AudioImport";
import { TabCaptureRecorder } from "@/app/components/TabCaptureRecorder";
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
  message_erreur: string | null;
  client_id: string | null;
}

interface Client {
  id: string;
  nom: string;
}

interface MeetingDetail {
  reunion: Reunion;
  jeton_consentement: string | null;
  consentements_signes: number;
  consentements_total: number;
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

  const [clients, setClients] = useState<Client[]>([]);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [audioSource, setAudioSource] = useState<"record" | "import">("record");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [copied, setCopied] = useState(false);
  const [consentNotif, setConsentNotif] = useState<"accepte" | "refuse" | "retractation" | null>(null);
  const [forceStop, setForceStop] = useState(false);
  const [activeTab, setActiveTab] = useState("transcription");
  const [highlightedSegmentId, setHighlightedSegmentId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/clients").then((r) => r.json()).then(setClients).catch(() => {});
  }, []);

  // Chargement initial
  useEffect(() => {
    async function fetchOnce() {
      const r = await apiFetch(`/meetings/${id}`);
      if (r.status === 404) { setNotFound(true); setLoading(false); return; }
      const data: MeetingDetail = await r.json();
      setDetail(data);
      setLoading(false);
    }
    fetchOnce();
  }, [id]);

  // WebSocket — reçoit les mises à jour de statut en temps réel
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const wsUrl = API_URL.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsUrl}/ws/meetings/${id}?token=${encodeURIComponent(token)}`);

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "consentement") {
        setDetail((prev) =>
          prev ? { ...prev, consentements_signes: msg.signes, consentements_total: msg.total } : prev
        );
        if (msg.retractation) {
          setForceStop(true);
          setConsentNotif("retractation");
        } else {
          setConsentNotif(msg.choix);
        }
        setTimeout(() => setConsentNotif(null), 5000);
        return;
      }
      if (msg.type === "reunion") {
        setDetail((prev) =>
          prev
            ? { ...prev, reunion: { ...prev.reunion, statut_traitement: msg.statut_traitement, message_erreur: msg.message_erreur } }
            : prev
        );
        if (TERMINAL_STATUSES.includes(msg.statut_traitement)) {
          ws.close();
          const r = await apiFetch(`/meetings/${id}`);
          if (r.ok) setDetail(await r.json());
        }
      }
    };

    return () => ws.close();
  }, [id]);

  async function handleUpload() {
    const audioFile =
      importedFile ??
      (recordedBlob ? new File([recordedBlob], `enregistrement.${recordedBlob.type.split("/")[1]?.split(";")[0] ?? "webm"}`, { type: recordedBlob.type.split(";")[0] }) : null);
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

  function startEditingTitle() {
    if (!detail) return;
    setTitleDraft(detail.reunion.titre);
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 0);
  }

  async function saveTitle() {
    if (!detail || !titleDraft.trim()) { setEditingTitle(false); return; }
    if (titleDraft.trim() === detail.reunion.titre) { setEditingTitle(false); return; }
    await apiFetch(`/meetings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ titre: titleDraft.trim() }),
    });
    setDetail((prev) => prev ? { ...prev, reunion: { ...prev.reunion, titre: titleDraft.trim() } } : prev);
    setEditingTitle(false);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveTitle();
    if (e.key === "Escape") setEditingTitle(false);
  }

  async function handleClientChange(clientId: string) {
    const newClientId = clientId === "__none__" ? null : clientId;
    await apiFetch(`/meetings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ client_id: newClientId }),
    });
    setDetail((prev) =>
      prev ? { ...prev, reunion: { ...prev.reunion, client_id: newClientId } } : prev
    );
  }

  function copyConsentLink() {
    if (!detail?.jeton_consentement) return;
    const url = `${window.location.origin}/consent/${detail.jeton_consentement}`;
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

  const { reunion, jeton_consentement, consentements_signes, consentements_total, segments, locuteurs, compte_rendu, points_cles, decisions, actions } = detail;
  const isEnAttente = reunion.statut_traitement === "en_attente";
  const isProcessing = reunion.statut_traitement === "transcription" || reunion.statut_traitement === "analyse";
  const audioReady = audioSource === "import" ? importedFile !== null : recordedBlob !== null;
  const consentBlocked = !!jeton_consentement && consentements_signes < consentements_total;

  return (
    <AppSidebar>
      {/* Header */}
      <div className="px-4 sm:px-8 pt-6 pb-4 shrink-0 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/"
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={handleTitleKeyDown}
                className="text-xl font-medium text-foreground bg-transparent border-b border-primary outline-none"
              />
            ) : (
              <h1 className="text-xl font-medium text-foreground">{reunion.titre}</h1>
            )}
            <StatusDot status={reunion.statut_traitement} />
            {!editingTitle && (
              <button
                onClick={startEditingTitle}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Pencil size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 ml-10">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} strokeWidth={2} className="text-muted-foreground" />
            <span className="text-[12.5px] text-muted-foreground">
              {formatTime(reunion.date_debut)}
              {reunion.duree_secondes && ` · ${formatDuration(reunion.duree_secondes)}`}
            </span>
          </div>
          {clients.length > 0 && (
            <select
              value={reunion.client_id ?? "__none__"}
              onChange={(e) => handleClientChange(e.target.value)}
              className="text-[12.5px] text-muted-foreground bg-transparent border-none outline-none cursor-pointer hover:text-foreground transition-colors"
            >
              <option value="__none__">Aucun client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-[680px] mx-auto px-4 sm:px-8 py-8 space-y-8">

          {/* Consent link + audio upload — visible only when en_attente */}
          {isEnAttente && (
            <div className="space-y-6">
              {/* Consent notification */}
              {consentNotif && (
                <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                  consentNotif === "accepte"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}>
                  {consentNotif === "accepte" ? <Check size={14} /> : <AlertCircle size={14} />}
                  {consentNotif === "retractation"
                    ? "Un participant a rétracté son consentement. L'enregistrement a été arrêté."
                    : consentNotif === "accepte"
                    ? `Un participant a accepté (${consentements_signes}/${consentements_total}).`
                    : "Un participant a refusé l'enregistrement."}
                </div>
              )}

              {/* Consent link */}
              {jeton_consentement && (
                <div className="rounded-xl border border-border p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground mb-1">
                        Lien de consentement
                      </p>
                      <p className="text-[13px] text-muted-foreground">
                        Partagez ce lien aux participants <strong>avant</strong> de démarrer l&apos;enregistrement.
                      </p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      consentements_signes >= consentements_total
                        ? "bg-green-100 text-green-700"
                        : consentements_signes > 0
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {consentements_signes}/{consentements_total} signé{consentements_total > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[12px] bg-muted px-3 py-2 rounded-lg truncate text-foreground">
                      {typeof window !== "undefined"
                        ? `${window.location.origin}/consent/${jeton_consentement}`
                        : `/consent/${jeton_consentement}`}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyConsentLink}>
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

                {reunion.mode === "visio" ? (
                  <TabCaptureRecorder onBlobReady={setRecordedBlob} forceStop={forceStop} />
                ) : (
                  <>
                    {/* Source toggle — dictaphone only */}
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
                      <AudioRecorder onBlobReady={setRecordedBlob} forceStop={forceStop} />
                    ) : (
                      <AudioImport onFileChange={setImportedFile} />
                    )}
                  </>
                )}

                {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

                {consentBlocked && (
                  <p className="text-[12.5px] text-yellow-600">
                    En attente de la signature du participant avant de lancer la transcription.
                  </p>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={!audioReady || uploading || consentBlocked}
                  className="w-full"
                >
                  {uploading ? "Envoi en cours…" : "Lancer la transcription"}
                </Button>
              </div>
            </div>
          )}

          {/* Error message */}
          {reunion.statut_traitement === "erreur" && reunion.message_erreur && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive mb-1">Erreur de traitement</p>
                <p className="text-[12.5px] text-muted-foreground font-mono break-all">{reunion.message_erreur}</p>
              </div>
            </div>
          )}

          {/* Transcription + compte rendu tabs */}
          {!isEnAttente && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
              <TabsList className="mb-6">
                <TabsTrigger value="transcription">Transcription</TabsTrigger>
                <TabsTrigger value="compte-rendu">Compte rendu</TabsTrigger>
              </TabsList>

              <TabsContent value="transcription">
                {segments.length > 0 ? (
                  <TranscriptView
                    meetingId={id}
                    segments={segments}
                    locuteurs={locuteurs}
                    highlightedSegmentId={highlightedSegmentId}
                    onSegmentHighlighted={() => setHighlightedSegmentId(null)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 py-12">
                    {isProcessing ? (
                      <>
                        <Loader2 size={22} className="animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">La transcription est en cours…</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucune transcription disponible.</p>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="compte-rendu">
                {compte_rendu ? (
                  <SummaryView
                    compteRendu={compte_rendu}
                    pointsCles={points_cles}
                    decisions={decisions}
                    actions={actions}
                    onGoToSegment={(segmentId) => {
                      setHighlightedSegmentId(segmentId);
                      setActiveTab("transcription");
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 py-12">
                    {isProcessing ? (
                      <>
                        <Loader2 size={22} className="animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Le compte rendu sera généré après la transcription.</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun compte rendu disponible.</p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </AppSidebar>
  );
}
