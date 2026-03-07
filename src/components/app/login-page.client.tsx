"use client";

import AppProviders from "@/components/app/app-providers.client";
import LoginScreen from "@/components/app/login-screen.client";

export default function LoginPage() {
  return (
    <AppProviders>
      <LoginScreen />
    </AppProviders>
  );
}
