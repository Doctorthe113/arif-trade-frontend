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

export const Route = createFileRoute("/salesman")({
	component: SalesmanLayout,
});

/// Salesman dashboard layout
function SalesmanLayout() {
	const { hasRole } = useAuth();

	const navGroups = [
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
		...(hasRole("superadmin")
			? [
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
			: []),
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
