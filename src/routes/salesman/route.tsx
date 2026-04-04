import { createFileRoute } from "@tanstack/react-router";
import { Shield, ShieldCheck } from "lucide-react";

import { AppLayout } from "#/components/app/app-layout";
import { useAuth } from "#/lib/auth";
import { isAuthDisabled } from "#/lib/auth-flags";
import { getSalesmanNavGroups } from "#/lib/nav-groups";

export const Route = createFileRoute("/salesman")({
	component: SalesmanLayout,
});

/// Salesman dashboard layout
function SalesmanLayout() {
	const { hasRole } = useAuth();
	const isSuperAdminUser = isAuthDisabled || hasRole("superadmin");

	const navGroups = getSalesmanNavGroups(isSuperAdminUser);
	const roleLabel = isSuperAdminUser ? "Super Admin" : "Salesman";
	const roleIcon = isSuperAdminUser ? Shield : ShieldCheck;

	return (
		<AppLayout
			roleLabel={roleLabel}
			roleIcon={roleIcon}
			breadcrumb="Salesman Dashboard"
			navGroups={navGroups}
		/>
	);
}
