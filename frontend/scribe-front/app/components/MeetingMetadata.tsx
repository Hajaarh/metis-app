"use client";

import { Shield, Brain, HardDrive, Users, Scale, Tag } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { formatDate } from "@/app/lib/mock-data";
import type { MockReunion, MockAttestation, MockConsentement } from "@/app/lib/mock-data";

interface MeetingMetadataProps {
  reunion: MockReunion;
  themes: string[];
  attestation?: MockAttestation;
  consentements?: MockConsentement[];
  modeleUtilise?: string;
}

export function MeetingMetadata({
  reunion,
  themes,
  attestation,
  consentements,
  modeleUtilise,
}: MeetingMetadataProps) {
  return (
    <div className="space-y-8">
      {/* Type & thèmes */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Tag size={13} className="text-muted-foreground" />
            <h4 className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground">
              Type de réunion
            </h4>
          </div>
          <Badge variant="secondary" className="text-[12px]">
            {reunion.typeReunion || "Non classifié"}
          </Badge>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Tag size={13} className="text-muted-foreground" />
            <h4 className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground">
              Thèmes détectés
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {themes.map((t) => (
              <Badge key={t} variant="outline" className="text-[11px]">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Infos techniques */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain size={13} className="text-muted-foreground" />
            <h4 className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground">
              Modèle IA utilisé
            </h4>
          </div>
          <p className="text-sm text-foreground">{modeleUtilise || "—"}</p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users size={13} className="text-muted-foreground" />
            <h4 className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground">
              Participants
            </h4>
          </div>
          <p className="text-sm text-foreground">{reunion.nombreParticipants} participant{reunion.nombreParticipants > 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Audio status */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <HardDrive size={13} className="text-muted-foreground" />
          <h4 className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground">
            Statut audio
          </h4>
        </div>
        {reunion.audioPurge ? (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px]">Audio purgé</Badge>
            {reunion.datePurgeAudio && (
              <span className="text-[12px] text-muted-foreground">
                Suppression programmée le {formatDate(reunion.datePurgeAudio)}
              </span>
            )}
          </div>
        ) : (
          <Badge variant="secondary" className="text-[11px]">Audio conservé</Badge>
        )}
      </div>

      {/* Base légale */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Scale size={13} className="text-muted-foreground" />
          <h4 className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground">
            Base légale
          </h4>
        </div>
        <Badge variant="secondary" className="text-[12px]">
          {reunion.baseLegale === "consentement" ? "Consentement" : "Intérêt légitime"}
        </Badge>
      </div>

      {/* Attestation */}
      {attestation && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield size={13} className="text-muted-foreground" />
            <h4 className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground">
              Attestation organisateur
            </h4>
          </div>
          <div className="rounded-xl bg-secondary p-4 space-y-1.5">
            <p className="text-[12px] text-muted-foreground">
              Signée le {formatDate(attestation.horodatage)}
            </p>
            <p className="text-[12.5px] text-foreground leading-relaxed">
              {attestation.versionTexte}
            </p>
          </div>
        </div>
      )}

      {/* Consentements */}
      {consentements && consentements.length > 0 && (
        <div>
          <h4 className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground mb-3">
            Consentements participants
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jeton anonyme</TableHead>
                <TableHead>Choix</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consentements.map((c) => (
                <TableRow key={c.jeton}>
                  <TableCell className="font-mono text-[12px] text-muted-foreground">
                    {c.jeton}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={c.choix === "accepte" ? "default" : "destructive"}
                      className="text-[11px]"
                    >
                      {c.choix === "accepte" ? "Accepté" : "Refusé"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">
                    {formatDate(c.horodatage)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
