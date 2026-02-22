# Monorepo — 1 Page

**Thesis**: One repo, many packages. Shared code, atomic commits, unified tooling.

**Refrain**: Workspaces for structure. Turborepo for speed. Shared configs everywhere.

---

## Structure

```
my-monorepo/
├── apps/
│   ├── web/           # Next.js
│   ├── api/           # Go/Node
│   └── mobile/        # Expo
├── packages/
│   ├── ui/            # Shared components
│   ├── config/        # ESLint, TS configs
│   └── utils/         # Shared utilities
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Quick Setup

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
// turbo.json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "test": { "dependsOn": ["build"] }
  }
}
```

---

## Internal Dependencies

```json
// apps/web/package.json
{
  "dependencies": {
    "@repo/ui": "workspace:*",
    "@repo/utils": "workspace:*"
  }
}
```

---

## Commands

```bash
turbo dev                           # All apps
turbo dev --filter=@repo/web        # Single app
turbo build --filter=@repo/web...   # App + deps
turbo build --filter=[main]         # Changed since main
```

---

## Shared Config Pattern

```json
// packages/config/typescript/base.json
{ "compilerOptions": { "strict": true, ... } }

// apps/web/tsconfig.json
{ "extends": "@repo/config/typescript/nextjs" }
```

---

## Go in Monorepo

```makefile
# apps/api/Makefile
build:
	go build -o bin/server ./cmd/server
dev:
	go run ./cmd/server
```

---

## Golden Rules

1. **workspace:\*** — Always use for internal deps
2. **Install from root** — `pnpm add X --filter=@repo/web`
3. **Extend configs** — Don't duplicate
4. **^build dependsOn** — Build deps before dependents
5. **Remote cache** — Share builds across team/CI
