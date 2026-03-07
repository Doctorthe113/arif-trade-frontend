export const storageVersionValue = "v1";
export const appStorageKeyValue = `ati-static-admin:${storageVersionValue}`;
export const refreshWindowMsValue = 60_000;

export function buildAppPath(pathNameValue: string): string {
  const basePathValue = import.meta.env.BASE_URL ?? "/";
  const normalizedBasePathValue =
    basePathValue === "/"
      ? ""
      : basePathValue.endsWith("/")
        ? basePathValue.slice(0, -1)
        : basePathValue;

  if (!pathNameValue || pathNameValue === "/") {
    return normalizedBasePathValue || "/";
  }

  const normalizedPathValue = pathNameValue.startsWith("/")
    ? pathNameValue
    : `/${pathNameValue}`;

  return `${normalizedBasePathValue}${normalizedPathValue}`;
}

export function buildPublicUrl(pathNameValue: string): string {
  const normalizedPathValue = pathNameValue.startsWith("/")
    ? pathNameValue.slice(1)
    : pathNameValue;

  return `${import.meta.env.BASE_URL ?? "/"}${normalizedPathValue}`;
}

export function getApiBaseUrl(): string {
  const publicApiBaseUrlValue = import.meta.env.PUBLIC_API_BASE_URL?.trim();

  if (!publicApiBaseUrlValue) {
    throw new Error(
      "Missing PUBLIC_API_BASE_URL. Define it in .env or .env.production before build.",
    );
  }

  return publicApiBaseUrlValue.replace(/\/$/, "");
}
