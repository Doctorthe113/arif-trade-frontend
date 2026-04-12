import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { apiFetch } from "#/lib/api";

type HealthResponse = {
	status: string;
	version: string;
};

type MeResponse = {
	id: number;
	name: string;
	email: string;
	role: string;
	is_active: boolean;
	created_at: string;
};

type SpecResponse = {
	app: string;
	version: string;
	base_url: string;
	groups: Record<string, unknown[]>;
};

export const Route = createFileRoute("/admin/system/")({
	component: AdminSystemPage,
});

function AdminSystemPage() {
	const healthQuery = useQuery({
		queryKey: ["admin-system-health"],
		queryFn: () => apiFetch<HealthResponse>("/health"),
	});

	const meQuery = useQuery({
		queryKey: ["admin-system-me"],
		queryFn: () => apiFetch<MeResponse>("/auth/me"),
	});

	const specQuery = useQuery({
		queryKey: ["admin-system-spec"],
		queryFn: () => apiFetch<SpecResponse>("/spec"),
	});

	const groups = specQuery.data?.groups ?? {};
	const groupCount = Object.keys(groups).length;
	const endpointCount = Object.values(groups).reduce(
		(total, rows) => total + rows.length,
		0,
	);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">System</h1>
				<p className="text-muted-foreground text-sm">
					Service health, current authenticated admin, and API spec overview.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Health</CardDescription>
						<CardTitle>
							{healthQuery.isLoading
								? "Loading..."
								: healthQuery.data?.status ?? "Unavailable"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-xs">
							Version: {healthQuery.data?.version ?? "-"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Spec Groups</CardDescription>
						<CardTitle>{specQuery.isLoading ? "..." : groupCount}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-xs">
							Endpoints: {specQuery.isLoading ? "..." : endpointCount}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Current Admin</CardDescription>
						<CardTitle>{meQuery.isLoading ? "Loading..." : meQuery.data?.name ?? "-"}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-xs">
							{meQuery.data?.email ?? ""}
						</p>
						<p className="text-muted-foreground text-xs">Role: {meQuery.data?.role ?? "-"}</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>API Spec Snapshot</CardTitle>
					<CardDescription>Top-level metadata from /spec</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					{specQuery.isLoading ? (
						<p className="text-muted-foreground">Loading API spec...</p>
					) : specQuery.isError ? (
						<p className="text-destructive">
							{specQuery.error instanceof Error ? specQuery.error.message : "Failed to load spec"}
						</p>
					) : (
						<>
							<p><span className="font-medium">App:</span> {specQuery.data?.app ?? "-"}</p>
							<p><span className="font-medium">Version:</span> {specQuery.data?.version ?? "-"}</p>
							<p><span className="font-medium">Base URL:</span> {specQuery.data?.base_url ?? "-"}</p>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
