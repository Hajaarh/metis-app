"use client";

import { CheckCircle, Zap, ListChecks } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

export interface CompteRendu {
  id: string;
  resume: string;
  modele_utilise: string;
}

export interface PointCle {
  id: string;
  contenu: string;
  ordre: number;
}

export interface Decision {
  id: string;
  contenu: string;
  ordre: number;
}

export interface Action {
  id: string;
  intitule: string;
  responsable: string | null;
  echeance: string | null;
}

interface SummaryViewProps {
  compteRendu: CompteRendu;
  pointsCles: PointCle[];
  decisions: Decision[];
  actions: Action[];
}

export function SummaryView({ compteRendu, pointsCles, decisions, actions }: SummaryViewProps) {
  return (
    <div className="space-y-8">
      {/* Résumé */}
      <div>
        <h3 className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground mb-3">
          Résumé
        </h3>
        <p className="text-[14px] leading-relaxed text-foreground">{compteRendu.resume}</p>
      </div>

      {/* Points clés */}
      {pointsCles.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={13} className="text-primary" />
            <h3 className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground">
              Points clés
            </h3>
          </div>
          <ul className="space-y-2">
            {pointsCles.map((p) => (
              <li key={p.id} className="flex items-start gap-3">
                <span className="mt-[9px] w-1 h-1 rounded-full shrink-0 bg-primary" />
                <span className="text-[14px] leading-relaxed text-foreground">{p.contenu}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Décisions */}
      {decisions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={13} className="text-[#5E9E72]" />
            <h3 className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground">
              Décisions
            </h3>
          </div>
          <ul className="space-y-2">
            {decisions.map((d) => (
              <li key={d.id} className="flex items-start gap-3">
                <span className="mt-[9px] w-1 h-1 rounded-full shrink-0 bg-[#5E9E72]" />
                <span className="text-[14px] leading-relaxed text-foreground">{d.contenu}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ListChecks size={13} className="text-accent-foreground" />
            <h3 className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground">
              Actions
            </h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Échéance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-foreground">{a.intitule}</TableCell>
                  <TableCell>
                    {a.responsable ? (
                      <Badge variant="secondary">{a.responsable}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {a.echeance ? (
                      <span className="text-foreground">
                        {new Date(a.echeance).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
