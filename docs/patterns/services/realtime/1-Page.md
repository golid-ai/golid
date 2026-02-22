# Real-Time — 1-Page

**Thesis**: SSE for server-push. WebSockets for bidirectional.

---

## When to Use

| Pattern | Use Case |
|---------|----------|
| **SSE** | Notifications, feeds, dashboards |
| **WebSocket** | Chat, collaboration, games |
| **Polling** | Simple, low-frequency |

---

## SSE (Go)

```go
func SSEHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    flusher := w.(http.Flusher)

    for msg := range userChannel {
        fmt.Fprintf(w, "data: %s\n\n", msg)
        flusher.Flush()
    }
}
```

## SSE (SolidJS)

```typescript
const eventSource = new EventSource('/api/sse');
eventSource.onmessage = (e) => setData(JSON.parse(e.data));
eventSource.onerror = () => setTimeout(reconnect, 3000);
```

---

## WebSocket (Go)

```go
conn, _ := upgrader.Upgrade(w, r, nil)
go client.writePump()
client.readPump()
```

## WebSocket (SolidJS)

```typescript
const ws = new WebSocket('/ws/chat');
ws.onmessage = (e) => setMessages(prev => [...prev, JSON.parse(e.data)]);
ws.send(JSON.stringify({ type: 'message', text }));
```

---

## Cloud Run

- Max: 60 min (24h configurable)
- Idle: 15 min → send pings every 30s
- Always implement reconnection

---

## Checklist

- [ ] Reconnection logic
- [ ] Keep-alive pings (30s)
- [ ] Auth on connection
- [ ] Non-blocking broadcast
- [ ] Handle slow clients

---

*Full reference: [realtime.md](./realtime.md)*
