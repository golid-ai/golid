package service

import "time"

// Retry calls fn up to `attempts` times with exponential backoff starting at `delay`.
// Returns nil on first success, or the last error after all attempts fail.
func Retry(attempts int, delay time.Duration, fn func() error) error {
	var lastErr error
	for i := 0; i < attempts; i++ {
		if err := fn(); err != nil {
			lastErr = err
			if i < attempts-1 {
				time.Sleep(delay)
				delay *= 2
			}
			continue
		}
		return nil
	}
	return lastErr
}
