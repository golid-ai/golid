# Real-Time Messaging Patterns

**Thesis**: WebSockets for bidirectional, SSE for server-push. Choose based on need.

**Refrain**: Handle reconnection. Authenticate connections. Don't overuse.

> *1-page summary: [1-Page.md](./1-Page.md)*

---

## When to Use What

| Pattern | Use Case | Complexity |
|---------|----------|------------|
| **Polling** | Low-frequency updates, simple | Low |
| **SSE** | Server → Client only (notifications, feeds) | Medium |
| **WebSockets** | Bidirectional (chat, games, collaboration) | High |
| **WebRTC** | Peer-to-peer (video, audio) | Very High |

```
Polling:     Client ──────────────────► Server (repeated)
SSE:         Client ◄────────────────── Server (one-way stream)
WebSocket:   Client ◄──────────────────► Server (bidirectional)
```

---

## Server-Sent Events (SSE)

### Go Server

```go
func SSEHandler(w http.ResponseWriter, r *http.Request) {
    // Set headers for SSE
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")
    w.Header().Set("Access-Control-Allow-Origin", "*")

    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "SSE not supported", http.StatusInternalServerError)
        return
    }

    // Get user from auth
    userID := r.Context().Value("userID").(string)
    
    // Create channel for this client
    messageChan := make(chan string)
    clients.Add(userID, messageChan)
    defer clients.Remove(userID)

    // Send initial connection message
    fmt.Fprintf(w, "event: connected\ndata: {\"status\": \"ok\"}\n\n")
    flusher.Flush()

    for {
        select {
        case msg := <-messageChan:
            fmt.Fprintf(w, "event: message\ndata: %s\n\n", msg)
            flusher.Flush()
        case <-r.Context().Done():
            return
        }
    }
}

// Broadcast to user
func SendToUser(userID, eventType string, data interface{}) {
    jsonData, _ := json.Marshal(data)
    if ch := clients.Get(userID); ch != nil {
        ch <- string(jsonData)
    }
}
```

### Client Manager

```go
type ClientManager struct {
    mu      sync.RWMutex
    clients map[string]chan string
}

func NewClientManager() *ClientManager {
    return &ClientManager{
        clients: make(map[string]chan string),
    }
}

func (m *ClientManager) Add(userID string, ch chan string) {
    m.mu.Lock()
    defer m.mu.Unlock()
    m.clients[userID] = ch
}

func (m *ClientManager) Remove(userID string) {
    m.mu.Lock()
    defer m.mu.Unlock()
    delete(m.clients, userID)
}

func (m *ClientManager) Get(userID string) chan string {
    m.mu.RLock()
    defer m.mu.RUnlock()
    return m.clients[userID]
}

func (m *ClientManager) Broadcast(data string) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    for _, ch := range m.clients {
        select {
        case ch <- data:
        default: // Don't block if client is slow
        }
    }
}
```

### SolidJS Client

```typescript
import { createSignal, onCleanup, onMount } from 'solid-js';

export function useSSE<T>(url: string) {
  const [data, setData] = createSignal<T | null>(null);
  const [connected, setConnected] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  let eventSource: EventSource | null = null;
  let reconnectTimeout: number;

  const connect = () => {
    eventSource = new EventSource(url, { withCredentials: true });

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.addEventListener('message', (e) => {
      try {
        setData(JSON.parse(e.data));
      } catch {
        setData(e.data as T);
      }
    });

    eventSource.onerror = () => {
      setConnected(false);
      setError('Connection lost');
      eventSource?.close();
      
      // Reconnect after 3 seconds
      reconnectTimeout = setTimeout(connect, 3000);
    };
  };

  onMount(connect);

  onCleanup(() => {
    eventSource?.close();
    clearTimeout(reconnectTimeout);
  });

  return { data, connected, error };
}

// Usage
function Notifications() {
  const { data, connected } = useSSE<Notification>('/api/sse');

  return (
    <div>
      <Show when={!connected()}>
        <span class="text-yellow-500">Reconnecting...</span>
      </Show>
      <Show when={data()}>
        <NotificationToast notification={data()!} />
      </Show>
    </div>
  );
}
```

---

## WebSockets

### Go Server (gorilla/websocket)

```go
import "github.com/gorilla/websocket"

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        // Validate origin in production
        return true
    },
}

func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    defer conn.Close()

    userID := r.Context().Value("userID").(string)
    client := &Client{conn: conn, userID: userID, send: make(chan []byte, 256)}
    
    hub.register <- client
    defer func() { hub.unregister <- client }()

    // Read and write in separate goroutines
    go client.writePump()
    client.readPump()
}

type Client struct {
    conn   *websocket.Conn
    userID string
    send   chan []byte
}

func (c *Client) readPump() {
    defer c.conn.Close()
    
    c.conn.SetReadLimit(512)
    c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
    c.conn.SetPongHandler(func(string) error {
        c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
        return nil
    })

    for {
        _, message, err := c.conn.ReadMessage()
        if err != nil {
            break
        }
        
        // Handle incoming message
        hub.broadcast <- message
    }
}

func (c *Client) writePump() {
    ticker := time.NewTicker(30 * time.Second)
    defer func() {
        ticker.Stop()
        c.conn.Close()
    }()

    for {
        select {
        case message, ok := <-c.send:
            c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
            if !ok {
                c.conn.WriteMessage(websocket.CloseMessage, []byte{})
                return
            }
            c.conn.WriteMessage(websocket.TextMessage, message)
            
        case <-ticker.C:
            c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
            if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                return
            }
        }
    }
}
```

### Hub (Connection Manager)

```go
type Hub struct {
    clients    map[*Client]bool
    broadcast  chan []byte
    register   chan *Client
    unregister chan *Client
}

func NewHub() *Hub {
    return &Hub{
        clients:    make(map[*Client]bool),
        broadcast:  make(chan []byte),
        register:   make(chan *Client),
        unregister: make(chan *Client),
    }
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            h.clients[client] = true
            
        case client := <-h.unregister:
            if _, ok := h.clients[client]; ok {
                delete(h.clients, client)
                close(client.send)
            }
            
        case message := <-h.broadcast:
            for client := range h.clients {
                select {
                case client.send <- message:
                default:
                    close(client.send)
                    delete(h.clients, client)
                }
            }
        }
    }
}
```

### SolidJS WebSocket Client

```typescript
import { createSignal, onCleanup } from 'solid-js';

export function useWebSocket<T>(url: string) {
  const [messages, setMessages] = createSignal<T[]>([]);
  const [connected, setConnected] = createSignal(false);
  
  let ws: WebSocket | null = null;
  let reconnectTimeout: number;

  const connect = () => {
    ws = new WebSocket(url);

    ws.onopen = () => setConnected(true);
    
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages(prev => [...prev, data]);
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimeout = setTimeout(connect, 3000);
    };
  };

  const send = (data: unknown) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  connect();

  onCleanup(() => {
    ws?.close();
    clearTimeout(reconnectTimeout);
  });

  return { messages, connected, send };
}

// Usage: Chat
function Chat() {
  const { messages, connected, send } = useWebSocket<ChatMessage>('/ws/chat');
  const [input, setInput] = createSignal('');

  const handleSend = () => {
    send({ type: 'message', text: input() });
    setInput('');
  };

  return (
    <div>
      <For each={messages()}>
        {(msg) => <div>{msg.text}</div>}
      </For>
      <input value={input()} onInput={(e) => setInput(e.target.value)} />
      <button onClick={handleSend} disabled={!connected()}>Send</button>
    </div>
  );
}
```

---

## Cloud Run Considerations

```
⚠️ Cloud Run has WebSocket/SSE limitations:
- Max connection time: 60 minutes (configurable to 24h)
- Idle timeout: 15 minutes (send pings)
- No sticky sessions by default
```

### Solutions

1. **Keep-alive pings** (every 30s)
2. **Client reconnection logic**
3. **Use Cloud Run with session affinity** for WebSockets
4. **Consider Pub/Sub + SSE** for scalable notifications

---

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| WebSocket for simple notifications | Use SSE |
| No reconnection logic | Always reconnect |
| Blocking broadcast | Non-blocking with select/default |
| No authentication | Auth on connection |
| Long-polling when SSE works | Use SSE |

---

## Cross-References

| Topic | See Also |
|-------|----------|
| Go patterns | [1-Page](../../go/1-Page.md) |
| SolidJS hooks | [1-Page](../../solidjs/1-Page.md) |
