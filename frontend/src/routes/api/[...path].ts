/**
 * API Proxy Route
 *
 * Proxies all /api/* requests to the internal backend Cloud Run service.
 * This is the SolidStart/Nitro equivalent of an nginx proxy_pass.
 *
 * In production:
 *   - Frontend is public (--ingress=all)
 *   - Backend is internal (--ingress=internal)
 *   - This route forwards requests via VPC connector
 *
 * In dev:
 *   - Vite proxy handles /api → localhost:8080 (app.config.ts)
 *   - This route is not used
 */

import type { APIEvent } from "@solidjs/start/server";

// Backend URL: set via env var at deploy time, falls back to localhost for dev
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export async function GET(event: APIEvent) {
  return proxyRequest(event);
}

export async function POST(event: APIEvent) {
  return proxyRequest(event);
}

export async function PUT(event: APIEvent) {
  return proxyRequest(event);
}

export async function PATCH(event: APIEvent) {
  return proxyRequest(event);
}

export async function DELETE(event: APIEvent) {
  return proxyRequest(event);
}

export async function HEAD(event: APIEvent) {
  return proxyRequest(event);
}

async function proxyRequest(event: APIEvent): Promise<Response> {
  const { request } = event;

  // Reconstruct the target URL: /api/v1/auth/login → BACKEND_URL/api/v1/auth/login
  const url = new URL(request.url);
  const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

  // Forward headers, replacing Host with backend host
  const backendHost = new URL(BACKEND_URL).host;
  const headers = new Headers(request.headers);
  headers.set("Host", backendHost);
  headers.set("X-Forwarded-For", headers.get("x-forwarded-for") || "");
  headers.set("X-Forwarded-Proto", "https");
  // Remove headers that shouldn't be forwarded
  headers.delete("connection");

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD"
        ? request.body
        : undefined,
      // @ts-expect-error duplex is needed for streaming request bodies
      duplex: "half",
    });

    // Forward the response back with original headers
    const responseHeaders = new Headers(response.headers);
    // Remove hop-by-hop headers and encoding headers that don't apply
    // after Node.js fetch auto-decompresses the response body
    responseHeaders.delete("transfer-encoding");
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[API Proxy] Failed to reach backend:", error);
    return new Response(
      JSON.stringify({
        message: "Unable to reach the server. Please try again later.",
        code: "server_unreachable",
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
