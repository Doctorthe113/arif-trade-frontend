"use client";

import AppProviders from "@/components/app/app-providers.client";
import UsersScreen from "@/components/app/users-screen.client";

export default function UsersPage() {
  return (
    <AppProviders>
      <UsersScreen />
    </AppProviders>
  );
}
