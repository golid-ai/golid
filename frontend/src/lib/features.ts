import { createSignal } from "solid-js";
import { get } from "./api";

const [flags, setFlags] = createSignal<Record<string, boolean>>({});

export async function loadFeatures(): Promise<void> {
  try {
    const result = await get<Record<string, boolean>>("/features", { skipAuth: true });
    setFlags(result);
  } catch {
    // flags default to false if endpoint unavailable
  }
}

export function isEnabled(key: string): boolean {
  return flags()[key] ?? false;
}
