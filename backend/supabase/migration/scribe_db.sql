create extension if not exists "pgcrypto";

create table utilisateur (
    id uuid primary key references auth.users(id) on delete cascade,  
    email text not null unique,
    duree_retention_jours int not null,
    taux_horaire float8,                 
    date_creation timestamp not null default now()
);

create table client (
    id uuid primary key default gen_random_uuid(),
    utilisateur_id uuid not null references utilisateur(id) on delete cascade,
    nom text not null,
    date_creation timestamp not null default now(),
    date_dernier_contact timestamp       
);

create table reunion (
    id uuid primary key default gen_random_uuid(),
    utilisateur_id uuid not null references utilisateur(id) on delete cascade,
    client_id uuid references client(id) on delete set null,   
    mode text not null,                   
    titre text not null,
    date_debut timestamp not null,
    duree_secondes int,
    type_reunion text,                   
    base_legale text not null,           
    statut_traitement text not null,
    message_erreur text,                  -- message de l'exception si statut_traitement passe a erreur
    audio_purge boolean not null default false,
    date_purge_audio timestamp,           
    nombre_participants int,              
    audio_url text,                       
    audio_nom_fichier text,               
    audio_taille_octets bigint,           
    audio_mime_type text                  
);

create table attestation_organisateur (
    id uuid primary key default gen_random_uuid(),
    reunion_id uuid not null unique references reunion(id) on delete cascade, 
    utilisateur_id uuid not null references utilisateur(id) on delete cascade,
    horodatage timestamp not null default now(),
    version_texte text not null            
);

create table consentement_participant (
    id uuid primary key default gen_random_uuid(),
    reunion_id uuid not null references reunion(id) on delete cascade,
    jeton text not null unique,            
    choix text not null,                   
    horodatage timestamp not null default now()
);

create table locuteur (
    id uuid primary key default gen_random_uuid(),
    reunion_id uuid not null references reunion(id) on delete cascade,
    label text not null,                   
    nom_nominatif text                   
);


create table segment (
    id uuid primary key default gen_random_uuid(),
    reunion_id uuid not null references reunion(id) on delete cascade,
    locuteur_id uuid references locuteur(id) on delete set null,
    texte text not null,
    horodatage_debut float8 not null,
    horodatage_fin float8 not null,
    inaudible boolean not null default false  -- passage signalé, jamais inventé
);

create table compte_rendu (
    id uuid primary key default gen_random_uuid(),
    reunion_id uuid not null unique references reunion(id) on delete cascade,  -- relation 1-1
    resume text not null,
    date_generation timestamp not null default now(),
    modele_utilise text not null,          -- traçabilité
    version int not null default 1         -- incrémenté si régénération
);


create table point_cle (
    id uuid primary key default gen_random_uuid(),
    compte_rendu_id uuid not null references compte_rendu(id) on delete cascade,
    contenu text not null,
    ordre int not null
);


create table decision (
    id uuid primary key default gen_random_uuid(),
    compte_rendu_id uuid not null references compte_rendu(id) on delete cascade,
    contenu text not null,
    ordre int not null,
    segment_id uuid references segment(id) on delete set null  -- nullable, segment source
);


create table action (
    id uuid primary key default gen_random_uuid(),
    compte_rendu_id uuid not null references compte_rendu(id) on delete cascade,
    intitule text not null,
    responsable text,                      -- nullable
    echeance date,                         -- nullable
    segment_id uuid references segment(id) on delete set null  -- nullable, segment source
);


create table theme (
    id uuid primary key default gen_random_uuid(),
    nom text not null unique
);


create table reunion_theme (
    reunion_id uuid not null references reunion(id) on delete cascade,
    theme_id uuid not null references theme(id) on delete cascade,
    primary key (reunion_id, theme_id)
);


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
