"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { MeetingAvatar } from "@/app/components/MeetingAvatar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { apiFetch } from "@/app/lib/api";

interface Client {
  id: string;
  nom: string;
  date_creation: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [formNom, setFormNom] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/clients").then((r) => r.json()).then(setClients).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter((c) =>
    c.nom.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditingClient(null);
    setFormNom("");
    setDialogOpen(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setFormNom(client.nom);
    setDialogOpen(true);
  }

  async function handleSave() {
    const nom = formNom.trim();
    if (!nom) return;
    setSaving(true);
    if (editingClient) {
      const r = await apiFetch(`/clients/${editingClient.id}`, {
        method: "PATCH",
        body: JSON.stringify({ nom }),
      });
      if (r.ok) {
        setClients((prev) => prev.map((c) => (c.id === editingClient.id ? { ...c, nom } : c)));
      }
    } else {
      const r = await apiFetch("/clients", {
        method: "POST",
        body: JSON.stringify({ nom }),
      });
      if (r.ok) {
        const created: Client = await r.json();
        setClients((prev) => [...prev, created]);
      }
    }
    setSaving(false);
    setDialogOpen(false);
  }

  async function handleDelete() {
    if (!deletingClient) return;
    await apiFetch(`/clients/${deletingClient.id}`, { method: "DELETE" });
    setClients((prev) => prev.filter((c) => c.id !== deletingClient.id));
    setDeleteDialogOpen(false);
    setDeletingClient(null);
  }

  return (
    <AppSidebar>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-8 pt-6 pb-4 shrink-0 border-b border-border gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl font-medium text-foreground">Clients</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 h-8 rounded-xl px-3 bg-secondary">
            <Search size={12} strokeWidth={2} className="text-muted-foreground" />
            <input
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-[12.5px] outline-none border-none placeholder:text-muted-foreground text-foreground w-40"
            />
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus size={14} />
            Ajouter un client
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 scrollbar-hide">
        {loading && (
          <p className="text-sm text-muted-foreground text-center py-12">Chargement…</p>
        )}
        {!loading && filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="hidden sm:table-cell">Date création</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link
                      href={`/clients/${client.id}`}
                      className="flex items-center gap-2.5 hover:text-primary transition-colors"
                    >
                      <MeetingAvatar name={client.nom} size={26} />
                      <span className="font-medium text-foreground">{client.nom}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[12px] hidden sm:table-cell">
                    {new Date(client.date_creation).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(client)}>
                          <Pencil size={14} />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setDeletingClient(client);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : !loading && (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground mb-4">
              {search ? "Aucun client trouvé" : "Aucun client pour le moment"}
            </p>
            {!search && (
              <Button size="sm" onClick={openAdd}>
                <Plus size={14} />
                Ajouter votre premier client
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? "Modifier le client" : "Ajouter un client"}</DialogTitle>
            <DialogDescription>
              {editingClient ? "Modifiez les informations du client." : "Ajoutez un nouveau client à votre espace."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="client-nom">Nom du client</Label>
              <Input
                id="client-nom"
                placeholder="Ex: Monzo"
                value={formNom}
                onChange={(e) => setFormNom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={!formNom.trim() || saving}>
              {saving ? "Enregistrement…" : editingClient ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le client</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{deletingClient?.nom}</strong> ?
              Cette action est irréversible. Les réunions associées ne seront pas supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppSidebar>
  );
}
