import { RouteContext } from "$fresh/server.ts";
import { demo } from "../../demo.ts";
import Editor from "../../islands/Editor.tsx";
import { Route } from "../../types.ts";

export default async function Mur(_req: Request, ctx: RouteContext) {
  const kv = await Deno.openKv();
  const result = await kv.get<Route[][]>(["lines", ctx.params.club]);
  const lines = result.value ?? demo;
  // console.log(lines);
  // for (const routes of lines) {
  //   for (const route of routes) {
  //     route.author = route.author?.toLowerCase();
  //   }
  // }
  // console.log(lines);
  // await kv.set(["lines", ctx.params.club], lines);

  return (
    <div>
      <Editor lines={lines} club={ctx.params.club} />
    </div>
  );
}
