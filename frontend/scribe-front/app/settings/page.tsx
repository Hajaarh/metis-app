"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Download, Pencil, ChevronRight } from "lucide-react";
import Link from "next/link";
import { AppSidebar } from "@/app/components/AppSidebar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { apiFetch } from "@/app/lib/api";
import { clearToken } from "@/app/lib/auth";

interface Client {
  id: string;
  nom: string;
  date_creation: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [clients, setClients] = useState<Client[]>([]);
  const [newClientNom, setNewClientNom] = useState("");
  const [addingClient, setAddingClient] = useState(false);
  const [renamingClientId, setRenamingClientId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch("/account/profile").then((r) => r.json()),
      apiFetch("/clients").then((r) => r.json()),
    ]).then(([profile, clientList]) => {
      setEmail(profile.email ?? "");
      setClients(clientList);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleAddClient() {
    const nom = newClientNom.trim();
    if (!nom) return;
    setAddingClient(true);
    const r = await apiFetch("/clients", {
      method: "POST",
      body: JSON.stringify({ nom }),
    });
    if (r.ok) {
      const created: Client = await r.json();
      setClients((prev) => [...prev, created]);
      setNewClientNom("");
    }
    setAddingClient(false);
  }

  async function handleDeleteClient(id: string) {
    await apiFetch(`/clients/${id}`, { method: "DELETE" });
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  function startRenameClient(client: Client) {
    setRenamingClientId(client.id);
    setRenameDraft(client.nom);
  }

  async function saveRenameClient(id: string) {
    const nom = renameDraft.trim();
    setRenamingClientId(null);
    if (!nom || nom === clients.find((c) => c.id === id)?.nom) return;
    const r = await apiFetch(`/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ nom }),
    });
    if (r.ok) {
      setClients((prev) => prev.map((c) => c.id === id ? { ...c, nom } : c));
    }
  }

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }
    setPasswordError("");
    setChangingPassword(true);
    const r = await apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ new_password: newPassword }),
    }).catch(() => null);
    setChangingPassword(false);
    if (r?.ok || r?.status === 204) {
      setNewPassword("");
      setConfirmPassword("");
      setPasswordChanged(true);
      setTimeout(() => setPasswordChanged(false), 3000);
    } else {
      setPasswordError("Changement impossible. Réessayez.");
    }
  }

  async function handleExport() {
    setExporting(true);
    setExportError(false);
    try {
      const r = await apiFetch("/account/data");
      if (!r.ok) { setExportError(true); return; }
      const data = await r.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `metis-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    const r = await apiFetch("/account", { method: "DELETE" });
    if (r.ok || r.status === 204) {
      clearToken();
      router.push("/login");
    } else {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  return (
    <AppSidebar>
      <div className="px-4 sm:px-8 pt-6 pb-4 shrink-0 border-b border-border">
        <h1 className="text-xl font-medium text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Gérez votre profil, vos clients et vos préférences</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-[600px] mx-auto px-4 sm:px-8 py-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>Vos informations personnelles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={loading ? "…" : email} disabled />
                <p className="text-[11px] text-muted-foreground">L&apos;email ne peut pas être modifié.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mot de passe</CardTitle>
              <CardDescription>Choisissez un nouveau mot de passe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                />
              </div>
              {passwordError && <p className="text-[12px] text-destructive">{passwordError}</p>}
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword || !confirmPassword}
                  variant="outline"
                >
                  {changingPassword ? "Mise à jour…" : "Mettre à jour"}
                </Button>
                {passwordChanged && (
                  <span className="text-sm text-[#5E9E72]">Mot de passe mis à jour !</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clients</CardTitle>
              <CardDescription>Gérez la liste de vos clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!loading && clients.length > 0 && (
                <ul className="space-y-1">
                  {clients.map((c) => (
                    <li key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50">
                      {renamingClientId === c.id ? (
                        <input
                          autoFocus
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onBlur={() => saveRenameClient(c.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRenameClient(c.id);
                            if (e.key === "Escape") setRenamingClientId(null);
                          }}
                          className="flex-1 text-[13.5px] text-foreground bg-transparent border-b border-primary outline-none"
                        />
                      ) : (
                        <span className="flex-1 text-[13.5px] text-foreground">{c.nom}</span>
                      )}
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <button
                          onClick={() => startRenameClient(c)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Renommer"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(c.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!loading && clients.length === 0 && (
                <p className="text-[13px] text-muted-foreground">Aucun client pour l&apos;instant.</p>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Nom du client"
                  value={newClientNom}
                  onChange={(e) => setNewClientNom(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddClient(); }}
                  disabled={loading || addingClient}
                />
                <Button
                  onClick={handleAddClient}
                  disabled={loading || addingClient || !newClientNom.trim()}
                  variant="outline"
                >
                  {addingClient ? "Ajout…" : "Ajouter"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conformité</CardTitle>
              <CardDescription>Documents relatifs à la protection des données et au RGPD</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {[
                { href: "/legal/charte", label: "Charte d'engagement de l'utilisateur" },
                { href: "/legal/organisateur", label: "Notice organisateur" },
                { href: "/legal/entreprises", label: "Notice entreprises clientes" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 text-[13.5px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                  <ChevronRight size={14} className="shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Données personnelles</CardTitle>
              <CardDescription>Export et suppression de vos données conformément au RGPD</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={loading || exporting}
                  className="gap-2"
                >
                  <Download size={14} />
                  {exporting ? "Export en cours…" : "Exporter mes données"}
                </Button>
                {exportError && (
                  <p className="text-[12px] text-destructive self-center">
                    L&apos;export a échoué. Réessayez.
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Supprimer mon compte</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Supprime définitivement votre compte et toutes vos données (réunions, transcriptions, comptes rendus). Cette action est irréversible.
                  </p>
                </div>
                {!deleteConfirm ? (
                  <Button
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2"
                    onClick={() => setDeleteConfirm(true)}
                  >
                    <Trash2 size={14} />
                    Supprimer mon compte
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                    >
                      {deleting ? "Suppression…" : "Confirmer la suppression"}
                    </Button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppSidebar>
  );
}
