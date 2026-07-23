"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retention, setRetention] = useState("90");
  const [tauxHoraire, setTauxHoraire] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/");
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
          <CardTitle className="text-xl">Créer un compte Scribe</CardTitle>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="retention">Durée de rétention audio (jours)</Label>
              <Input
                id="retention"
                type="number"
                min="1"
                max="365"
                value={retention}
                onChange={(e) => setRetention(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Conformément au RGPD, les fichiers audio seront supprimés après cette durée.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taux">
                Taux horaire (€/h)
                <span className="text-muted-foreground font-normal ml-1">— optionnel</span>
              </Label>
              <Input
                id="taux"
                type="number"
                min="0"
                step="0.01"
                placeholder="85.00"
                value={tauxHoraire}
                onChange={(e) => setTauxHoraire(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Créer mon compte
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
