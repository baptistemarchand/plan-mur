CREATE TABLE club (
  id           INTEGER PRIMARY KEY,
  slug         TEXT    NOT NULL UNIQUE,
  name         TEXT    NOT NULL,
  lineCount    INTEGER NOT NULL DEFAULT 0,
  maxLines     INTEGER NOT NULL DEFAULT 16,
  passwordHash TEXT    NOT NULL,
  revision     INTEGER NOT NULL DEFAULT 0,
  createdAt    TEXT    NOT NULL,
  deletedAt    TEXT
);

CREATE TABLE route (
  id        TEXT    PRIMARY KEY,
  clubId    INTEGER NOT NULL REFERENCES club(id) ON DELETE CASCADE,
  lineIndex INTEGER NOT NULL,
  position  INTEGER NOT NULL,
  color     TEXT    NOT NULL CHECK (color IN (
              'blanc', 'gris', 'noir', 'rose', 'violet', 'bleu',
              'jaune', 'orange', 'rouge', 'vert', 'vert-2', 'beige'
            )),
  grade     TEXT    NOT NULL,
  setAt     TEXT,
  author    TEXT,
  toRemove  INTEGER NOT NULL DEFAULT 0,
  toOpen    INTEGER NOT NULL DEFAULT 0,
  deletedAt TEXT,
  updatedAt TEXT    NOT NULL
);

CREATE INDEX routeWall ON route (clubId, lineIndex, position);
