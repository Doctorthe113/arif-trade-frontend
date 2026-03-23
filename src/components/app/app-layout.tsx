import { Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import ThemeToggle from "#/components/theme-toggle";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "#/components/ui/sidebar";

type NavItem = {
	label: string;
	icon: LucideIcon;
	to: string;
};

type NavGroup = {
	label: string;
	items: NavItem[];
};

type AppLayoutProps = {
	roleLabel: string;
	roleIcon: LucideIcon;
	breadcrumb: string;
	navGroups: NavGroup[];
};

/// Sidebar layout shell for role dashboards
export function AppLayout({
	roleLabel,
	roleIcon: RoleIcon,
	breadcrumb,
	navGroups,
}: AppLayoutProps) {
	const matchRoute = useMatchRoute();

	return (
		<SidebarProvider>
			<Sidebar collapsible="offcanvas" variant="inset">
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild size="lg">
								<Link to="/">
									<div className="flex items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground size-8">
										<RoleIcon />
									</div>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-semibold">
											ATI Dashboard
										</span>
										<span className="truncate text-xs">{roleLabel}</span>
									</div>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>

				<SidebarContent>
					{navGroups.map((group) => (
						<SidebarGroup key={group.label}>
							<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{group.items.map((item) => (
										<SidebarMenuItem key={item.to}>
											<SidebarMenuButton
												asChild
												isActive={!!matchRoute({ to: item.to, fuzzy: false })}
												tooltip={item.label}
											>
												<Link to={item.to}>
													<item.icon />
													<span>{item.label}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					))}
				</SidebarContent>

				<SidebarFooter>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton size="lg" className="hover:bg-accent/50">
								<Avatar className="size-8 rounded-lg">
									<AvatarFallback className="rounded-lg">
										{roleLabel.slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">{roleLabel}</span>
									<span className="truncate text-xs text-muted-foreground">
										Arif Trade International
									</span>
								</div>
								<ThemeToggle />
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
			</Sidebar>

			<SidebarInset className="flex max-h-full min-h-0 min-w-0 max-w-full flex-col overflow-clip rounded-md">
				<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<span className="text-sm font-medium">{breadcrumb}</span>
				</header>
				<main className="p-4 md:p-6 flex-1">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
