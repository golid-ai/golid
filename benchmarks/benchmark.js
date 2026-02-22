/**
 * Golid API Benchmark Suite
 *
 * Requires k6: https://k6.io/docs/getting-started/installation/
 *
 * Usage:
 *   docker compose up -d
 *   k6 run benchmarks/benchmark.js
 *
 * Override base URL:
 *   k6 run -e BASE_URL=http://your-host:8080 benchmarks/benchmark.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

const loginDuration = new Trend("login_duration", true);
const healthDuration = new Trend("health_duration", true);
const errorRate = new Rate("errors");

export const options = {
  scenarios: {
    health_check: {
      executor: "constant-rate",
      rate: 100,
      timeUnit: "1s",
      duration: "15s",
      preAllocatedVUs: 20,
      exec: "healthCheck",
    },
    auth_login: {
      executor: "constant-rate",
      rate: 20,
      timeUnit: "1s",
      duration: "15s",
      preAllocatedVUs: 10,
      startTime: "16s",
      exec: "authLogin",
    },
    sustained_load: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "10s", target: 50 },
        { duration: "20s", target: 50 },
        { duration: "10s", target: 0 },
      ],
      startTime: "32s",
      exec: "mixedTraffic",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    errors: ["rate<0.05"],
    health_duration: ["p(95)<50"],
    login_duration: ["p(95)<500"],
  },
};

const headers = { "Content-Type": "application/json" };

export function healthCheck() {
  const res = http.get(`${BASE_URL}/health`);
  healthDuration.add(res.timings.duration);
  const ok = check(res, {
    "health 200": (r) => r.status === 200,
    "health < 50ms": (r) => r.timings.duration < 50,
  });
  errorRate.add(!ok);
}

export function authLogin() {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: "user@example.com", password: "Password123!" }),
    { headers }
  );
  loginDuration.add(res.timings.duration);
  const ok = check(res, {
    "login 200": (r) => r.status === 200,
    "login has token": (r) => {
      try {
        return JSON.parse(r.body).access_token !== undefined;
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!ok);
}

export function mixedTraffic() {
  const rand = Math.random();
  if (rand < 0.5) {
    healthCheck();
  } else if (rand < 0.8) {
    const res = http.get(`${BASE_URL}/api/v1/features`);
    check(res, { "features 200": (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  } else {
    authLogin();
  }
  sleep(0.1);
}
