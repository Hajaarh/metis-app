"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { API_URL } from "@/app/lib/api";

const MIN_LENGTH = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const type = params.get("type");
    if (accessToken && type === "recovery") {
      setToken(accessToken);
    }
  }, []);

  const mismatch = confirm.length > 0 && confirm !== password;
  const tooShort = password.length > 0 && password.length < MIN_LENGTH;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_LENGTH || password !== confirm || !token) return;
    setError("");
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      if (!r.ok) {
        setError("Lien invalide ou expiré. Recommencez depuis la page de connexion.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Impossible de joindre le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Lien invalide ou expiré.
            </p>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Demander un nouveau lien
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary">
              <Mic size={20} color="white" strokeWidth={2} />
            </div>
          </div>
          <CardTitle className="text-xl">Nouveau mot de passe</CardTitle>
          <CardDescription>Choisissez un mot de passe d&apos;au moins {MIN_LENGTH} caractères</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="text-center space-y-2">
              <p className="text-sm text-foreground font-medium">Mot de passe mis à jour !</p>
              <p className="text-[12px] text-muted-foreground">Redirection vers la connexion…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {tooShort && (
                  <p className="text-[11px] text-destructive">Minimum {MIN_LENGTH} caractères</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmer</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
                {mismatch && (
                  <p className="text-[11px] text-destructive">Les mots de passe ne correspondent pas.</p>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="w-full"
                disabled={loading || tooShort || mismatch || !password || !confirm}
              >
                {loading ? "Mise à jour…" : "Mettre à jour"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
