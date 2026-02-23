// Prevents Vinxi dev server from crashing on ERR_HTTP_HEADERS_SENT.
// The h3 error handler has a bug where it tries to set headers after
// the response is already sent during SSR failures. This kills the
// Node process and all subsequent E2E tests get CONNECTION_REFUSED.
process.on("uncaughtException", (err) => {
  if (err.code === "ERR_HTTP_HEADERS_SENT") {
    console.error("[E2E] Suppressed ERR_HTTP_HEADERS_SENT (Vinxi/h3 bug)");
    return;
  }
  console.error("[E2E] Uncaught exception:", err);
  process.exit(1);
});
