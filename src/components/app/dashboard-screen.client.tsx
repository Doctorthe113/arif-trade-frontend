"use client";

import {
  ActivityIcon,
  RouteIcon,
  ShieldCheckIcon,
  UserCircle2Icon,
} from "lucide-react";
import {
  useHealthQueryValue,
  useSpecQueryValue,
} from "@/components/app/app-queries.client";
import AppShell from "@/components/app/app-shell.client";
import {
  useAuthValue,
  useCurrentUserQueryValue,
} from "@/components/app/auth-context.client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { buildAppPath } from "@/lib/app-config";
import {
  formatRelativeMinutesValue,
  getRoleLabelValue,
} from "@/lib/formatters";

function MetricCardValue({
  descriptionValue,
  titleValue,
  valueValue,
}: {
  descriptionValue: string;
  titleValue: string;
  valueValue: string;
}) {
  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader>
        <CardDescription className="text-[0.72rem] uppercase tracking-[0.18em]">
          {titleValue}
        </CardDescription>
        <CardTitle className="text-3xl tracking-tight" data-ati-display="true">
          {valueValue}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{descriptionValue}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardScreen() {
  const { sessionValue } = useAuthValue();
  const currentUserQueryValue = useCurrentUserQueryValue();
  const healthQueryValue = useHealthQueryValue();
  const specQueryValue = useSpecQueryValue();

  const routesCountValue = specQueryValue.data
    ? Object.values(specQueryValue.data.groups).reduce(
        (totalValue, groupValue) => totalValue + groupValue.length,
        0,
      )
    : 0;

  return (
    <AppShell
      descriptionValue="Realtime visibility for auth, route contracts, and phase 1 admin readiness."
      titleValue="Dashboard"
    >
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCardValue
            descriptionValue="JWT session persistence in localStorage."
            titleValue="Session"
            valueValue={
              sessionValue
                ? formatRelativeMinutesValue(sessionValue.expiresAtMs)
                : "—"
            }
          />
          <MetricCardValue
            descriptionValue="Current authenticated role from `/auth/me`."
            titleValue="Current role"
            valueValue={getRoleLabelValue(
              currentUserQueryValue.data?.role ??
                sessionValue?.user?.role ??
                "viewer",
            )}
          />
          <MetricCardValue
            descriptionValue="Discovered REST endpoints from `/spec`."
            titleValue="Registered routes"
            valueValue={String(routesCountValue || "—")}
          />
          <MetricCardValue
            descriptionValue="Live health response from backend."
            titleValue="API health"
            valueValue={healthQueryValue.data?.status ?? "Checking"}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle data-ati-display="true">System connection</CardTitle>
              <CardDescription>
                Confirms static frontend can reach backend docs and health
                endpoints.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {healthQueryValue.isLoading || specQueryValue.isLoading ? (
                <div className="grid gap-3">
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
              ) : (
                <>
                  <Alert>
                    <ActivityIcon />
                    <AlertTitle>Health endpoint</AlertTitle>
                    <AlertDescription>
                      Status: {healthQueryValue.data?.status ?? "Unavailable"}.
                      Version: {healthQueryValue.data?.version ?? "—"}.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <RouteIcon />
                    <AlertTitle>Spec endpoint</AlertTitle>
                    <AlertDescription>
                      {specQueryValue.data
                        ? `${Object.keys(specQueryValue.data.groups).length} groups exposed. Base URL ${specQueryValue.data.baseUrlValue}.`
                        : "Spec unavailable."}
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle data-ati-display="true">Quick actions</CardTitle>
              <CardDescription>
                Phase 1 shortcuts for superadmin workflows.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button asChild>
                <a href={buildAppPath("/users")}>
                  <UserCircle2Icon data-icon="inline-start" />
                  Open users
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={buildAppPath("/user-form")}>
                  <ShieldCheckIcon data-icon="inline-start" />
                  Create user
                </a>
              </Button>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {specQueryValue.data ? (
                  Object.keys(specQueryValue.data.roles).map((roleValue) => (
                    <Badge key={roleValue} variant="outline">
                      {roleValue}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary">No roles loaded</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
