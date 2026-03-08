import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "#/lib/auth";

export const Route = createFileRoute("/")({
	component: IndexRoute,
});

/// Redirect based on role or show login
function IndexRoute() {
	const { user, isAuthenticated } = useAuth();

	if (!isAuthenticated) return <Navigate to="/login" />;

	if (user?.role === "doctor") return <Navigate to="/doctor-customer" />;
	if (user?.role === "superadmin") return <Navigate to="/salesman/overview" />;

	return <Navigate to="/salesman/overview" />;
}
