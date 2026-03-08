import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/salesman/")({
	component: SalesmanIndexPage,
});

/// Redirect salesman index
function SalesmanIndexPage() {
	return <Navigate to="/salesman/overview" />;
}
