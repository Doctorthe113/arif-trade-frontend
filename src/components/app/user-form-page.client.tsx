"use client";

import AppProviders from "@/components/app/app-providers.client";
import UserFormScreen from "@/components/app/user-form-screen.client";

export default function UserFormPage() {
  return (
    <AppProviders>
      <UserFormScreen />
    </AppProviders>
  );
}
