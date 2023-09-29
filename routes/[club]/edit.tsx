import { RouteContext } from "$fresh/server.ts";
import Editor from "../../islands/Editor.tsx";
import { Route } from "../../types.ts";

export default async function Mur(_req: Request, ctx: RouteContext) {
  const kv = await Deno.openKv();
  const result = await kv.get<Route[][]>(["lines", ctx.params.club]);
  const lines = result.value ?? [];
  // console.log(lines);
  // for (const routes of lines) {
  //   for (const route of routes) {
  //     const { setAtMonth, setAtYear } = route;
  //     route.setAtMonth = setAtYear as any;
  //     route.setAtYear = setAtMonth;
  //   }
  // }
  // console.log(lines);
  // await kv.set(["lines", ctx.params.club], lines);

  return (
    <div>
      <Editor lines={lines} />
    </div>
  );
}
