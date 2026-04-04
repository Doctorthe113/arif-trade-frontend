import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Shield } from "lucide-react";

import { AppLayout } from "#/components/app/app-layout";
import { useAuth } from "#/lib/auth";
import { isAuthDisabled } from "#/lib/auth-flags";
import { getAdminNavGroups } from "#/lib/nav-groups";

export const Route = createFileRoute("/admin")({
	component: AdminLayout,
});

/// Admin layout with nav
function AdminLayout() {
	const { hasRole } = useAuth();

	if (!isAuthDisabled && !hasRole("superadmin")) {
		return <Navigate to="/" />;
	}

	const navGroups = getAdminNavGroups();

	return (
		<AppLayout
			roleLabel="Super Admin"
			roleIcon={Shield}
			breadcrumb="Admin Panel"
			navGroups={navGroups}
		/>
	);
}
