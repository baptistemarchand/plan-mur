import { RouteContext } from "$fresh/server.ts";
import { demo } from "../../demo.ts";
import Editor from "../../islands/Editor.tsx";
import { Route } from "../../types.ts";

export default async function Mur(_req: Request, ctx: RouteContext) {
  const kv = await Deno.openKv();
  const result = await kv.get<Route[][]>(["lines", ctx.params.club]);
  const lines = result.value ?? demo;

  return (
    <div>
      <Editor lines={lines} club={ctx.params.club} />
    </div>
  );
}
