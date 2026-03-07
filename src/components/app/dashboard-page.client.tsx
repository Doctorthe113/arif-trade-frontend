"use client";

import AppProviders from "@/components/app/app-providers.client";
import DashboardScreen from "@/components/app/dashboard-screen.client";

export default function DashboardPage() {
  return (
    <AppProviders>
      <DashboardScreen />
    </AppProviders>
  );
}
