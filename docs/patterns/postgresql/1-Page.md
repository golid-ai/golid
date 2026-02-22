# PostgreSQL — 1-Page

**Thesis**: PostgreSQL is the database. Powerful, reliable, extensible—when used correctly.

**Refrain**: Index your foreign keys. Use JSONB wisely. EXPLAIN ANALYZE everything.

---

### Essential Types

| Use | Type |
|-----|------|
| ID | `UUID` or `BIGSERIAL` |
| Money | `NUMERIC(10,2)` |
| Timestamps | `TIMESTAMPTZ` |
| Flexible | `JSONB` |

### JSONB Queries

```sql
-- Contains
WHERE metadata @> '{"active": true}'
-- Key exists
WHERE metadata ? 'color'
-- Value
WHERE metadata->>'color' = 'red'
-- Index
CREATE INDEX idx_meta ON products USING GIN(metadata);
```

### Indexing

```sql
-- Always index FKs
CREATE INDEX idx_orders_user ON orders(user_id);

-- Partial (conditional)
CREATE INDEX idx_pending ON orders(created_at) WHERE status = 'pending';

-- Composite (leftmost prefix)
CREATE INDEX idx_multi ON orders(user_id, status);

-- Concurrent (no lock)
CREATE INDEX CONCURRENTLY idx_big ON big_table(col);
```

### EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'x';
```

| See | Means |
|-----|-------|
| Seq Scan | Add index |
| Index Scan | Good |
| Index Only | Best |

### Locking

```sql
-- Row lock
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;

-- Skip locked (queue pattern)
SELECT * FROM jobs WHERE status = 'pending' FOR UPDATE SKIP LOCKED LIMIT 1;
```

### Performance

```sql
-- Connection pooling: Use PgBouncer

-- Check bloat
SELECT relname, n_dead_tup FROM pg_stat_user_tables;

-- Partition time-series
CREATE TABLE events (...) PARTITION BY RANGE (created_at);
```

### Monitoring

```sql
-- Long queries
SELECT pid, now() - query_start, query FROM pg_stat_activity
WHERE query_start < now() - interval '5 min';

-- Table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC;
```

### Anti-Patterns

| Bad | Good |
|-----|------|
| No index on FK | Always index FKs |
| SELECT * | Select columns |
| OFFSET pagination | Cursor pagination |
| No pooling | PgBouncer |

---
