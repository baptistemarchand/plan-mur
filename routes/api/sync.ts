import { FreshContext } from "$fresh/server.ts";
import { clubExists } from "../../clubs.ts";
import { Route } from "../../types.ts";

type Body = {
  lines: Route[][];
  // Version du mur telle que l'éditeur l'a reçue au chargement.
  versionstamp: string | null;
};

export const handler = async (
  req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  const kv = await Deno.openKv();
  const { lines, versionstamp }: Body = await req.json();
  const url = new URL(req.url);
  const club = url.searchParams.get("club")!;

  if (!(await clubExists(club))) {
    return new Response(`Club inconnu : ${club}`, { status: 404 });
  }

  // On évite la double-édition en parallèle
  const result = await kv.atomic()
    .check({ key: ["lines", club], versionstamp })
    .set(["lines", club], lines)
    .commit();

  if (!result.ok) {
    return new Response("Le mur a été modifié ailleurs.", { status: 409 });
  }

  return Response.json({ versionstamp: result.versionstamp });
};
