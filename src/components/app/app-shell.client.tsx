"use client";

import {
  ActivityIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import * as React from "react";

import {
  useAuthValue,
  useCurrentUserQueryValue,
} from "@/components/app/auth-context.client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { buildAppPath } from "@/lib/app-config";
import {
  formatRelativeMinutesValue,
  getRoleLabelValue,
} from "@/lib/formatters";

type AppShellPropsValue = {
  children: React.ReactNode;
  descriptionValue: string;
  titleValue: string;
};

type NavItemValue = {
  hrefValue: string;
  iconValue: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  labelValue: string;
};

const navItemsValue: NavItemValue[] = [
  {
    hrefValue: buildAppPath("/dashboard"),
    iconValue: LayoutDashboardIcon,
    labelValue: "Dashboard",
  },
  {
    hrefValue: buildAppPath("/users"),
    iconValue: UsersIcon,
    labelValue: "Users",
  },
];

function getInitialsValue(nameValue?: string): string {
  return (nameValue ?? "ATI")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((partValue) => partValue.charAt(0).toUpperCase())
    .join("");
}

function redirectToValue(pathValue: string): void {
  window.location.replace(pathValue);
}

function NavListValue({ onNavigateValue }: { onNavigateValue?: () => void }) {
  const currentPathValue =
    typeof window === "undefined" ? "" : window.location.pathname;

  return (
    <nav className="flex flex-col gap-2">
      {navItemsValue.map((itemValue) => {
        const IconValue = itemValue.iconValue;
        const isActiveValue = currentPathValue === itemValue.hrefValue;

        return (
          <Button
            asChild
            className="justify-start"
            key={itemValue.hrefValue}
            variant={isActiveValue ? "secondary" : "ghost"}
          >
            <a href={itemValue.hrefValue} onClick={onNavigateValue}>
              <IconValue data-icon="inline-start" />
              {itemValue.labelValue}
            </a>
          </Button>
        );
      })}
    </nav>
  );
}

function ShellLoadingValue() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Preparing control center</CardTitle>
          <CardDescription>Checking session and permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-muted-foreground text-sm">
            <ActivityIcon className="animate-pulse" />
            Loading workspace…
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AppShell({
  children,
  descriptionValue,
  titleValue,
}: AppShellPropsValue) {
  const { logoutValue, sessionValue } = useAuthValue();
  const currentUserQueryValue = useCurrentUserQueryValue();

  React.useEffect(() => {
    if (!sessionValue) {
      redirectToValue(buildAppPath("/login"));
    }
  }, [sessionValue]);

  if (!sessionValue) {
    return <ShellLoadingValue />;
  }

  const currentUserValue = currentUserQueryValue.data ?? sessionValue.user;

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-3xl border border-border/80 bg-sidebar p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.24em]">
                  Arif Trade International
                </p>
                <h1
                  className="mt-2 font-semibold text-2xl"
                  data-ati-display="true"
                >
                  Control Center
                </h1>
              </div>
              <Badge variant="outline">Phase 1</Badge>
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.22em]">
                Workspace
              </p>
              <NavListValue />
            </div>
            <div className="mt-auto rounded-2xl border border-border/80 bg-background/70 p-4">
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarFallback>
                    {getInitialsValue(currentUserValue?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {currentUserValue?.name}
                  </p>
                  <p className="truncate text-muted-foreground text-sm">
                    {currentUserValue?.email}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <Badge variant="outline">
                  <ShieldIcon />
                  {getRoleLabelValue(currentUserValue?.role ?? "viewer")}
                </Badge>
                <Button size="sm" variant="outline" onClick={logoutValue}>
                  <LogOutIcon data-icon="inline-start" />
                  Logout
                </Button>
              </div>
              <p className="mt-3 text-muted-foreground text-xs">
                Token {formatRelativeMinutesValue(sessionValue.expiresAtMs)}
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col gap-6">
          <header className="sticky top-4 z-10 rounded-3xl border border-border/80 bg-card/95 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className="lg:hidden" size="icon" variant="outline">
                      <MenuIcon />
                      <span className="sr-only">Open navigation</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>ATI navigation</SheetTitle>
                      <SheetDescription>
                        Open core admin routes for phase 1.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="p-4">
                      <NavListValue />
                    </div>
                  </SheetContent>
                </Sheet>
                <div>
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.22em]">
                    Phase 1
                  </p>
                  <h2
                    className="mt-1 font-semibold text-2xl tracking-tight"
                    data-ati-display="true"
                  >
                    {titleValue}
                  </h2>
                  <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
                    {descriptionValue}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Avatar size="sm">
                        <AvatarFallback>
                          {getInitialsValue(currentUserValue?.name)}
                        </AvatarFallback>
                      </Avatar>
                      {currentUserValue?.name ?? "User"}
                      <ChevronRightIcon data-icon="inline-end" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Session</DropdownMenuLabel>
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() =>
                          redirectToValue(buildAppPath("/dashboard"))
                        }
                      >
                        <LayoutDashboardIcon />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => redirectToValue(buildAppPath("/users"))}
                      >
                        <UsersIcon />
                        Users
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={logoutValue}>
                        <LogOutIcon />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="pb-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
