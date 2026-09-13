import { FreshContext } from "$fresh/server.ts";
import { clubExists } from "../../clubs.ts";

// Un slug absent du registre des clubs n'existe pas : 404.
export const handler = async (
  _req: Request,
  ctx: FreshContext,
): Promise<Response> => {
  if (ctx.destination === "route" && !(await clubExists(ctx.params.club))) {
    return ctx.renderNotFound();
  }
  return await ctx.next();
};
