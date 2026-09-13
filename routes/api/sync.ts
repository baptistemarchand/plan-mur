import { FreshContext } from "$fresh/server.ts";
import { clubExists } from "../../clubs.ts";

export const handler = async (
  req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  const kv = await Deno.openKv();
  const lines = await req.json();
  const url = new URL(req.url);
  const club = url.searchParams.get("club")!;
  if (!(await clubExists(club))) {
    return new Response(`Club inconnu : ${club}`, { status: 404 });
  }
  await kv.set(["lines", club], lines);
  // console.log("Wrote to db", club, lines);
  return new Response("ok");
};
