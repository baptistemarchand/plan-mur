-- Les fichiers de ce dossier sont la source de vérité du schéma : Kysely ne
-- génère pas de DDL. Ils s'appliquent tels quels à D1 comme à un SQLite local.

CREATE TABLE club (
  id            INTEGER PRIMARY KEY,
  slug          TEXT    NOT NULL UNIQUE,
  name          TEXT    NOT NULL,
  line_count    INTEGER NOT NULL DEFAULT 0,
  max_lines     INTEGER NOT NULL DEFAULT 16,
  password_hash TEXT    NOT NULL,
  revision      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL,
  deleted_at    TEXT
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
  deleted_at TEXT,
  updated_at TEXT    NOT NULL
);

CREATE INDEX route_wall ON route (club_id, line_index, position);
