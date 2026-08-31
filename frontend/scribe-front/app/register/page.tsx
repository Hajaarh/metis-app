"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { setToken } from "@/app/lib/auth";
import { API_URL } from "@/app/lib/api";

const MIN_PASSWORD_LENGTH = 8;

function getPasswordStrength(pwd: string): { label: string; color: string; width: string } {
  if (pwd.length === 0) return { label: "", color: "", width: "0%" };
  if (pwd.length < MIN_PASSWORD_LENGTH) return { label: "Trop court", color: "bg-destructive", width: "25%" };
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (score === 0) return { label: "Faible", color: "bg-orange-400", width: "40%" };
  if (score === 1) return { label: "Moyen", color: "bg-yellow-400", width: "65%" };
  return { label: "Fort", color: "bg-green-500", width: "100%" };
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);
  const passwordMismatch = confirm.length > 0 && confirm !== password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const signupRes = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (signupRes.status === 400) {
        setError("Inscription impossible. Cet email est peut-être déjà utilisé.");
        return;
      }

      if (!signupRes.ok) {
        setError("Une erreur est survenue. Réessayez.");
        return;
      }

      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        router.push("/login");
        return;
      }

      const data = await loginRes.json();
      setToken(data.access_token);
      router.push("/");
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
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
          <CardTitle className="text-xl">Créer un compte Metis</CardTitle>
          <CardDescription>
            Commencez à transcrire vos réunions en quelques minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {strength.label}
                    {password.length < MIN_PASSWORD_LENGTH && (
                      <span> — minimum {MIN_PASSWORD_LENGTH} caractères</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmer le mot de passe</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              {passwordMismatch && (
                <p className="text-[11px] text-destructive">Les mots de passe ne correspondent pas.</p>
              )}
            </div>

            {error &&<p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading || passwordMismatch}>
              {loading ? "Création…" : "Créer mon compte"}
            </Button>
          </form>
          <div className="flex flex-col items-center gap-2 mt-4">
            <p className="text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
            <Link href="/forgot-password" className="text-[12.5px] text-muted-foreground hover:text-foreground transition-colors">
              Mot de passe oublié ?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
