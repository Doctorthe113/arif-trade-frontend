import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
	component: AdminIndexPage,
});

/// Redirect admin index
function AdminIndexPage() {
	return <Navigate to="/admin/create-user" />;
}
