import { HandlerContext } from "$fresh/server.ts";

export const handler = async (
  req: Request,
  _ctx: HandlerContext,
): Promise<Response> => {
  const kv = await Deno.openKv();
  const lines = await req.json();
  const url = new URL(req.url);
  const club = url.searchParams.get("club")!;
  await kv.set(["lines", club], lines);
  // console.log("Wrote to db", club, lines);
  return new Response("ok");
};
