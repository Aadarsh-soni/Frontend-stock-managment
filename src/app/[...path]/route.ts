// src/app/api/[...path]/route.ts
import { NextRequest } from "next/server";

export const runtime = "edge"; // faster + no serverless cold starts on Vercel

// Set this in Vercel Project Settings → Environment Variables
const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE || "http://localhost:3000/api";

// Map all HTTP verbs to the same handler
export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS };

/**
 * Proxies any request hitting /api/* on the frontend to your backend API.
 * Example:
 *   Frontend  ->  /api/auth/signup
 *   Proxies to  ->  ${BACKEND_API_BASE}/auth/signup
 */
async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  // Build target URL
  const targetUrl = `${BACKEND_API_BASE}/${(params.path || []).join("/")}${req.nextUrl.search}`;

  // Clone headers but drop hop-by-hop/forbidden ones
  const outgoingHeaders = new Headers(req.headers);
  outgoingHeaders.delete("host");
  outgoingHeaders.delete("x-forwarded-host");
  outgoingHeaders.delete("x-forwarded-proto");

  const init: RequestInit = {
    method: req.method,
    headers: outgoingHeaders,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
    redirect: "manual",
  };

  const resp = await fetch(targetUrl, init);

  // Pass through body + status + headers (but avoid setting disallowed headers)
  const passthroughHeaders = new Headers(resp.headers);
  passthroughHeaders.delete("content-encoding");
  passthroughHeaders.delete("transfer-encoding");

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: passthroughHeaders,
  });
}