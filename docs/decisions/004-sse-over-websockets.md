# ADR-004: SSE over WebSockets

**Status:** Accepted
**Date:** 2026-02-28
**Decision makers:** Steven Frank

## Context

Golid needs server-to-client push for real-time notifications. The implementation uses Server-Sent Events (SSE).

**Hub** (`backend/internal/service/sse/sse.go`): `SSEHub` is an in-memory singleton managing per-user channel sets. Each user can have up to 5 concurrent SSE connections. Channels are buffered at 16 events. `Send()` delivers events to a specific user's channels; `Broadcast()` fans out to all connected users. Sends are non-blocking — if a client's buffer is full, the event is dropped and logged.

**Auth** (`backend/internal/service/sse/sse.go`): `EventSource` can't set `Authorization` headers, so SSE uses one-time tickets instead of JWTs in URLs. `CreateTicket()` generates a 256-bit random ticket with a configurable TTL. `ValidateTicket()` burns the ticket on use (single-use).

**Stream handler** (`backend/internal/handler/sse.go`): `Stream()` validates the ticket, subscribes to the hub, sets `text/event-stream` headers, and enters a select loop. A keepalive comment is sent every 30 seconds to keep the connection alive through proxies and Cloud Run's idle timeout.

**Shutdown** (`backend/internal/service/sse/sse.go`): `Shutdown()` closes all client channels and clears the ticket map. Shutdown order: drain HTTP → shut down SSE hub → close DB pool.

## Decision

**Use Server-Sent Events (SSE) for all server-to-client push communication.**

## Alternatives Considered

1. **WebSockets (bidirectional)** — full-duplex communication. Golid only needs server-to-client push; client-to-server traffic goes through the REST API.
2. **Long polling** — high request overhead, latency bounded by poll interval.
3. **External push service (Firebase, Pusher, Ably)** — adds runtime dependency, cost, and data residency concerns.

## Rationale

Golid's traffic shape is strictly unidirectional. SSE inherits the existing HTTP middleware stack (auth, logging, CORS), auto-reconnects via the browser `EventSource` API, and works on Cloud Run without WebSocket-specific load balancer configuration.

The accepted cost: any future bidirectional real-time feature (e.g. chat) would need a parallel transport or a revisit of this decision.

## Revisit Conditions

- If a real-time chat or collaborative editing feature is added.
- If SSE breaks under the load balancer at >10k concurrent connections per region (hub is in-process; scale-out requires a pub/sub layer — see `docs/architecture.md`).
- If deployment moves to a runtime that doesn't support long-lived HTTP responses.
