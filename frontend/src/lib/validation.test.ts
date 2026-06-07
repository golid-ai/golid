import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  loginSchema,
  signupSchema,
  emailSchema,
  passwordSchema,
  validate,
  getFirstError,
} from "./validation";

describe("emailSchema", () => {
  it("accepts valid email", () => {
    expect(emailSchema.safeParse("user@example.com").success).toBe(true);
  });

  it("rejects empty string", () => {
    expect(emailSchema.safeParse("").success).toBe(false);
  });

  it("rejects invalid format", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("accepts 8+ characters", () => {
    expect(passwordSchema.safeParse("password123").success).toBe(true);
  });

  it("rejects short passwords", () => {
    const result = passwordSchema.safeParse("short");
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(passwordSchema.safeParse("").success).toBe(false);
  });

  it("rejects passwords over 72 characters", () => {
    expect(passwordSchema.safeParse("a".repeat(73)).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({ password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts valid signup data", () => {
    const result = signupSchema.safeParse({
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing first_name", () => {
    const result = signupSchema.safeParse({
      last_name: "Doe",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing last_name", () => {
    const result = signupSchema.safeParse({
      first_name: "John",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = signupSchema.safeParse({
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "different456",
    });
    expect(result.success).toBe(false);
  });
});

describe("validate", () => {
  const schema = z.object({
    email: z.string().email("Invalid email"),
    name: z.string().min(1, "Name is required"),
  });

  it("returns parsed data on success", () => {
    const result = validate(schema, { email: "a@b.com", name: "Alice" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("a@b.com");
    }
  });

  it("returns field errors on failure", () => {
    const result = validate(schema, { email: "bad", name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.email).toBe("Invalid email");
      expect(result.errors.name).toBe("Name is required");
    }
  });

  it("keeps first error when multiple issues share a path", () => {
    const dupSchema = z
      .object({ field: z.string() })
      .superRefine((_val, ctx) => {
        ctx.addIssue({ code: "custom", message: "First error", path: ["field"] });
        ctx.addIssue({ code: "custom", message: "Second error", path: ["field"] });
      });
    const result = validate(dupSchema, { field: "x" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.field).toBe("First error");
    }
  });
});

describe("getFirstError", () => {
  it("returns first issue message", () => {
    const error = loginSchema.safeParse({}).error!;
    expect(getFirstError(error)).toBeTruthy();
  });

  it("returns fallback when no issues", () => {
    const empty = new z.ZodError([]);
    expect(getFirstError(empty)).toBe("Validation failed");
  });
});
