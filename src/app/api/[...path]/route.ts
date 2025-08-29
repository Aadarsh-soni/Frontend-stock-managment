// src/app/api/[...path]/route.ts
import { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Set in Vercel env vars
const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ?? "http://localhost:3000/api";

// Re-export the same handler for all verbs
export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS };

async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> } // <- Next 15.5 typing
) {
  const { path } = await ctx.params; // <- await the promise
  const target = `${BACKEND_API_BASE}/${(path ?? []).join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-proto");

  const init: RequestInit = {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
    redirect: "manual",
  };

  const resp = await fetch(target, init);

  const outHeaders = new Headers(resp.headers);
  outHeaders.delete("content-encoding");
  outHeaders.delete("transfer-encoding");

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: outHeaders,
  });
}