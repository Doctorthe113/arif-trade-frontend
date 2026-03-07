"use client";

import AppProviders from "@/components/app/app-providers.client";
import IndexScreen from "@/components/app/index-screen.client";

export default function IndexPage() {
  return (
    <AppProviders>
      <IndexScreen />
    </AppProviders>
  );
}
