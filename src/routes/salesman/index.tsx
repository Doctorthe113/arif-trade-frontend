import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "#/lib/auth";
import { isAuthDisabled } from "#/lib/auth-flags";

export const Route = createFileRoute("/salesman/")({
	component: SalesmanIndexPage,
});

/// Redirect salesman index
function SalesmanIndexPage() {
	const { hasRole } = useAuth();
	const isAdminUser = isAuthDisabled || hasRole("superadmin", "editor");

	if (isAdminUser) return <Navigate to="/salesman/overview" />;

	return <Navigate to="/salesman/inventory" />;
}
