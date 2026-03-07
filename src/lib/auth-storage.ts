import type { StoredSessionValue } from "@/lib/api-types";
import { appStorageKeyValue } from "@/lib/app-config";

const sessionStorageKeyValue = `${appStorageKeyValue}:session`;

function canUseBrowserStorageValue(): boolean {
  return typeof window !== "undefined";
}

export function readStoredSession(): StoredSessionValue | null {
  if (!canUseBrowserStorageValue()) {
    return null;
  }

  try {
    const rawSessionValue = window.localStorage.getItem(sessionStorageKeyValue);

    if (!rawSessionValue) {
      return null;
    }

    const parsedSessionValue = JSON.parse(
      rawSessionValue,
    ) as StoredSessionValue;

    if (
      !parsedSessionValue?.token ||
      typeof parsedSessionValue.expiresAtMs !== "number"
    ) {
      window.localStorage.removeItem(sessionStorageKeyValue);
      return null;
    }

    return {
      expiresAtMs: parsedSessionValue.expiresAtMs,
      token: parsedSessionValue.token,
      user: parsedSessionValue.user ?? null,
    };
  } catch {
    window.localStorage.removeItem(sessionStorageKeyValue);
    return null;
  }
}

export function writeStoredSession(sessionValue: StoredSessionValue): void {
  if (!canUseBrowserStorageValue()) {
    return;
  }

  window.localStorage.setItem(
    sessionStorageKeyValue,
    JSON.stringify(sessionValue),
  );
}

export function clearStoredSession(): void {
  if (!canUseBrowserStorageValue()) {
    return;
  }

  window.localStorage.removeItem(sessionStorageKeyValue);
}
