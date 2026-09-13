import { getKv } from "./kv.ts";
import { Club, Route } from "./types.ts";

export const listClubs = async (): Promise<Club[]> => {
  const kv = await getKv();
  const clubs: Club[] = [];

  for await (const entry of kv.list<Club>({ prefix: ["clubs"] })) {
    const slug = String(entry.key[1]);
    clubs.push({ slug, name: entry.value?.name ?? slug });
  }

  return clubs.sort((a, b) => a.name.localeCompare(b.name, "fr"));
};

export const clubExists = async (slug: string): Promise<boolean> => {
  const kv = await getKv();
  const entry = await kv.get<Club>(["clubs", slug]);
  return entry.value !== null;
};

export const setClub = async (slug: string, name: string): Promise<Club> => {
  const kv = await getKv();
  const club: Club = { slug, name };
  await kv.set(["clubs", slug], club);
  return club;
};

// Supprime le club : son entrée au registre et toutes ses voies.
export const deleteClub = async (slug: string): Promise<void> => {
  const kv = await getKv();
  await kv.delete(["clubs", slug]);
  await kv.delete(["lines", slug]);
};

// Nombre de voies d'un club, pour prévenir avant suppression.
export const countRoutes = async (slug: string): Promise<number> => {
  const kv = await getKv();
  const lines = await kv.get<Route[][]>(["lines", slug]);
  return (lines.value ?? []).flat().length;
};
