import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowRightLeft,
	BarChart3,
	ClipboardList,
	FileText,
	Package,
	ShieldCheck,
	UserCog,
	UserPlus,
} from "lucide-react";

import { AppLayout } from "#/components/app/app-layout";
import { useAuth } from "#/lib/auth";
import { isAuthDisabled } from "#/lib/auth-flags";

export const Route = createFileRoute("/salesman")({
	component: SalesmanLayout,
});

/// Salesman dashboard layout
function SalesmanLayout() {
	const { hasRole, user } = useAuth();
	const roleName = user?.role as string | undefined;
	const isAdminUser =
		isAuthDisabled || hasRole("superadmin", "editor") || roleName === "admin";

	const navGroups = isAdminUser
		? [
				{
					label: "Dashboard",
					items: [
						{ label: "Overview", icon: BarChart3, to: "/salesman/overview" },
						{ label: "Invoices", icon: FileText, to: "/salesman/invoices" },
						{
							label: "Transactions",
							icon: ArrowRightLeft,
							to: "/salesman/transaction",
						},
						{ label: "Inventory", icon: Package, to: "/salesman/inventory" },
						{
							label: "Quotations",
							icon: ClipboardList,
							to: "/salesman/quote",
						},
					],
				},
				{
					label: "Admin",
					items: [
						{
							label: "Create User",
							icon: UserPlus,
							to: "/admin/create-user",
						},
						{
							label: "Update User",
							icon: UserCog,
							to: "/admin/update-user",
						},
					],
				},
			]
		: [
				{
					label: "Sales",
					items: [
						{ label: "Inventory", icon: Package, to: "/salesman/inventory" },
						{
							label: "Quotations",
							icon: ClipboardList,
							to: "/salesman/quote",
						},
					],
				},
			];

	return (
		<AppLayout
			roleLabel="Salesman"
			roleIcon={ShieldCheck}
			breadcrumb="Salesman Dashboard"
			navGroups={navGroups}
		/>
	);
}
