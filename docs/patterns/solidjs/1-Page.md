# SolidJS — 1-Page

**Thesis**: Fine-grained reactivity without the virtual DOM. Runs once, updates surgically.

**Refrain**: Call signals as functions. Don't destructure props. Batch updates.

---

### Mental Model

```
COMPONENT RUNS ONCE
├── Setup code runs at mount (not on every render)
├── Only reactive expressions re-run
├── JSX compiles to real DOM operations
└── No diffing, no reconciliation
```

### From Svelte (Quick Map)

| Svelte 5            | SolidJS                             |
| ------------------- | ----------------------------------- |
| `let x = $state(0)` | `const [x, setX] = createSignal(0)` |
| `x`                 | `x()` ← call it!                    |
| `x = 5`             | `setX(5)`                           |
| `$derived(expr)`    | `createMemo(() => expr)`            |
| `$effect`           | `createEffect`                      |
| `{#if}`             | `<Show when={}>`                    |
| `{#each}`           | `<For each={}>`                     |

### The 6 Gotchas

| Trap                         | Why It Breaks                                         | Fix                                                 |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| `const { name } = props`     | Loses reactivity                                      | Access `props.name` directly                        |
| `const name = props.name`    | Reads once                                            | Keep in JSX or memo                                 |
| Signal in callback           | Captures stale                                        | Use `untrack` or pass setter                        |
| `<For>` with primitives      | Index changes cause issues                            | Use `<Index>` instead                               |
| createSignal in render       | Recreates on every call                               | Lift to component top                               |
| `createResource` + route nav | Resource resolves after unmount, orphaned computation | Use signals + `onMount` + `alive` guard (see below) |

### Control Flow

```tsx
<Show when={user()} fallback={<Login />}>
  {(u) => <Profile user={u()} />}
</Show>

<For each={items()}>{(item) => <Card data={item} />}</For>

<Switch>
  <Match when={loading()}><Spinner /></Match>
  <Match when={error()}><Error /></Match>
  <Match when={data()}>{(d) => <Content data={d()} />}</Match>
</Switch>
```

### Store vs Signal vs Context

| State Scope          | Solution                     |
| -------------------- | ---------------------------- |
| Single component     | `createSignal`               |
| Nested objects       | `createStore` + path updates |
| Component subtree    | Context Provider             |
| Global (auth, theme) | Module-level store           |

### Data Fetching

**Official recommendation:** `createAsync` + `query` (from `@solidjs/router`):

```tsx
import { createAsync, query } from "@solidjs/router";

const getJobs = query(async () => {
  return fetch("/api/jobs").then((r) => r.json());
}, "jobs");

export const route = { preload: () => getJobs() };

export default function JobsPage() {
  const jobs = createAsync(() => getJobs());
  return <For each={jobs()}>{(job) => <JobCard job={job} />}</For>;
}
```

> Note: `cache` was renamed to `query` in `@solidjs/router` v0.15. Use `query` going forward.

**Golid project pattern:** `onMount` + `createSignal` + `alive` guard + `batch`:

The Golid codebase uses manual signals for all page data. This avoids `createResource`/Suspense issues and gives full control over loading/error states.

```tsx
export default function MyPage() {
  const [data, setData] = createSignal(null);
  const [loading, setLoading] = createSignal(true);

  let alive = true;
  onCleanup(() => {
    alive = false;
  });

  onMount(async () => {
    try {
      const result = await fetchData();
      if (!alive) return;
      batch(() => {
        setData(result);
        setLoading(false);
      });
    } catch (err) {
      if (!alive) return;
      batch(() => {
        setError(getErrorMessage(err));
        setLoading(false);
      });
    }
  });

  return (
    <Switch>
      <Match when={loading()}>
        <Spinner />
      </Match>
      <Match when={error()}>
        <ErrorCard />
      </Match>
      <Match when={data()}>{(d) => <Content data={d()} />}</Match>
    </Switch>
  );
}
```

**Why not `createResource`?** It internally writes to its signal when the promise resolves — you cannot cancel this. If the user navigates away before resolution, the write fires into a disposed component tree, causing "computations created outside a createRoot" warnings. The `alive` guard pattern avoids this entirely.

Also avoid reactive expressions in `<Title>` — the `@solidjs/meta` head manager
lives outside the component tree and creates orphaned computations on unmount.
Use static titles or pre-compute as `createMemo`.

### SolidStart SSR

```tsx
import { createAsync, query } from '@solidjs/router';

// query (formerly cache) wraps async + deduplicates
const getItems = query(async () => {
  'use server';
  return db.items.findMany();
}, 'items');

export const route = { preload: () => getItems() };

export default function Page() {
  const items = createAsync(() => getItems());
  return <For each={items()}>{...}</For>;
}
```

### Performance

| Do                            | Don't                   |
| ----------------------------- | ----------------------- |
| Access `props.x` in JSX       | Destructure props       |
| `createMemo` for expensive    | Compute inline          |
| `batch()` multiple updates    | Update one by one       |
| `lazy()` for heavy components | Import everything       |
| `<Index>` for primitives      | `<For>` with primitives |

### API Pattern (Manual Client)

```ts
// app.config.ts — Proxy /api to Go backend (inside vite() function)
server: {
  proxy: {
    '/api': { target: 'http://localhost:8080', changeOrigin: true }
  }
}
```

```tsx
// lib/api.ts — Hand-written, typed helpers
export const get = <T>(endpoint: string) => api<T>(endpoint, { method: "GET" });
export const post = <T>(endpoint: string, body?: unknown) => api<T>(endpoint, { method: "POST", body });

export const jobsApi = {
  list: (params?) => get<JobListResult>(`/jobs${buildQuery(params)}`),
  getById: (id: string) => get<Job>(`/jobs/${id}`),
  create: (data: CreateJobInput) => post<Job>("/jobs", data),
};
```

### Error Handling

```tsx
// ErrorBoundary (wrap around data-fetching components)
<ErrorBoundary
  fallback={(err, reset) => (
    <div>
      <p>{err.message}</p>
      <button onClick={reset}>Retry</button>
    </div>
  )}
>
  <DataComponent />
</ErrorBoundary>;

// API errors — check code, map to form
if (isAPIError(err) && err.code === "VALIDATION_ERROR") {
  Object.entries(err.details).forEach(([field, msg]) =>
    form.setError(field, msg),
  );
}
```

### Form Basics

```tsx
const form = createForm({ email: "", password: "" }, validate);

<form onSubmit={form.handleSubmit(async (v) => await api.login(v))}>
  <input
    value={form.field("email").value}
    onInput={form.field("email").onInput}
  />
  <Show when={form.errors().email}>
    <span>{form.errors().email}</span>
  </Show>
  <button disabled={form.isSubmitting()}>Submit</button>
</form>;
```

### Quick Reference

```tsx
// Signal
const [val, setVal] = createSignal(0);

// Memo
const doubled = createMemo(() => val() * 2);

// Effect with cleanup
createEffect(() => {
  window.addEventListener('resize', handler);
  onCleanup(() => window.removeEventListener('resize', handler));
});

// Props
const merged = mergeProps({ default: 'value' }, props);
const [local, rest] = splitProps(props, ['class']);

// Testing
npm install -D vitest @solidjs/testing-library jsdom
npx vitest run
```

### Third-Party Libraries (D3, AG-Grid, etc.)

```tsx
// SolidJS makes this EASY — component runs once
function D3Chart(props) {
  let ref;

  onMount(() => {
    // D3 takes over the ref, no conflict with virtual DOM
    d3.select(ref).append('svg')...
  });

  createEffect(() => {
    // Update chart when data changes
    d3.select(ref).selectAll('rect').data(props.data)...
  });

  return <div ref={ref} />;
}
```

### When to Use SolidJS

| Scenario                 | SolidJS? | Why                         |
| ------------------------ | -------- | --------------------------- |
| Data-heavy dashboards    | ✅ Yes   | Fine-grained = fast updates |
| SEO-critical pages       | ✅ Yes   | SolidStart SSR              |
| React team familiarity   | ✅ Yes   | JSX + hooks-like patterns   |
| D3/AG-Grid/charting      | ✅ Yes   | No virtual DOM conflict     |
| Huge component ecosystem | ⚠️ Maybe | Smaller than React          |
| Legacy React codebase    | ❌ No    | Can't mix                   |

### Definition of Done

- [ ] No props destructuring at component level
- [ ] `createMemo` for expensive computations
- [ ] `batch()` for multiple state updates
- [ ] `<Index>` for primitive arrays
- [ ] Error boundaries around data fetching
- [ ] Tests pass (`vitest run`)
