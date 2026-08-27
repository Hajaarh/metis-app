"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic, Video } from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { AudioRecorder } from "@/app/components/AudioRecorder";
import { AudioImport } from "@/app/components/AudioImport";
import { ConsentBanner } from "@/app/components/ConsentBanner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { apiFetch, API_URL } from "@/app/lib/api";
import { getToken } from "@/app/lib/auth";
import { MOCK_CLIENTS } from "@/app/lib/mock-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

type Mode = "dictaphone" | "visio";
type BaseLegale = "consentement" | "interet_legitime";

export default function NewMeetingPage() {
  const router = useRouter();

  const [titre, setTitre] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [mode, setMode] = useState<Mode>("dictaphone");
  const [baseLegale, setBaseLegale] = useState<BaseLegale>("consentement");
  const [audioSource, setAudioSource] = useState<"record" | "import">("record");

  const [consentAccepted, setConsentAccepted] = useState(false);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const audioReady =
    mode === "visio" ||
    (audioSource === "import" && importedFile !== null) ||
    (audioSource === "record" && recordedBlob !== null);

  const canSubmit = titre.trim() && consentAccepted && audioReady && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError("");
    setLoading(true);

    try {
      // 1. Créer la réunion
      const meetingRes = await apiFetch("/meetings", {
        method: "POST",
        body: JSON.stringify({ titre }),
      });

      if (!meetingRes.ok) {
        setError("Impossible de créer la réunion.");
        return;
      }

      const { meeting_id } = await meetingRes.json();

      // 2. Uploader l'audio si disponible
      const audioFile =
        importedFile ??
        (recordedBlob
          ? new File([recordedBlob], "enregistrement.webm", { type: recordedBlob.type })
          : null);

      if (audioFile) {
        const formData = new FormData();
        formData.append("file", audioFile);
        formData.append("consentement_organisateur", "true");

        const token = getToken();
        const audioRes = await fetch(`${API_URL}/meetings/${meeting_id}/audio`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (!audioRes.ok) {
          setError("Réunion créée, mais l'upload audio a échoué. Réessayez depuis le détail.");
          router.push(`/reunions/${meeting_id}`);
          return;
        }
      }

      router.push(`/reunions/${meeting_id}`);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppSidebar>
      {/* Header */}
      <div className="flex items-center gap-3 px-8 pt-6 pb-4 shrink-0 border-b border-border">
        <Link
          href="/"
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-xl font-medium text-foreground">Nouvelle réunion</h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-[600px] mx-auto px-8 py-8 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="titre">Titre de la réunion</Label>
            <Input
              id="titre"
              placeholder="Ex: Revue Roadmap Q3"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
            />
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label>
              Client
              <span className="text-muted-foreground font-normal ml-1">— optionnel</span>
            </Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_CLIENTS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mode */}
          <div className="space-y-2">
            <Label>Mode d&apos;enregistrement</Label>
            <div className="flex items-center rounded-[10px] p-[3px] gap-0.5 bg-muted w-fit">
              {([
                { value: "dictaphone" as Mode, label: "Dictaphone", icon: Mic },
                { value: "visio" as Mode, label: "Visio", icon: Video },
              ]).map(({ value, label, icon: Icon }) => {
                const active = mode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-medium transition-all ${
                      active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    <Icon size={13} strokeWidth={2} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Base légale */}
          <div className="space-y-2">
            <Label>Base légale</Label>
            <div className="space-y-2">
              {([
                { value: "consentement" as BaseLegale, label: "Consentement", desc: "Les participants donnent leur accord explicite" },
                { value: "interet_legitime" as BaseLegale, label: "Intérêt légitime", desc: "Traitement nécessaire à l'activité professionnelle" },
              ]).map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    baseLegale === value ? "border-primary bg-accent" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="baseLegale"
                    value={value}
                    checked={baseLegale === value}
                    onChange={() => setBaseLegale(value)}
                    className="mt-0.5 accent-[var(--primary)]"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-[12px] text-muted-foreground">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Audio source (dictaphone only) */}
          {mode === "dictaphone" && (
            <div className="space-y-2">
              <Label>Source audio</Label>
              <div className="flex items-center rounded-[10px] p-[3px] gap-0.5 bg-muted w-fit">
                {([
                  { value: "record" as const, label: "Enregistrer" },
                  { value: "import" as const, label: "Importer" },
                ]).map(({ value, label }) => {
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
                      {label}
                    </button>
                  );
                })}
              </div>

              {audioSource === "record" ? (
                <AudioRecorder onBlobReady={setRecordedBlob} />
              ) : (
                <AudioImport onFileChange={setImportedFile} />
              )}
            </div>
          )}

          {mode === "visio" && (
            <div className="rounded-xl border-2 border-dashed p-8 text-center">
              <Video size={24} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground mb-1">Mode visio</p>
              <p className="text-[12px] text-muted-foreground">
                La capture audio sera démarrée automatiquement lors de la visioconférence.
              </p>
            </div>
          )}

          {/* Consent */}
          <ConsentBanner onAcceptedChange={setConsentAccepted} />

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <Button asChild variant="outline">
              <Link href="/">Annuler</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {loading
                ? "Envoi en cours…"
                : mode === "dictaphone" && audioSource === "import"
                ? "Importer et transcrire"
                : "Démarrer la réunion"}
            </Button>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
