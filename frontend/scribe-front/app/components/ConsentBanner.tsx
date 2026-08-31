"use client";

import { useState } from "react";
import { Shield, Check } from "lucide-react";

interface ConsentBannerProps {
  onAcceptedChange: (accepted: boolean) => void;
}

export function ConsentBanner({ onAcceptedChange }: ConsentBannerProps) {
  const [accepted, setAccepted] = useState(false);

  function toggle() {
    const next = !accepted;
    setAccepted(next);
    onAcceptedChange(next);
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-primary shrink-0" />
        <span className="text-sm font-medium text-foreground">
          Attestation organisateur
        </span>
      </div>
      <p className="text-[12.5px] text-muted-foreground leading-relaxed">
        En tant qu&apos;organisateur, j&apos;atteste avoir informé tous les participants
        que cette réunion sera enregistrée à des fins de transcription.
        Les participants pourront donner ou refuser leur consentement via un lien individuel.
      </p>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <button
          type="button"
          onClick={toggle}
          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
            accepted
              ? "bg-primary border-primary"
              : "border-muted-foreground/30 bg-background"
          }`}
        >
          {accepted && <Check size={10} color="white" strokeWidth={3} />}
        </button>
        <span className="text-[12.5px] text-foreground leading-relaxed">
          Je certifie avoir informé les participants de l&apos;enregistrement
          et du traitement de leurs données vocales conformément au RGPD.
        </span>
      </label>
    </div>
  );
}
