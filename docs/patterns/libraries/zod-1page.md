# Zod — 1 Page

**Thesis**: TypeScript-first schema validation. Parse, don't validate.

**Refrain**: Define schema. Infer type. Parse input. Trust output.

---

## Quick Start

```typescript
import { z } from 'zod';

const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  role: z.enum(['admin', 'user']).default('user'),
});

type User = z.infer<typeof userSchema>;  // TypeScript type!

const result = userSchema.safeParse(input);
if (result.success) {
  const user = result.data;  // Fully typed
}
```

---

## Common Schemas

```typescript
// Primitives with constraints
z.string().min(1).max(100)
z.string().email()
z.string().url()
z.string().uuid()
z.number().int().positive()
z.coerce.number()  // "5" -> 5
z.coerce.date()    // string -> Date

// Enums
z.enum(['admin', 'user'])

// Arrays
z.array(z.string()).min(1).max(10)

// Optional / Nullable
z.string().optional()         // string | undefined
z.string().nullable()         // string | null
z.string().default('hello')   // Always string
```

---

## Object Utilities

```typescript
const base = z.object({ id: z.string(), name: z.string(), email: z.string() });

base.pick({ id: true, name: true })   // Pick fields
base.omit({ email: true })            // Omit fields
base.partial()                        // All optional
base.extend({ age: z.number() })      // Add fields
```

---

## Transforms & Refinements

```typescript
// Transform
z.string().trim().toLowerCase()
z.string().transform((s) => parseInt(s, 10))

// Custom validation
z.string().refine((val) => /[A-Z]/.test(val), {
  message: 'Must contain uppercase',
})

// Cross-field validation
z.object({
  password: z.string(),
  confirm: z.string(),
}).refine((data) => data.password === data.confirm, {
  message: 'Passwords must match',
  path: ['confirm'],
})
```

---

## Parsing

```typescript
// Throws on failure
const user = userSchema.parse(input);

// Never throws
const result = userSchema.safeParse(input);
if (result.success) {
  result.data  // typed
} else {
  result.error.flatten()  // { fieldErrors: { email: ['Invalid'] } }
}
```

---

## Environment Variables

```typescript
const env = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['dev', 'prod']).default('dev'),
}).parse(process.env);
```

---

## With React Hook Form

```typescript
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

---

## Discriminated Unions

```typescript
const eventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('click'), x: z.number(), y: z.number() }),
  z.object({ type: z.literal('keypress'), key: z.string() }),
]);
```

---

## Golden Rules

1. **Infer types from schemas** — never define twice
2. **Use safeParse for user input** — expected failures shouldn't throw
3. **Use parse for internal data** — throw on unexpected failures
4. **Coerce external strings** — query params, form data need z.coerce
5. **Discriminated unions are fast** — prefer over plain unions
