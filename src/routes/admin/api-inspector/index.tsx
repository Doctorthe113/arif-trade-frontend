import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { apiFetch } from "#/lib/api";

type HealthResponse = {
	status: string;
	version: string;
	timestamp?: string;
};

type SpecEndpoint = {
	method: string;
	path: string;
	summary?: string;
	auth?: boolean;
	roles?: string[];
};

type SpecResponse = {
	app: string;
	version: string;
	groups: Record<string, SpecEndpoint[]>;
};

export const Route = createFileRoute("/admin/api-inspector/")({
	component: AdminApiInspectorPage,
});

function AdminApiInspectorPage() {
	const [search, setSearch] = useState("");

	const healthQuery = useQuery({
		queryKey: ["admin-api-inspector-health"],
		queryFn: () => apiFetch<HealthResponse>("/health"),
	});

	const specQuery = useQuery({
		queryKey: ["admin-api-inspector-spec"],
		queryFn: () => apiFetch<SpecResponse>("/spec"),
	});

	const filtered = useMemo(() => {
		const groups = specQuery.data?.groups ?? {};
		const q = search.trim().toLowerCase();
		if (!q) return groups;

		const result: Record<string, SpecEndpoint[]> = {};
		for (const [group, endpoints] of Object.entries(groups)) {
			const rows = endpoints.filter((row) => {
				const text = `${row.method} ${row.path} ${row.summary ?? ""}`.toLowerCase();
				return text.includes(q);
			});
			if (rows.length) result[group] = rows;
		}
		return result;
	}, [specQuery.data?.groups, search]);

	const groupCount = Object.keys(filtered).length;
	const endpointCount = Object.values(filtered).reduce((acc, arr) => acc + arr.length, 0);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">API Inspector</h1>
				<p className="text-muted-foreground text-sm">
					Inspect runtime health and API surface from live endpoints.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Health</CardDescription>
						<CardTitle>
							{healthQuery.isLoading
								? "Loading..."
								: healthQuery.data?.status ?? "unknown"}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>API Version</CardDescription>
						<CardTitle>{specQuery.data?.version ?? "-"}</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Visible Endpoints</CardDescription>
						<CardTitle>{endpointCount}</CardTitle>
					</CardHeader>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Spec Browser</CardTitle>
					<CardDescription>
						Groups: {groupCount} | Endpoints: {endpointCount}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Input
						placeholder="Search by method, path, or summary"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>

					{specQuery.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading spec...</p>
					) : specQuery.isError ? (
						<p className="text-destructive text-sm">
							{specQuery.error instanceof Error ? specQuery.error.message : "Failed to load spec"}
						</p>
					) : (
						Object.entries(filtered).map(([group, endpoints]) => (
							<div key={group} className="rounded-md border p-3">
								<p className="mb-2 text-sm font-semibold">{group}</p>
								<div className="space-y-1 text-sm">
									{endpoints.map((ep, idx) => (
										<div key={`${group}-${ep.method}-${ep.path}-${idx}`} className="flex flex-wrap gap-2">
											<span className="font-medium">{ep.method}</span>
											<span>{ep.path}</span>
											<span className="text-muted-foreground">{ep.summary ?? ""}</span>
										</div>
									))}
								</div>
							</div>
						))
					)}
				</CardContent>
			</Card>
		</div>
	);
}
