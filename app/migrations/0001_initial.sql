-- Les fichiers de ce dossier sont la source de vérité du schéma : Kysely ne
-- génère pas de DDL. Ils s'appliquent tels quels à D1 comme à un SQLite local.

CREATE TABLE club (
  id            INTEGER PRIMARY KEY,
  slug          TEXT    NOT NULL UNIQUE,
  name          TEXT    NOT NULL,
  -- Lignes que le mur compte aujourd'hui, y compris celles encore vides :
  -- une ligne ajoutée dans l'éditeur doit survivre au rechargement.
  line_count    INTEGER NOT NULL DEFAULT 0,
  -- Plafond que l'éditeur fait respecter. Remplace le 24/16 codé en dur.
  max_lines     INTEGER NOT NULL DEFAULT 16,
  password_hash TEXT    NOT NULL,
  revision      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL
);

CREATE TABLE route (
  id         TEXT    PRIMARY KEY,
  club_id    INTEGER NOT NULL REFERENCES club(id) ON DELETE CASCADE,
  line_index INTEGER NOT NULL,
  position   INTEGER NOT NULL,
  color      TEXT    NOT NULL CHECK (color IN (
               'blanc', 'gris', 'noir', 'rose', 'violet', 'bleu',
               'jaune', 'orange', 'rouge', 'vert', 'vert-2', 'beige'
             )),
  grade      TEXT    NOT NULL,
  set_at     TEXT,
  author     TEXT,
  to_remove  INTEGER NOT NULL DEFAULT 0,
  to_open    INTEGER NOT NULL DEFAULT 0,
  deleted    INTEGER NOT NULL DEFAULT 0,
  -- Nul pour les voies importées : l'historique Deno KV ne portait pas la date
  -- de suppression, et l'inventer donnerait une donnée fausse.
  deleted_at TEXT,
  updated_at TEXT    NOT NULL
);

CREATE INDEX route_wall ON route (club_id, line_index, position);
