"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import {
  ApiError,
  apiRequestValue,
  createSessionValue,
  updateStoredUserValue,
} from "@/lib/api-client";
import { mapAuthUserValue, mapLoginResponseValue } from "@/lib/api-mappers";
import type { AuthUserValue, StoredSessionValue } from "@/lib/api-types";
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from "@/lib/auth-storage";

type LoginPayloadValue = {
  email: string;
  password: string;
};

type AuthContextValue = {
  logoutValue: () => void;
  sessionValue: StoredSessionValue | null;
  setSessionValue: (sessionValue: StoredSessionValue | null) => void;
  syncUserValue: (userValue: AuthUserValue | null) => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

function getAuthQueryKeyValue(tokenValue?: string): string[] {
  return ["auth", "me", tokenValue ?? "guest"];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClientValue = useQueryClient();
  const [sessionValue, setSessionStateValue] =
    React.useState<StoredSessionValue | null>(() => readStoredSession());

  const setSessionValue = React.useCallback(
    (nextSessionValue: StoredSessionValue | null) => {
      setSessionStateValue(nextSessionValue);

      if (nextSessionValue) {
        writeStoredSession(nextSessionValue);
        queryClientValue.setQueryData(
          getAuthQueryKeyValue(nextSessionValue.token),
          nextSessionValue.user,
        );
        return;
      }

      clearStoredSession();
      queryClientValue.removeQueries({ queryKey: ["auth"] });
    },
    [queryClientValue],
  );

  const syncUserValue = React.useCallback((userValue: AuthUserValue | null) => {
    setSessionStateValue((currentSessionValue) => {
      if (!currentSessionValue) {
        return currentSessionValue;
      }

      const nextSessionValue = {
        ...currentSessionValue,
        user: userValue,
      };

      writeStoredSession(nextSessionValue);
      return nextSessionValue;
    });

    updateStoredUserValue(userValue);
  }, []);

  const logoutValue = React.useCallback(() => {
    setSessionStateValue(null);
    clearStoredSession();
    queryClientValue.clear();
  }, [queryClientValue]);

  React.useEffect(() => {
    const handleStorageValue = () => {
      setSessionStateValue(readStoredSession());
    };

    window.addEventListener("storage", handleStorageValue);
    return () => {
      window.removeEventListener("storage", handleStorageValue);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        logoutValue,
        sessionValue,
        setSessionValue,
        syncUserValue,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthValue(): AuthContextValue {
  const contextValue = React.useContext(AuthContext);

  if (!contextValue) {
    throw new Error("useAuthValue must be used inside AuthProvider.");
  }

  return contextValue;
}

export function useCurrentUserQueryValue() {
  const { logoutValue, sessionValue, syncUserValue } = useAuthValue();

  return useQuery({
    enabled: Boolean(sessionValue?.token),
    initialData: sessionValue?.user ?? undefined,
    queryKey: getAuthQueryKeyValue(sessionValue?.token),
    queryFn: async () => {
      try {
        const currentUserValue = mapAuthUserValue(
          await apiRequestValue<Record<string, unknown>>("/auth/me"),
        );
        syncUserValue(currentUserValue);
        return currentUserValue;
      } catch (errorValue) {
        if (
          errorValue instanceof ApiError &&
          errorValue.statusCodeValue === 401
        ) {
          logoutValue();
        }

        throw errorValue;
      }
    },
  });
}

export function useLoginMutationValue() {
  const { setSessionValue } = useAuthValue();
  const queryClientValue = useQueryClient();

  return useMutation({
    mutationFn: (payloadValue: LoginPayloadValue) =>
      apiRequestValue<Record<string, unknown>>("/auth/login", {
        authRequiredValue: false,
        bodyValue: payloadValue,
        methodValue: "POST",
      }).then((responseValue) => mapLoginResponseValue(responseValue)),
    onSuccess: (responseValue) => {
      const nextSessionValue = createSessionValue(
        responseValue.token,
        responseValue.expiresInSecondsValue,
        responseValue.user,
      );

      setSessionValue(nextSessionValue);
      queryClientValue.setQueryData(
        getAuthQueryKeyValue(responseValue.token),
        responseValue.user,
      );
    },
  });
}
