# Documentation Metis

Référence fichier par fichier / dossier par dossier : ce que fait chaque partie, pourquoi, et la logique
derrière.

## Architecture backend — Ports & Adapters

- **contrat** = forme exacte d'une donnée (`Transcript`, `MeetingIntelligence`) — aucune dépendance, la couche
  la plus stable.
- **provider** = interface, une promesse de comportement ("je sais transcrire") — classe abstraite, ne parle à
  aucun SDK.
- **adapter** = qui tient la promesse, parle au vrai fournisseur (`GladiaAdapter`, `MistralAdapter`).
- **orchestrateur** (`meeting_pipeline.py`) = utilise les providers, ne connaît jamais l'adaptateur concret.
- Un seul point de branchement fournisseur ↔ interface : `core/deps.py`.

But : changer de fournisseur (transcription, LLM) sans toucher la logique métier.

---

## Backend — `backend/app/`

### `main.py`
Point d'entrée FastAPI. Monte tous les routers (`api/routes_*.py`), configure CORS via `ALLOWED_ORIGINS`.

### `core/`
- `config.py` — `Settings` (pydantic-settings), lit `.env` : clés API, URL Supabase, durée de rétention par défaut.
- `deps.py` — injection de dépendances. Singletons `lru_cache` : `get_repository()`, `get_pipeline()`. Seul
  endroit où un adaptateur concret (Gladia, Mistral) est branché sur une interface.
- `security.py` — `get_current_user_id` : vérifie le token Bearer auprès de Supabase Auth, extrait l'id
  utilisateur. Utilisé comme dépendance FastAPI sur les routes protégées.

### `contracts/`
- `transcript.py` — `Transcript`, `Segment` : forme d'une transcription diarisée (texte, locuteur, timing).
- `meeting_intelligence.py` — forme du résultat d'analyse LLM (résumé, points clés, décisions, actions).

### `providers/`
- `transcription/base.py` — interface `TranscriptionProvider` (`transcribe(...)`).
- `transcription/gladia_adapter.py` — implémentation Gladia. `build_speaker_label` produit "Intervenant A/B/…".
- `llm/base.py` — interface `LLMProvider` (`generate_intelligence(...)`).
- `llm/mistral_adapter.py` — implémentation Mistral, sortie structurée (`response_format`).

### `orchestrator/meeting_pipeline.py`
Logique métier centrale. `MeetingPipeline.run()` :
1. vérifie le droit de traiter (base légale, attestation organisateur, consentement) — arrêt net sinon, avant
   tout appel API ;
2. transcrit → analyse → sauvegarde, statut mis à jour en base + diffusé en websocket à chaque étape ;
3. purge l'audio brut une fois le compte rendu produit ;
4. toute exception technique est capturée, tracée (`message_erreur`), puis re-levée.

Exceptions dédiées : `AttestationManquanteError`, `ConsentementRefuseError`.


### `db/`
- `client.py` — client Supabase, singleton `lru_cache`.
- `models.py` — constantes : noms de tables, statuts de traitement, bases légales, versions d'attestation.
- `repository.py` — toutes les requêtes DB. Points clés : `save_attestation` (idempotent, skip si existe),
  `save_transcript` (idempotent, delete-then-insert), `save_intelligence` (relie actions/décisions aux segments
  source), `dashboard_metrics` (répartition temps de parole, fréquence par mois, stats par client).

### `api/` — routes
- `routes_auth.py` — signup, login, forgot/reset/change password.
- `routes_meetings.py` — créer une réunion, upload audio (202 async), lister/détailler, renommer/rattacher un
  client, renommer un locuteur, supprimer.
- `routes_clients.py` — CRUD client + actions/stats par client.
- `routes_consent.py` — contexte de consentement par jeton, soumission, rétractation (DELETE).
- `routes_account.py` — profil, export de données RGPD, suppression de compte.
- `routes_dashboard.py` — métriques agrégées.
- `routes_ws_meetings.py` / `ws_manager.py` — websocket `/ws/meetings/{id}`, diffuse statuts et compteurs de
  consentement en direct (pas de flux audio dedans).

### `tests/`
- `fakes.py` — doubles de test (`FakeSupabase`, `FakeTable`, `FakeTranscriptionProvider`, `FakeLLMProvider`) —
  pas de vrais appels API/DB en test.
- `test_meeting_pipeline.py`, `test_repository.py`, `test_routes.py`, `test_mistral_adapter.py`,
  `test_anti_hallucination.py` — un fichier de test par brique.

### `backend/supabase/migration/scribe_db.sql`
Schéma de la base : tables, contraintes, relations.

### `backend/scripts/`
Scripts d'essai manuel (`try_gladia.py`, `try_mistral.py`) — hors app, pour tester une clé API à la main.

---

## Frontend — `frontend/scribe-front/app/`

### Pages publiques (sans sidebar)
- `login/`, `register/`, `forgot-password/`, `reset-password/` — flux d'authentification classique (JWT).
- `consent/[jeton]/` — page de consentement participant, non authentifiée, accédée via lien.

### Pages principales (authentifiées, avec sidebar)
- `page.tsx` — liste des réunions (accueil).
- `dashboard/page.tsx` — métriques/KPI.
- `reunions/new/` — création réunion (titre, client, mode, base légale, langue).
- `reunions/[id]/` — détail réunion : capture/upload audio, websocket temps réel, onglets transcription /
  compte rendu.
- `clients/`, `clients/[id]/` — gestion clients, détail avec actions et répartition du temps de parole.
- `settings/` — profil, mot de passe, gestion clients, liens légaux, export/suppression RGPD.

### `legal/` — notices de conformité (contenu statique, sans fetch)
- `_helpers.tsx` — composants de mise en page partagés (pas de logique).
- `charte/`, `entreprises/`, `organisateur/`, `participant/` — les 4 notices RGPD.

### `components/`
- `AppSidebar.tsx` — nav persistante, badge "enregistrement en cours" (via `recording-context`).
- `AudioRecorder.tsx` — capture dictaphone (micro), délègue l'état à `recording-context`.
- `TabCaptureRecorder.tsx` — capture visio via `getDisplayMedia` (partage d'écran/onglet natif du navigateur,
  pas d'extension), microphone optionnel mixé via `AudioContext`.
- `AudioImport.tsx` — upload de fichier audio existant.
- `ConsentBanner.tsx` — attestation organisateur (case à cocher).
- `TranscriptView.tsx` / `SummaryView.tsx` — affichage transcription / compte rendu, liens croisés "Source".
- `MeetingAvatar.tsx`, `StatusDot.tsx` — petits composants d'affichage.
- `ui/*` — primitives shadcn/ui (Radix + Tailwind).

### `lib/`
- `api.ts` — client HTTP unique (`apiFetch`), injecte le JWT, redirige vers `/login` sur 401.
- `auth.ts` — lecture/écriture du token (localStorage + cookie).
- `recording-context.tsx` — contexte React global : possède le `MediaRecorder`, permet à l'enregistrement de
  survivre à la navigation entre pages, empêche deux enregistrements simultanés.

### Racine
- `providers.tsx` — enveloppe l'app dans `RecordingProvider`.
- `layout.tsx` — layout racine Next.js, monte `providers.tsx`.
- `proxy.ts` — middleware Next 16 : protège les routes selon le cookie `auth_token`.

### Communication frontend ↔ backend
HTTP via `apiFetch` (JSON + JWT). Un seul websocket, ouvert page par page sur `reunions/[id]`, fermé à la
navigation — pas de flux audio dessus, seulement statuts et consentement en direct.
