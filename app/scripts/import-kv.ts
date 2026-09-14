// Transforme un dump Deno KV (produit par export-kv.ts à la racine) en fichier
// SQL d'insertion. On passe par un .sql plutôt que par une écriture directe :
// à cette volumétrie il se relit intégralement avant exécution, se versionne,
// et se rejoue à l'identique en local comme en distant.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { customAlphabet } from 'nanoid';
import { colors, type Color } from '../src/lib/domain/colors.ts';
import { UNKNOWN_DELETION_DATE } from '../src/lib/server/db/schema.ts';

type RawRoute = {
	id?: string;
	color: string;
	grade: string;
	setAt?: string;
	author?: string;
	toRemove?: boolean;
	deleted?: boolean;
	toOpen?: boolean;
};

type Dump = {
	exportedAt: string;
	clubs: { key: string[]; value: { slug: string; name: string } }[];
	lines: { key: string[]; value: RawRoute[][] }[];
};

// Même alphabet et même longueur que utils.ts côté Fresh.
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 7);

const MAX_LINES: Record<string, number> = { faverges: 24 };
const DEFAULT_MAX_LINES = 16;

const quote = (value: string | null): string =>
	value === null ? 'NULL' : `'${value.replace(/'/g, "''")}'`;

const [input, output = 'seeds/import.sql'] = process.argv.slice(2);
if (!input) {
	console.error('Usage: node scripts/import-kv.ts <dump.json> [sortie.sql]');
	process.exit(1);
}

const dump: Dump = JSON.parse(readFileSync(input, 'utf8'));
const linesBySlug = new Map(dump.lines.map((entry) => [entry.key[1], entry.value]));
const warnings: string[] = [];
const seenIds = new Set<string>();
const statements: string[] = [];

dump.clubs.forEach((entry, index) => {
	const slug = entry.key[1];
	const clubId = index + 1;
	const name = entry.value?.name ?? slug;

	const lines = linesBySlug.get(slug) ?? [];

	statements.push(
		`INSERT INTO club (id, slug, name, lineCount, maxLines, passwordHash, revision, createdAt, deletedAt)\n` +
			`VALUES (${clubId}, ${quote(slug)}, ${quote(name)}, ` +
			`${lines.length}, ${MAX_LINES[slug] ?? DEFAULT_MAX_LINES}, ${quote('!')}, 0, ${quote(dump.exportedAt)}, NULL);`
	);

	lines.forEach((line, lineIndex) => {
		line.forEach((route, position) => {
			let id = route.id;
			if (!id || seenIds.has(id)) {
				id = nanoid();
				warnings.push(`${slug} ligne ${lineIndex + 1} : identifiant absent ou dupliqué, remplacé`);
			}
			seenIds.add(id);

			if (!colors.includes(route.color as Color)) {
				warnings.push(`${slug} ligne ${lineIndex + 1} : couleur inconnue "${route.color}"`);
			}

			// Seule normalisation de fond : la casse de setAt était incohérente
			// alors que le filtre PDF comparait en minuscules.
			const setAt = route.setAt?.toLowerCase().trim() || null;
			const author = route.author?.trim() || null;

			// Deno KV ne portait qu'un booléen : l'époque Unix marque la
			// suppression sans prétendre en connaître la date.
			const deletedAt = route.deleted ? quote(UNKNOWN_DELETION_DATE) : 'NULL';

			statements.push(
				`INSERT INTO route (id, clubId, lineIndex, position, color, grade, setAt, author, toRemove, toOpen, deletedAt, updatedAt)\n` +
					`VALUES (${quote(id)}, ${clubId}, ${lineIndex}, ${position}, ${quote(route.color)}, ` +
					`${quote(route.grade)}, ${quote(setAt)}, ${quote(author)}, ${route.toRemove ? 1 : 0}, ` +
					`${route.toOpen ? 1 : 0}, ${deletedAt}, ${quote(dump.exportedAt)});`
			);
		});
	});
});

const header = [
	`-- Généré par scripts/import-kv.ts depuis ${input}`,
	`-- Export du ${dump.exportedAt}`,
	`-- Les mots de passe valent '!' : aucun ne peut correspondre, à définir avant ouverture.`,
	''
].join('\n');

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${header}${statements.join('\n')}\n`);

console.log(`${dump.clubs.length} clubs, ${statements.length - dump.clubs.length} voies -> ${output}`);
for (const warning of [...new Set(warnings)]) {
	console.warn(`  attention : ${warning}`);
}
