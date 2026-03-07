import type {
  ApiEnvelopeValue,
  ApiErrorValue,
  AuthUserValue,
  RefreshResponseValue,
  StoredSessionValue,
} from "@/lib/api-types";
import { getApiBaseUrl, refreshWindowMsValue } from "@/lib/app-config";
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from "@/lib/auth-storage";

export class ApiError extends Error {
  errorsValue?: ApiErrorValue;
  statusCodeValue: number;

  constructor(
    messageValue: string,
    statusCodeValue: number,
    errorsValue?: ApiErrorValue,
  ) {
    super(messageValue);
    this.errorsValue = errorsValue;
    this.name = "ApiError";
    this.statusCodeValue = statusCodeValue;
  }
}

type ApiRequestOptionsValue = {
  allowEmptyResponseValue?: boolean;
  authRequiredValue?: boolean;
  bodyValue?: unknown;
  headersValue?: HeadersInit;
  methodValue?: string;
  skipRefreshRetryValue?: boolean;
};

let refreshPromiseValue: Promise<StoredSessionValue | null> | null = null;

function isSuccessEnvelopeValue<TDataValue>(
  envelopeValue: ApiEnvelopeValue<TDataValue>,
): envelopeValue is { data: TDataValue; message: string; success: true } {
  return envelopeValue.success === true;
}

function buildRequestUrlValue(pathNameValue: string): string {
  const normalizedPathValue = pathNameValue.startsWith("/")
    ? pathNameValue
    : `/${pathNameValue}`;

  return `${getApiBaseUrl()}${normalizedPathValue}`;
}

async function parseEnvelopeValue<TDataValue>(
  responseValue: Response,
  allowEmptyResponseValue = false,
): Promise<ApiEnvelopeValue<TDataValue> | null> {
  if (responseValue.status === 204 || allowEmptyResponseValue) {
    return null;
  }

  const rawBodyValue = await responseValue.text();

  if (!rawBodyValue) {
    return null;
  }

  return JSON.parse(rawBodyValue) as ApiEnvelopeValue<TDataValue>;
}

function buildHeadersValue(
  headersValue: HeadersInit | undefined,
  tokenValue?: string,
): Headers {
  const nextHeadersValue = new Headers(headersValue);

  if (!nextHeadersValue.has("Content-Type")) {
    nextHeadersValue.set("Content-Type", "application/json");
  }

  if (tokenValue) {
    nextHeadersValue.set("Authorization", `Bearer ${tokenValue}`);
  }

  return nextHeadersValue;
}

function createSessionValue(
  tokenValue: string,
  expiresInSecondsValue: number,
  userValue: AuthUserValue | null,
): StoredSessionValue {
  return {
    expiresAtMs: Date.now() + expiresInSecondsValue * 1000,
    token: tokenValue,
    user: userValue,
  };
}

export function updateStoredUserValue(userValue: AuthUserValue | null): void {
  const sessionValue = readStoredSession();

  if (!sessionValue) {
    return;
  }

  writeStoredSession({
    ...sessionValue,
    user: userValue,
  });
}

export function getApiErrorMessageValue(errorValue: unknown): string {
  if (errorValue instanceof ApiError) {
    return errorValue.message;
  }

  if (errorValue instanceof Error) {
    return errorValue.message;
  }

  return "Something went wrong.";
}

export async function refreshSessionValue(
  forceRefreshValue = false,
): Promise<StoredSessionValue | null> {
  const sessionValue = readStoredSession();

  if (!sessionValue?.token) {
    return null;
  }

  const shouldRefreshValue =
    forceRefreshValue ||
    sessionValue.expiresAtMs - Date.now() <= refreshWindowMsValue;

  if (!shouldRefreshValue) {
    return sessionValue;
  }

  if (refreshPromiseValue) {
    return refreshPromiseValue;
  }

  refreshPromiseValue = fetch(buildRequestUrlValue("/auth/refresh"), {
    headers: buildHeadersValue(undefined, sessionValue.token),
    method: "POST",
  })
    .then(async (responseValue) => {
      const envelopeValue =
        await parseEnvelopeValue<RefreshResponseValue>(responseValue);

      if (
        !responseValue.ok ||
        !envelopeValue ||
        !isSuccessEnvelopeValue(envelopeValue)
      ) {
        clearStoredSession();
        return null;
      }

      const nextSessionValue = createSessionValue(
        envelopeValue.data.token,
        envelopeValue.data.expires_in,
        sessionValue.user,
      );

      writeStoredSession(nextSessionValue);
      return nextSessionValue;
    })
    .catch(() => {
      clearStoredSession();
      return null;
    })
    .finally(() => {
      refreshPromiseValue = null;
    });

  return refreshPromiseValue;
}

export async function apiRequestValue<TDataValue>(
  pathNameValue: string,
  optionsValue: ApiRequestOptionsValue = {},
): Promise<TDataValue> {
  const authRequiredValue = optionsValue.authRequiredValue ?? true;
  let sessionValue = authRequiredValue ? readStoredSession() : null;

  if (authRequiredValue && sessionValue) {
    sessionValue = await refreshSessionValue();
  }

  const responseValue = await fetch(buildRequestUrlValue(pathNameValue), {
    body:
      optionsValue.bodyValue === undefined
        ? undefined
        : JSON.stringify(optionsValue.bodyValue),
    headers: buildHeadersValue(
      optionsValue.headersValue,
      authRequiredValue ? sessionValue?.token : undefined,
    ),
    method: optionsValue.methodValue ?? "GET",
  });

  if (
    responseValue.status === 401 &&
    authRequiredValue &&
    !optionsValue.skipRefreshRetryValue
  ) {
    const refreshedSessionValue = await refreshSessionValue(true);

    if (refreshedSessionValue?.token) {
      return apiRequestValue<TDataValue>(pathNameValue, {
        ...optionsValue,
        skipRefreshRetryValue: true,
      });
    }

    clearStoredSession();
  }

  const envelopeValue = await parseEnvelopeValue<TDataValue>(
    responseValue,
    optionsValue.allowEmptyResponseValue,
  );

  if (!responseValue.ok) {
    throw new ApiError(
      envelopeValue?.message ?? "Request failed.",
      responseValue.status,
      envelopeValue && !isSuccessEnvelopeValue(envelopeValue)
        ? envelopeValue.errors
        : undefined,
    );
  }

  if (!envelopeValue) {
    return undefined as TDataValue;
  }

  if (!isSuccessEnvelopeValue(envelopeValue)) {
    throw new ApiError(
      envelopeValue.message,
      responseValue.status,
      envelopeValue.errors,
    );
  }

  return envelopeValue.data;
}

export { createSessionValue };
