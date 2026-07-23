"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { StatusDot } from "@/app/components/StatusDot";
import { MeetingAvatar } from "@/app/components/MeetingAvatar";
import { Badge } from "@/app/components/ui/badge";
import {
  MOCK_CLIENTS,
  MOCK_REUNIONS,
  formatDuration,
  formatTime,
  formatDate,
  getRelativeDate,
} from "@/app/lib/mock-data";

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const client = MOCK_CLIENTS.find((c) => c.id === id);
  const reunions = MOCK_REUNIONS.filter((r) => r.clientId === id);

  if (!client) {
    return (
      <AppSidebar>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Client non trouvé</p>
        </div>
      </AppSidebar>
    );
  }

  return (
    <AppSidebar>
      {/* Header */}
      <div className="px-8 pt-6 pb-4 shrink-0 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/clients"
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft size={16} />
          </Link>
          <MeetingAvatar name={client.nom} size={32} />
          <div>
            <h1 className="text-xl font-medium text-foreground">{client.nom}</h1>
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
              <span>Créé le {formatDate(client.dateCreation)}</span>
              {client.dateDernierContact && (
                <>
                  <span>·</span>
                  <span>Dernier contact : {getRelativeDate(client.dateDernierContact)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 ml-[52px]">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-muted-foreground" />
            <span className="text-[12.5px] text-foreground font-medium">
              {reunions.length}
            </span>
            <span className="text-[12.5px] text-muted-foreground">
              réunion{reunions.length > 1 ? "s" : ""}
            </span>
          </div>
          {reunions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[12.5px] text-muted-foreground">
                Dernière : {formatDate(reunions[0].dateDebut)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Meetings history */}
      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-hide">
        <p className="text-[10.5px] uppercase tracking-widest font-medium text-muted-foreground mb-3 px-1">
          Historique des réunions
        </p>

        {reunions.length > 0 ? (
          <div className="space-y-1">
            {reunions.map((reunion) => (
              <Link
                key={reunion.id}
                href={`/reunions/${reunion.id}`}
                className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13.5px] font-medium text-foreground truncate">
                      {reunion.titre}
                    </span>
                    <StatusDot status={reunion.statutTraitement} />
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <span>{formatDate(reunion.dateDebut)}</span>
                    <span>·</span>
                    <span>{formatTime(reunion.dateDebut)}</span>
                    <span>·</span>
                    <span>{formatDuration(reunion.dureeSecondes)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1">
                    <Users size={12} className="text-muted-foreground" />
                    <span className="text-[12px] text-muted-foreground">
                      {reunion.nombreParticipants}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[11px]">
                    {reunion.mode === "dictaphone" ? "Dictaphone" : "Visio"}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              Aucune réunion avec ce client pour le moment.
            </p>
          </div>
        )}
      </div>
    </AppSidebar>
  );
}
