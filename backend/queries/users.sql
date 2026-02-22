-- ============================================================================
-- USERS
-- ============================================================================

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: CreateUser :one
INSERT INTO users (email, password_hash, type)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateUserPassword :exec
UPDATE users SET password_hash = $2 WHERE id = $1;

-- name: DeleteUser :exec
-- Available for account deletion feature — not yet wired to a handler.
DELETE FROM users WHERE id = $1;

-- ============================================================================
-- EMAIL VERIFICATION (selector.verifier pattern)
-- ============================================================================

-- name: CreateUserWithVerification :one
INSERT INTO users (email, password_hash, type, verification_selector, verification_verifier_hash)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetUserByVerificationSelector :one
SELECT * FROM users WHERE verification_selector = $1;

-- name: SetVerificationToken :exec
UPDATE users SET verification_selector = $2, verification_verifier_hash = $3 WHERE id = $1;

-- ============================================================================
-- PASSWORD RESET (selector.verifier pattern)
-- ============================================================================

-- name: GetUserByResetSelector :one
SELECT * FROM users
WHERE password_reset_selector = $1
  AND password_reset_expires > NOW();

-- name: SetPasswordResetToken :exec
UPDATE users
SET password_reset_selector = $2,
    password_reset_verifier_hash = $3,
    password_reset_expires = $4
WHERE id = $1;

-- name: ClearPasswordResetToken :exec
UPDATE users
SET password_reset_selector = NULL,
    password_reset_verifier_hash = NULL,
    password_reset_expires = NULL
WHERE id = $1;

-- name: UpdatePasswordAndClearReset :exec
UPDATE users
SET password_hash = $2,
    password_reset_selector = NULL,
    password_reset_verifier_hash = NULL,
    password_reset_expires = NULL
WHERE id = $1;
