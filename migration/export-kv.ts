// Dernier lecteur de Deno KV du dépôt, gardé jusqu'à la bascule : la prod
// tourne encore sur KV, et son contenu bougera d'ici là. Autonome, pour ne
// rien devoir au code Fresh supprimé.
//
//   deno task export-kv                            base locale
//   KV_URL=... DENO_KV_ACCESS_TOKEN=... deno task export-kv    prod
//
// À supprimer une fois la bascule faite et la base KV fermée.

type Entry<T> = { key: string[]; value: T };

// Forme brute de KV, volontairement lâche : ce fichier ne normalise rien, il
// photographie. Les contrôles se font en aval, dans scripts/import-kv.ts.
type RawRoute = Record<string, unknown>;
type RawClub = { slug: string; name: string };

type Dump = {
  exportedAt: string;
  source: string;
  clubs: Entry<RawClub>[];
  lines: Entry<RawRoute[][]>[];
};

const kvTarget = (): string => Deno.env.get("KV_URL") ?? "base locale";

const kv = await Deno.openKv(Deno.env.get("KV_URL"));

console.log(`Base ciblée : ${kvTarget()}`);

const clubs: Entry<RawClub>[] = [];
const lines: Entry<RawRoute[][]>[] = [];

for await (const entry of kv.list<RawClub>({ prefix: ["clubs"] })) {
  clubs.push({ key: entry.key.map(String), value: entry.value });
}
for await (const entry of kv.list<RawRoute[][]>({ prefix: ["lines"] })) {
  lines.push({ key: entry.key.map(String), value: entry.value });
}

const data: Dump = {
  exportedAt: new Date().toISOString(),
  source: kvTarget(),
  clubs,
  lines,
};

const stamp = data.exportedAt.replace(/[:.]/g, "-");
const path = Deno.args[0] ?? `../export/kv-${stamp}.json`;

await Deno.mkdir("../export", { recursive: true });
await Deno.writeTextFile(path, JSON.stringify(data, null, 2));

const routeCount = data.lines.reduce((n, e) => n + e.value.flat().length, 0);
console.log(
  `${data.clubs.length} clubs, ${routeCount} voies exportées dans ${path}`,
);

kv.close();
