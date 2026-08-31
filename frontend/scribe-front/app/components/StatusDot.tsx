"use client";

export type BackendStatus =
  | "en_attente"
  | "transcription"
  | "analyse"
  | "termine"
  | "erreur"
  | "attestation_manquante"
  | "consentement_refuse";

const STATUS_CONFIG: Record<BackendStatus, { color: string; label: string; animated: boolean }> = {
  en_attente:             { color: "#8A8A85", label: "En attente…",            animated: true  },
  transcription:          { color: "#8A8A85", label: "Transcription…",         animated: true  },
  analyse:                { color: "#D9A15B", label: "Analyse…",               animated: true  },
  termine:                { color: "#5E9E72", label: "Prêt",                   animated: false },
  erreur:                 { color: "#E05252", label: "Erreur",                 animated: false },
  attestation_manquante:  { color: "#E05252", label: "Attestation manquante",  animated: false },
  consentement_refuse:    { color: "#E05252", label: "Consentement refusé",    animated: false },
};

export function StatusDot({ status }: { status: BackendStatus }) {
  const { color, label, animated } = STATUS_CONFIG[status] ?? STATUS_CONFIG.en_attente;

  return (
    <span className="flex items-center gap-1.5">
      <span className="relative flex h-1.5 w-1.5">
        {animated && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ background: color }}
          />
        )}
        <span
          className="relative inline-flex rounded-full h-1.5 w-1.5"
          style={{ background: color }}
        />
      </span>
      <span className="text-[11px] font-medium" style={{ color }}>
        {label}
      </span>
    </span>
  );
}
