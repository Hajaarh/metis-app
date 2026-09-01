# Metis

Assistant de réunion. Capture l'audio (dictaphone, visio, import de fichier), transcrit avec diarisation,
produit un compte rendu structuré (résumé, décisions, actions) via un LLM, et purge l'audio brut une fois le
compte rendu produit. Conçu autour de la conformité RGPD : attestation organisateur, consentement participant,
base légale intérêt légitime pour les usages internes en entreprise.

## Stack

- **Backend** — FastAPI (Python), Supabase (auth + base de données), Gladia (transcription), Mistral (analyse LLM)
- **Frontend** — Next.js 16 / React 19, Tailwind, shadcn/ui
- **Architecture backend** — Ports & Adapters (contrats / interfaces / adaptateurs / orchestrateur) — détails dans [DOCUMENTATION.md](./DOCUMENTATION.md)

## Démarrer avec Docker

```
docker compose up --build
```

- `http://localhost:3000` — frontend
- `http://localhost:8000` — API (`/health`)

## Variables d'environnement

Copier `.env.example` vers `.env` et renseigner les clés (`GLADIA_API_KEY`, `MISTRAL_API_KEY`, `SUPABASE_URL`,
`SUPABASE_SERVICE_KEY`, etc). Liste complète dans `.env.example`.

## Structure du dépôt

- `backend/` — API FastAPI
- `frontend/scribe-front/` — application Next.js
- `maquette/` — prototype Streamlit exploratoire, hors production
- `tools/` — scripts d'exploration des API Gladia/Mistral utilisés par la maquette

## Documentation

Voir [DOCUMENTATION.md](./DOCUMENTATION.md) pour le détail fichier par fichier, dossier par dossier, du backend
et du frontend — ce que fait chaque partie, pourquoi, et la logique derrière.
