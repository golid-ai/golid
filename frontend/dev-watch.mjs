import { spawn } from "node:child_process";

// Long-running devcontainer sessions use this as a last-resort supervisor for
// Vinxi dev crashes (for example transient HMR/Nitro header errors). The normal
// `npm run dev` script remains raw `vinxi dev`; VS Code's auto-start task uses
// `npm run dev:watch` so a sporadic dev-server crash does not require manual
// intervention.
//
// This script is intended to run via `npm run dev:watch`, which prepends
// node_modules/.bin to PATH so `vinxi` resolves. Running `node dev-watch.mjs`
// directly requires `vinxi` to be on the system PATH.
const args = process.argv.slice(2);
let child = null;
let stopping = false;
let restartCount = 0;
let fastFailStreak = 0;

const FAST_FAIL_THRESHOLD_MS = 3_000;
const FAST_FAIL_MAX = 5;
const BASE_RESTART_DELAY_MS = 1_500;
const MAX_RESTART_DELAY_MS = 30_000;

function start() {
  const startedAt = new Date();
  child = spawn("vinxi", ["dev", ...args], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    child = null;
    if (stopping) {
      process.exit(code ?? 0);
    }

    restartCount += 1;
    const uptimeMs = Date.now() - startedAt.getTime();
    const uptimeSeconds = Math.round(uptimeMs / 1000);
    if (uptimeMs < FAST_FAIL_THRESHOLD_MS) {
      fastFailStreak += 1;
      if (fastFailStreak >= FAST_FAIL_MAX) {
        console.error(
          `[dev-watch] frontend dev server fast-failed ${FAST_FAIL_MAX} times in a row. Fix the startup error and re-run the task.`,
        );
        process.exit(1);
      }
    } else {
      fastFailStreak = 0;
    }

    const delay = Math.min(
      BASE_RESTART_DELAY_MS * Math.pow(2, Math.max(0, fastFailStreak - 1)),
      MAX_RESTART_DELAY_MS,
    );
    console.error(
      `[dev-watch] frontend dev server exited (code=${code ?? "null"} signal=${signal ?? "none"} uptime=${uptimeSeconds}s). Restart #${restartCount} (fast-fail streak ${fastFailStreak}/${FAST_FAIL_MAX}) in ${Math.round(delay / 1000)}s...`,
    );
    setTimeout(start, delay);
  });
}

function stop(signal) {
  stopping = true;
  if (child) {
    child.kill(signal);
    return;
  }
  process.exit(0);
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
process.on("SIGHUP", () => stop("SIGHUP"));

start();
