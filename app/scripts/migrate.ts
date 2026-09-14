// Applique les migrations SQL à une base SQLite locale.
// D1 a son propre mécanisme côté wrangler : les fichiers de migrations/ sont
// l'artefact commun, ce script n'est que le runner de la cible Node.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import SQLite from 'better-sqlite3';

const path = process.env.DATABASE_PATH ?? 'local.db';
const db = new SQLite(path);
db.pragma('foreign_keys = ON');
db.exec('CREATE TABLE IF NOT EXISTS migration (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');

const applied = new Set(
	db
		.prepare('SELECT name FROM migration')
		.all()
		.map((row) => (row as { name: string }).name)
);

// Préfixe numéroté obligatoire : un fichier déposé là par erreur (un seed,
// un export) ne doit pas pouvoir s'appliquer comme une migration.
const files = readdirSync('migrations')
	.filter((file) => /^\d{4}_.+\.sql$/.test(file))
	.sort();

let count = 0;
for (const file of files) {
	if (applied.has(file)) continue;
	db.transaction(() => {
		db.exec(readFileSync(join('migrations', file), 'utf8'));
		db.prepare('INSERT INTO migration (name, applied_at) VALUES (?, ?)').run(
			file,
			new Date().toISOString()
		);
	})();
	console.log(`appliquée : ${file}`);
	count += 1;
}

console.log(count === 0 ? `${path} est à jour.` : `${count} migration(s) appliquée(s) sur ${path}.`);
