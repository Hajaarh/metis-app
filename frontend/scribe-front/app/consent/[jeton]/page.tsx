"use client";

import { use, useEffect, useState } from "react";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/app/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Choix = "en_attente" | "accepte" | "refuse";

interface ConsentContext {
  jeton: string;
  reunion_titre: string;
  signes: number;
  total: number;
}

async function apiFetch(path: string, options?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
}

function storageKey(jeton: string) {
  return `metis_retract_${jeton}`;
}

export default function ConsentPage({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const { jeton } = use(params);
  const [context, setContext] = useState<ConsentContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [choix, setChoix] = useState<Choix | null>(null);
  const [retractionJeton, setRetractionJeton] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey(jeton));
    if (stored) {
      setRetractionJeton(stored);
      setChoix("accepte");
    }
    apiFetch(`/consent/${jeton}`)
      .then(async (r) => {
        if (r.status === 404) { setNotFound(true); return; }
        const data: ConsentContext = await r.json();
        setContext(data);
      })
      .finally(() => setLoading(false));
  }, [jeton]);

  async function handleSubmit(accepte: boolean) {
    setSubmitting(true);
    const r = await apiFetch(`/consent/${jeton}`, {
      method: "POST",
      body: JSON.stringify({ accepte }),
    });
    if (r.ok) {
      const data = await r.json();
      if (accepte && data.jeton_retractation) {
        sessionStorage.setItem(storageKey(jeton), data.jeton_retractation);
        setRetractionJeton(data.jeton_retractation);
      }
      setChoix(accepte ? "accepte" : "refuse");
    }
    setSubmitting(false);
  }

  async function handleRetract() {
    if (!retractionJeton) return;
    setSubmitting(true);
    await apiFetch(`/consent/${retractionJeton}`, { method: "DELETE" });
    sessionStorage.removeItem(storageKey(jeton));
    setRetractionJeton(null);
    setChoix("en_attente");
    setSubmitting(false);
  }

  if (loading) {
    return <ConsentShell><p className="text-sm text-muted-foreground">Chargement…</p></ConsentShell>;
  }

  if (notFound || !context) {
    return (
      <ConsentShell>
        <p className="text-sm text-muted-foreground">Ce lien de consentement est invalide ou a expiré.</p>
      </ConsentShell>
    );
  }

  if (choix === "accepte") {
    return (
      <ConsentShell>
        <CheckCircle size={40} className="text-[#5E9E72] mx-auto mb-4" />
        <h2 className="text-lg font-medium text-foreground mb-2">Consentement enregistré</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Vous avez accepté l&apos;enregistrement de la réunion{" "}
          <strong>{context.reunion_titre}</strong>.
        </p>
        {retractionJeton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetract}
            disabled={submitting}
            className="text-destructive border-destructive/40 hover:bg-destructive/5"
          >
            <RotateCcw size={13} />
            {submitting ? "Rétractation…" : "Rétracter mon consentement"}
          </Button>
        )}
      </ConsentShell>
    );
  }

  if (choix === "refuse") {
    return (
      <ConsentShell>
        <XCircle size={40} className="text-destructive mx-auto mb-4" />
        <h2 className="text-lg font-medium text-foreground mb-2">Refus enregistré</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Vous avez refusé l&apos;enregistrement de la réunion{" "}
          <strong>{context.reunion_titre}</strong>.
        </p>
        <Button variant="outline" size="sm" onClick={() => setChoix("en_attente")}>
          Modifier mon choix
        </Button>
      </ConsentShell>
    );
  }

  return (
    <ConsentShell>
      <h2 className="text-lg font-medium text-foreground mb-1 text-center">
        Demande de consentement
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Vous êtes invité(e) à participer à la réunion{" "}
        <strong className="text-foreground">{context.reunion_titre}</strong>.
        Donnez-vous votre accord pour qu&apos;elle soit enregistrée et transcrite ?
      </p>

      <ul className="w-full space-y-2.5 mb-6">
        {[
          "L'audio est capté, transcrit et un compte rendu est généré sans identifier qui vous êtes à partir de votre voix.",
          "L'audio brut est supprimé dès que le compte rendu est produit.",
          "Vous pouvez refuser à tout moment, avant ou pendant la réunion.",
          "Vous gardez vos droits d'accès, de rectification et de suppression sur ce qui vous concerne.",
        ].map((mention, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[12.5px] text-muted-foreground">
            <span className="mt-[5px] w-1 h-1 rounded-full shrink-0 bg-muted-foreground/50" />
            {mention}
          </li>
        ))}
      </ul>

      <div className="flex gap-3 justify-center w-full mb-5">
        <Button
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="flex-1"
        >
          Je refuse
        </Button>
        <Button onClick={() => handleSubmit(true)} disabled={submitting} className="flex-1">
          {submitting ? "Enregistrement…" : "J'accepte"}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
        Votre réponse est horodatée et conservée comme preuve de votre consentement ou de votre refus.
      </p>

      <a
        href="https://www.cnil.fr/fr/les-droits-pour-maitriser-vos-donnees-personnelles"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 text-[11.5px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
      >
        En savoir plus sur vos droits ·
      </a>
    </ConsentShell>
  );
}

function ConsentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm flex flex-col items-center">
        <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground mb-6">
          Metis · Consentement
        </p>
        {children}
      </div>
    </div>
  );
}
