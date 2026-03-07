"use client";

import { ArrowRightIcon, ShieldCheckIcon } from "lucide-react";
import * as React from "react";

import { useAuthValue } from "@/components/app/auth-context.client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAppPath } from "@/lib/app-config";

export default function IndexScreen() {
  const { sessionValue } = useAuthValue();

  React.useEffect(() => {
    window.location.replace(
      buildAppPath(sessionValue ? "/dashboard" : "/login"),
    );
  }, [sessionValue]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="max-w-xl border-emerald-200/60 bg-card/95 shadow-lg">
        <CardHeader>
          <Badge variant="secondary">ATI static frontend</Badge>
          <CardTitle className="text-3xl">Preparing control center</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-muted-foreground">
          <p>Client-only admin app. Build-time API base URL. No SSR.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href={buildAppPath("/login")}>
                <ShieldCheckIcon data-icon="inline-start" />
                Open login
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={buildAppPath("/dashboard")}>
                Dashboard
                <ArrowRightIcon data-icon="inline-end" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
