import { getKv, kvTarget } from "./kv.ts";
import { Club, Route } from "./types.ts";

type Entry<T> = { key: string[]; value: T };

type Dump = {
  exportedAt: string;
  source: string;
  clubs: Entry<Club>[];
  lines: Entry<Route[][]>[];
};

// Dump brut, sans aucune normalisation : ce fichier est la sauvegarde de
// référence et le jeu de test de la réécriture. Toute transformation se fait
// en aval, côté import.
const dump = async (): Promise<Dump> => {
  const kv = await getKv();
  const clubs: Entry<Club>[] = [];
  const lines: Entry<Route[][]>[] = [];

  for await (const entry of kv.list<Club>({ prefix: ["clubs"] })) {
    clubs.push({ key: entry.key.map(String), value: entry.value });
  }
  for await (const entry of kv.list<Route[][]>({ prefix: ["lines"] })) {
    lines.push({ key: entry.key.map(String), value: entry.value });
  }

  return {
    exportedAt: new Date().toISOString(),
    source: kvTarget(),
    clubs,
    lines,
  };
};

console.log(`Base ciblée : ${kvTarget()}`);

const data = await dump();
const stamp = data.exportedAt.replace(/[:.]/g, "-");
const path = Deno.args[0] ?? `export/kv-${stamp}.json`;

await Deno.mkdir("export", { recursive: true });
await Deno.writeTextFile(path, JSON.stringify(data, null, 2));

const routeCount = data.lines.reduce((n, e) => n + e.value.flat().length, 0);
console.log(
  `${data.clubs.length} clubs, ${routeCount} voies exportées dans ${path}`,
);

(await getKv()).close();
