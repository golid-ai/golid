# Testing Strategy — 1-Page

**Thesis**: Tests are documentation that runs. Write tests that catch bugs, not tests that pass.

**Refrain**: Test behavior, not implementation. Mock at boundaries. Fast tests run often.

---

## The Pyramid

```
      E2E (few, slow)
    Integration (some)
  Unit (many, fast)
```

## When to Use What

| Level | Test For | Speed |
|-------|----------|-------|
| **Unit** | Pure logic, utils, transforms | <10ms |
| **Integration** | API routes, component + hooks | ~100ms |
| **E2E** | Critical user flows | ~seconds |

## Test Structure (AAA)

```typescript
test('adds item to cart', () => {
  // Arrange
  const cart = new Cart();
  
  // Act
  cart.add({ id: '1', price: 10 });
  
  // Assert
  expect(cart.total).toBe(10);
});
```

## Mock at Boundaries

| Mock | Don't Mock |
|------|------------|
| External APIs | Your own code |
| Database | Pure functions |
| `Date.now()` | Implementation details |

## MSW (API Mocking)

```typescript
import { http, HttpResponse } from 'msw';

const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'Test' });
  }),
];
```

## Component Testing

```typescript
test('button calls onclick', async () => {
  const onclick = vi.fn();
  render(Button, { props: { onclick } });
  
  await fireEvent.click(screen.getByRole('button'));
  
  expect(onclick).toHaveBeenCalledOnce();
});
```

## Query Priority

```typescript
// Best (accessible)
screen.getByRole('button', { name: 'Submit' });
screen.getByLabelText('Email');

// Okay
screen.getByText('Welcome');

// Last resort
screen.getByTestId('submit-btn');
```

## Factory Pattern

```typescript
function createUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    ...overrides,
  };
}
```

## Coverage Targets

| Metric | Target |
|--------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |

## Anti-Patterns

| Bad | Good |
|-----|------|
| Test implementation | Test behavior |
| Mock everything | Mock boundaries |
| Shared state | Reset between tests |
| No assertions | Assert something |

## Definition of Done

- [ ] Unit tests for pure logic
- [ ] Integration tests for API routes
- [ ] Component tests for UI behavior
- [ ] MSW for API mocking
- [ ] Coverage > 80%
- [ ] Tests run in CI

---
