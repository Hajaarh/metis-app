"use client";

import { RefreshCw, CheckCircle, AlertCircle, Zap, ListChecks } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import type { MockCompteRendu } from "@/app/lib/mock-data";

interface SummaryViewProps {
  compteRendu: MockCompteRendu;
}

export function SummaryView({ compteRendu }: SummaryViewProps) {
  return (
    <div className="space-y-8">
      {/* Résumé */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground">
            Résumé
          </h3>
          <Button variant="ghost" size="sm" className="text-[12px] text-muted-foreground">
            <RefreshCw size={12} />
            Régénérer
          </Button>
        </div>
        <p className="text-[14px] leading-relaxed text-foreground">
          {compteRendu.resume}
        </p>
      </div>

      {/* Points clés */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={13} className="text-primary" />
          <h3 className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground">
            Points clés
          </h3>
        </div>
        <ul className="space-y-2">
          {compteRendu.pointsCles.map((p) => (
            <li key={p.ordre} className="flex items-start gap-3">
              <span className="mt-[9px] w-1 h-1 rounded-full shrink-0 bg-primary" />
              <span className="text-[14px] leading-relaxed text-foreground">
                {p.contenu}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Décisions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={13} className="text-[#5E9E72]" />
          <h3 className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground">
            Décisions
          </h3>
        </div>
        <ul className="space-y-2">
          {compteRendu.decisions.map((d) => (
            <li key={d.ordre} className="flex items-start gap-3">
              <span className="mt-[9px] w-1 h-1 rounded-full shrink-0 bg-[#5E9E72]" />
              <span className="text-[14px] leading-relaxed text-foreground">
                {d.contenu}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
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
            {compteRendu.actions.map((a, i) => (
              <TableRow key={i}>
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
    </div>
  );
}
