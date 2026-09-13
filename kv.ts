let connection: Promise<Deno.Kv> | undefined;

export const kvTarget = (): string => Deno.env.get("KV_URL") ?? "base locale";

export const getKv = (): Promise<Deno.Kv> => {
  connection ??= Deno.openKv(Deno.env.get("KV_URL"));
  return connection;
};
