import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api-client";

export function createQueryClientValue(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        retry: 0,
      },
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCountValue, errorValue) => {
          if (errorValue instanceof ApiError) {
            return errorValue.statusCodeValue >= 500 && failureCountValue < 2;
          }

          return failureCountValue < 1;
        },
        staleTime: 60_000,
      },
    },
  });
}
