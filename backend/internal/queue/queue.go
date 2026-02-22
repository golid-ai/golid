package queue

import (
	"errors"
	"log/slog"

	"github.com/hibiken/asynq"

	"github.com/golid-ai/golid/backend/internal/logger"
)

var ErrNotConfigured = errors.New("queue: redis not configured")

// Queue wraps asynq.Client with an IsConfigured() gate.
// When REDIS_URL is empty, all methods are safe to call but Enqueue returns ErrNotConfigured.
type Queue struct {
	client *asynq.Client
}

func New(redisURL string) *Queue {
	if redisURL == "" {
		return &Queue{}
	}
	opt, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		logger.Error("invalid REDIS_URL, falling back to goroutines",
			slog.String("error", err.Error()))
		return &Queue{}
	}
	return &Queue{client: asynq.NewClient(opt)}
}

func (q *Queue) IsConfigured() bool { return q.client != nil }

func (q *Queue) Enqueue(task *asynq.Task, opts ...asynq.Option) error {
	if !q.IsConfigured() {
		return ErrNotConfigured
	}
	_, err := q.client.Enqueue(task, opts...)
	return err
}

func (q *Queue) Close() error {
	if q.client != nil {
		return q.client.Close()
	}
	return nil
}
