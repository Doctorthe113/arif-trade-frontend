"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import * as React from "react";

import { AuthProvider } from "@/components/app/auth-context.client";
import { Toaster } from "@/components/ui/sonner";
import { createQueryClientValue } from "@/lib/query-client";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClientValue] = React.useState(() => createQueryClientValue());

  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      <QueryClientProvider client={queryClientValue}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
