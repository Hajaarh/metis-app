-- Extension nécessaire pour uuid_generate
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. UTILISATEUR
-- ============================================================
create table utilisateur (
    id uuid primary key references auth.users(id) on delete cascade,  
    email text not null unique,
    duree_retention_jours int not null,
    taux_horaire float8,                 -- nullable - Avancé
    date_creation timestamp not null default now()
);

-- ============================================================
-- 2. CLIENT
-- ============================================================
create table client (
    id uuid primary key default gen_random_uuid(),
    utilisateur_id uuid not null references utilisateur(id) on delete cascade,
    nom text not null,
    date_creation timestamp not null default now(),
    date_dernier_contact timestamp        -- base du calcul CNIL
);

-- ============================================================
-- 3. REUNION
-- ============================================================
create table reunion (
    id uuid primary key default gen_random_uuid(),
    utilisateur_id uuid not null references utilisateur(id) on delete cascade,
    client_id uuid references client(id) on delete set null,   -- nullable - Avancé
    mode text not null,                   -- 'dictaphone' ou 'visio'
    titre text not null,
    date_debut timestamp not null,
    duree_secondes int,
    type_reunion text,                    -- classification LLM
    base_legale text not null,            -- 'consentement' ou 'interet_legitime'
    statut_traitement text not null,
    audio_purge boolean not null default false,
    date_purge_audio timestamp,           -- nullable
    nombre_participants int,              -- nullable - visio uniquement
    audio_url text,                       -- lien vers le fichier stocké (ex: Supabase Storage)
    audio_nom_fichier text,               -- nom original du fichier
    audio_taille_octets bigint,           -- taille en octets
    audio_mime_type text                  -- ex: 'audio/mpeg', 'audio/wav'
);

-- ============================================================
-- 4. ATTESTATION_ORGANISATEUR
-- ============================================================
create table attestation_organisateur (
    id uuid primary key default gen_random_uuid(),
    reunion_id uuid not null unique references reunion(id) on delete cascade,  -- relation 1-1
    utilisateur_id uuid not null references utilisateur(id) on delete cascade,
    horodatage timestamp not null default now(),
    version_texte text not null            -- traçabilité du texte attesté
);

-- ============================================================
-- 5. CONSENTEMENT_PARTICIPANT
-- ============================================================
create table consentement_participant (
    id uuid primary key default gen_random_uuid(),
    reunion_id uuid not null references reunion(id) on delete cascade,
    jeton text not null unique,            -- lien unique - aucune identité
    choix text not null,                   -- 'accepte' ou 'refuse'
    horodatage timestamp not null default now()
);

-- ============================================================
-- 6. LOCUTEUR
-- ============================================================
create table locuteur (
    id uuid primary key default gen_random_uuid(),
    reunion_id uuid not null references reunion(id) on delete cascade,
    label text not null,                   -- 'Locuteur A', 'Locuteur B'...
    nom_nominatif text                     -- nullable - Avancé, saisi manuellement
);

-- ============================================================
-- 7. SEGMENT
-- ============================================================
create table segment (
    id uuid primary key default gen_random_uuid(),
    reunion_id uuid not null references reunion(id) on delete cascade,
    locuteur_id uuid references locuteur(id) on delete set null,
    texte text not null,
    horodatage_debut float8 not null,
    horodatage_fin float8 not null,
    inaudible boolean not null default false  -- passage signalé, jamais inventé
);

-- ============================================================
-- 8. COMPTE_RENDU
-- ============================================================
create table compte_rendu (
    id uuid primary key default gen_random_uuid(),
    reunion_id uuid not null unique references reunion(id) on delete cascade,  -- relation 1-1
    resume text not null,
    date_generation timestamp not null default now(),
    modele_utilise text not null,          -- traçabilité
    version int not null default 1         -- incrémenté si régénération
);

-- ============================================================
-- 9. POINT_CLE
-- ============================================================
create table point_cle (
    id uuid primary key default gen_random_uuid(),
    compte_rendu_id uuid not null references compte_rendu(id) on delete cascade,
    contenu text not null,
    ordre int not null
);

-- ============================================================
-- 10. DECISION
-- ============================================================
create table decision (
    id uuid primary key default gen_random_uuid(),
    compte_rendu_id uuid not null references compte_rendu(id) on delete cascade,
    contenu text not null,
    ordre int not null
);

-- ============================================================
-- 11. ACTION
-- ============================================================
create table action (
    id uuid primary key default gen_random_uuid(),
    compte_rendu_id uuid not null references compte_rendu(id) on delete cascade,
    intitule text not null,
    responsable text,                      -- nullable
    echeance date                          -- nullable
);

-- ============================================================
-- 12. THEME
-- ============================================================
create table theme (
    id uuid primary key default gen_random_uuid(),
    nom text not null unique
);

-- ============================================================
-- 13. REUNION_THEME (table de liaison many-to-many)
-- ============================================================
create table reunion_theme (
    reunion_id uuid not null references reunion(id) on delete cascade,
    theme_id uuid not null references theme(id) on delete cascade,
    primary key (reunion_id, theme_id)
);

-- ============================================================
-- Index utiles sur les clés étrangères (perf)
-- ============================================================
create index idx_client_utilisateur on client(utilisateur_id);
create index idx_reunion_utilisateur on reunion(utilisateur_id);
create index idx_reunion_client on reunion(client_id);
create index idx_attestation_reunion on attestation_organisateur(reunion_id);
create index idx_consentement_reunion on consentement_participant(reunion_id);
create index idx_locuteur_reunion on locuteur(reunion_id);
create index idx_segment_reunion on segment(reunion_id);
create index idx_segment_locuteur on segment(locuteur_id);
create index idx_compte_rendu_reunion on compte_rendu(reunion_id);
create index idx_point_cle_compte_rendu on point_cle(compte_rendu_id);
create index idx_decision_compte_rendu on decision(compte_rendu_id);
create index idx_action_compte_rendu on action(compte_rendu_id);
create index idx_reunion_theme_theme on reunion_theme(theme_id);
