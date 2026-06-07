export const buildReloadParam = "__build_reload";
export const chunkReloadStorageKey = "golid:chunk-reload-attempt";

const chunkReloadCooldownMs = 5 * 60 * 1000;
const chunkLoadErrorPatterns = [
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  "error loading dynamically imported module",
  "NetworkError when attempting to fetch resource",
  "Unable to preload CSS",
];

type ChunkRecoveryTarget = {
  location: {
    href: string;
    replace: (url: string) => void;
  };
  history: {
    replaceState: (data: unknown, unused: string, url?: string | URL | null) => void;
  };
  sessionStorage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
};

function recoveryTarget(target?: ChunkRecoveryTarget): ChunkRecoveryTarget | undefined {
  if (target) return target;
  if (typeof window === "undefined") return undefined;
  return window;
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "";
}

export function isChunkLoadError(err: unknown): boolean {
  const message = errorMessage(err).toLowerCase();
  return chunkLoadErrorPatterns.some((pattern) =>
    message.includes(pattern.toLowerCase())
  );
}

/**
 * @param target Internal test injection point. Production callers should omit it.
 */
export function reloadWithFreshBuild(target?: ChunkRecoveryTarget) {
  const recovery = recoveryTarget(target);
  if (!recovery) return;
  const url = new URL(recovery.location.href);
  url.searchParams.set(buildReloadParam, Date.now().toString());
  recovery.location.replace(url.toString());
}

/**
 * @param target Internal test injection point. Production callers should omit it.
 */
export function clearBuildReloadMarker(target?: ChunkRecoveryTarget) {
  const recovery = recoveryTarget(target);
  if (!recovery) return;
  const url = new URL(recovery.location.href);
  if (!url.searchParams.has(buildReloadParam)) return;
  url.searchParams.delete(buildReloadParam);
  recovery.history.replaceState({}, "", url.toString());
  recovery.sessionStorage.removeItem(chunkReloadStorageKey);
}

/**
 * @param target Internal test injection point. Production callers should omit it.
 */
export function reloadOnceForChunkError(target?: ChunkRecoveryTarget) {
  const recovery = recoveryTarget(target);
  if (!recovery) return;
  const now = Date.now();
  const lastAttempt = Number(recovery.sessionStorage.getItem(chunkReloadStorageKey) || "0");
  // 5min covers normal CDN propagation lag without locking out new deploys.
  // Too short can loop on stale CDNs; too long blocks recovery for a later deploy.
  if (Number.isFinite(lastAttempt) && now - lastAttempt < chunkReloadCooldownMs) return;
  recovery.sessionStorage.setItem(chunkReloadStorageKey, String(now));
  reloadWithFreshBuild(recovery);
}
