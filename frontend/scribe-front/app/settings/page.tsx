"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { apiFetch } from "@/app/lib/api";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [retention, setRetention] = useState("30");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch("/account/profile")
      .then((r) => r.json())
      .then((data) => {
        setEmail(data.email ?? "");
        setRetention(data.duree_retention_jours?.toString() ?? "30");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    await apiFetch("/account/profile", {
      method: "PATCH",
      body: JSON.stringify({ duree_retention_jours: parseInt(retention) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppSidebar>
      <div className="px-8 pt-6 pb-4 shrink-0 border-b border-border">
        <h1 className="text-xl font-medium text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Gérez votre profil et vos préférences de rétention</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-[600px] mx-auto px-8 py-8 space-y-6">
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
              <CardTitle>Rétention des données</CardTitle>
              <CardDescription>Configuration de la suppression automatique des fichiers audio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retention">Durée de rétention audio (jours)</Label>
                <Input
                  id="retention"
                  type="number"
                  min="1"
                  max="365"
                  value={retention}
                  onChange={(e) => setRetention(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="rounded-xl bg-accent p-4">
                <p className="text-[12.5px] text-accent-foreground leading-relaxed">
                  Conformément au RGPD et aux recommandations de la CNIL, les fichiers audio
                  des réunions seront automatiquement supprimés après{" "}
                  <strong>{retention} jours</strong>. Les transcriptions et comptes rendus
                  textuels sont conservés indépendamment.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={loading || saving}>
              {saving ? "Enregistrement…" : saved ? "Enregistré !" : "Enregistrer les modifications"}
            </Button>
            {saved && <span className="text-sm text-[#5E9E72]">Modifications enregistrées</span>}
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
