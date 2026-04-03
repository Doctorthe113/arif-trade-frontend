import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "#/lib/auth";
import { isAuthDisabled } from "#/lib/auth-flags";

export const Route = createFileRoute("/")({
	component: IndexRoute,
});

/// Redirect based on role or show login
function IndexRoute() {
	const { user, isAuthenticated } = useAuth();

	if (isAuthDisabled) return <Navigate to="/salesman/overview" />;

	if (!isAuthenticated) return <Navigate to="/login" />;

	if (user?.role === "superadmin") return <Navigate to="/salesman/overview" />;

	return <Navigate to="/salesman/inventory" />;
}
