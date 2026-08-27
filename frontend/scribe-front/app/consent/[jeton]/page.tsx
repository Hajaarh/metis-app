"use client";

import { use, useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Choix = "en_attente" | "accepte" | "refuse";

interface ConsentContext {
  jeton: string;
  reunion_titre: string;
  choix: Choix;
}

async function apiFetch(path: string, options?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
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

  useEffect(() => {
    apiFetch(`/consent/${jeton}`)
      .then(async (r) => {
        if (r.status === 404) { setNotFound(true); return; }
        const data: ConsentContext = await r.json();
        setContext(data);
        if (data.choix !== "en_attente") setChoix(data.choix);
      })
      .finally(() => setLoading(false));
  }, [jeton]);

  async function handleSubmit(accepte: boolean) {
    setSubmitting(true);
    await apiFetch(`/consent/${jeton}`, {
      method: "POST",
      body: JSON.stringify({ accepte }),
    });
    setChoix(accepte ? "accepte" : "refuse");
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
        <p className="text-sm text-muted-foreground text-center">
          Vous avez accepté l&apos;enregistrement de la réunion <strong>{context.reunion_titre}</strong>.
          Vous pouvez fermer cette page.
        </p>
      </ConsentShell>
    );
  }

  if (choix === "refuse") {
    return (
      <ConsentShell>
        <XCircle size={40} className="text-destructive mx-auto mb-4" />
        <h2 className="text-lg font-medium text-foreground mb-2">Refus enregistré</h2>
        <p className="text-sm text-muted-foreground text-center">
          Vous avez refusé l&apos;enregistrement de la réunion <strong>{context.reunion_titre}</strong>.
          Vous pouvez fermer cette page.
        </p>
      </ConsentShell>
    );
  }

  return (
    <ConsentShell>
      <h2 className="text-lg font-medium text-foreground mb-2 text-center">
        Demande de consentement
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Vous êtes invité(e) à participer à la réunion{" "}
        <strong className="text-foreground">{context.reunion_titre}</strong>.
        Cette réunion sera enregistrée et transcrite. Donnez-vous votre accord ?
      </p>
      <div className="rounded-xl bg-accent p-4 mb-6">
        <p className="text-[12.5px] text-accent-foreground leading-relaxed">
          Conformément au RGPD, votre consentement est nécessaire avant tout enregistrement.
          Vous pouvez refuser à tout moment. En cas de refus, la réunion ne sera pas enregistrée.
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
        >
          Je refuse
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          disabled={submitting}
        >
          {submitting ? "Enregistrement…" : "J'accepte"}
        </Button>
      </div>
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
