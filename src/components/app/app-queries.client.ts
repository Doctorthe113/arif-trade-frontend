"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequestValue } from "@/lib/api-client";
import {
  mapApiSpecValue,
  mapAuthUserValue,
  mapPaginatedDataValue,
} from "@/lib/api-mappers";
import type {
  ApiSpecValue,
  AuthUserValue,
  CreateUserPayloadValue,
  HealthResponseValue,
  PaginatedDataValue,
  UpdateUserPayloadValue,
  UserRoleValue,
} from "@/lib/api-types";

type UsersQueryOptionsValue = {
  pageValue: number;
  perPageValue: number;
  roleValue: UserRoleValue | "all";
};

function buildUsersQueryStringValue(
  optionsValue: UsersQueryOptionsValue,
): string {
  const paramsValue = new URLSearchParams();

  paramsValue.set("page", String(optionsValue.pageValue));
  paramsValue.set("per_page", String(optionsValue.perPageValue));

  if (optionsValue.roleValue !== "all") {
    paramsValue.set("role", optionsValue.roleValue);
  }

  return paramsValue.toString();
}

export function useHealthQueryValue() {
  return useQuery({
    queryKey: ["system", "health"],
    queryFn: () =>
      apiRequestValue<HealthResponseValue>("/health", {
        authRequiredValue: false,
      }),
  });
}

export function useSpecQueryValue() {
  return useQuery({
    queryKey: ["system", "spec"],
    queryFn: () =>
      apiRequestValue<Record<string, unknown>>("/spec", {
        authRequiredValue: false,
      }).then((specValue) => mapApiSpecValue(specValue)),
  });
}

export function useUsersQueryValue(optionsValue: UsersQueryOptionsValue) {
  return useQuery<PaginatedDataValue<AuthUserValue>>({
    queryKey: [
      "users",
      optionsValue.pageValue,
      optionsValue.perPageValue,
      optionsValue.roleValue,
    ],
    queryFn: () =>
      apiRequestValue<Record<string, unknown>>(
        `/users?${buildUsersQueryStringValue(optionsValue)}`,
      ).then((responseValue) =>
        mapPaginatedDataValue(responseValue, mapAuthUserValue),
      ),
  });
}

export function useUserQueryValue(userIdValue: number | null) {
  return useQuery({
    enabled: Boolean(userIdValue),
    queryKey: ["users", "detail", userIdValue],
    queryFn: () =>
      apiRequestValue<Record<string, unknown>>(`/users/${userIdValue}`).then(
        (responseValue) => mapAuthUserValue(responseValue),
      ),
  });
}

export function useCreateUserMutationValue() {
  const queryClientValue = useQueryClient();

  return useMutation({
    mutationFn: (payloadValue: CreateUserPayloadValue) =>
      apiRequestValue<{ id: number }>("/users", {
        bodyValue: payloadValue,
        methodValue: "POST",
      }),
    onSuccess: () => {
      queryClientValue.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserMutationValue() {
  const queryClientValue = useQueryClient();

  return useMutation({
    mutationFn: ({
      payloadValue,
      userIdValue,
    }: {
      payloadValue: UpdateUserPayloadValue;
      userIdValue: number;
    }) => {
      const bodyValue: Record<string, unknown> = {
        email: payloadValue.email,
        name: payloadValue.name,
        password: payloadValue.password,
        role: payloadValue.role,
      };

      if (payloadValue.isActiveValue !== undefined) {
        bodyValue.is_active = payloadValue.isActiveValue;
      }

      return apiRequestValue<null>(`/users/${userIdValue}`, {
        bodyValue,
        methodValue: "PUT",
      });
    },
    onSuccess: (_, variablesValue) => {
      queryClientValue.invalidateQueries({ queryKey: ["users"] });
      queryClientValue.invalidateQueries({
        queryKey: ["users", "detail", variablesValue.userIdValue],
      });
    },
  });
}

export function useDeleteUserMutationValue() {
  const queryClientValue = useQueryClient();

  return useMutation({
    mutationFn: (userIdValue: number) =>
      apiRequestValue<void>(`/users/${userIdValue}`, {
        allowEmptyResponseValue: true,
        methodValue: "DELETE",
      }),
    onSuccess: () => {
      queryClientValue.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export type { ApiSpecValue };
