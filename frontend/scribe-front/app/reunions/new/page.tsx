"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic, Video } from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { ConsentBanner } from "@/app/components/ConsentBanner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { apiFetch } from "@/app/lib/api";

interface Client {
  id: string;
  nom: string;
}

type Mode = "dictaphone" | "visio";
type BaseLegale = "consentement" | "interet_legitime";

export default function NewMeetingPage() {
  const router = useRouter();

  const [titre, setTitre] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [mode, setMode] = useState<Mode>("dictaphone");
  const [baseLegale, setBaseLegale] = useState<BaseLegale>("consentement");
  const [langue, setLangue] = useState("fr");
  const [nombreLocuteurs, setNombreLocuteurs] = useState(0);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/clients").then((r) => r.json()).then(setClients);
  }, []);

  const needsConsent = mode === "dictaphone" && baseLegale === "consentement";
  const canSubmit = titre.trim() && (!needsConsent || consentAccepted) && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/meetings", {
        method: "POST",
        body: JSON.stringify({
          titre,
          client_id: clientId || null,
          mode,
          base_legale: baseLegale,
          langue,
          nombre_locuteurs: nombreLocuteurs > 0 ? nombreLocuteurs : null,
        }),
      });
      if (!res.ok) { setError("Impossible de créer la réunion."); return; }
      const { meeting_id } = await res.json();
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
      <div className="flex items-center gap-3 px-4 sm:px-8 pt-6 pb-4 shrink-0 border-b border-border">
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
        <div className="max-w-[600px] mx-auto px-4 sm:px-8 py-8 space-y-6">
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
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
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

          {/* Langue + nombre de locuteurs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Langue parlée</Label>
              <Select value={langue} onValueChange={setLangue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: "fr", label: "Français" },
                    { value: "en", label: "English" },
                    { value: "es", label: "Español" },
                    { value: "de", label: "Deutsch" },
                    { value: "it", label: "Italiano" },
                    { value: "pt", label: "Português" },
                    { value: "nl", label: "Nederlands" },
                    { value: "ar", label: "العربية" },
                  ].map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Nombre d&apos;intervenants
                <span className="text-muted-foreground font-normal ml-1">— optionnel</span>
              </Label>
              <Select value={String(nombreLocuteurs)} onValueChange={(v) => setNombreLocuteurs(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Détection auto</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          {/* Consent */}
          {needsConsent && <ConsentBanner onAcceptedChange={setConsentAccepted} />}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <Button asChild variant="outline">
              <Link href="/">Annuler</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {loading ? "Création…" : "Créer la réunion"}
            </Button>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
