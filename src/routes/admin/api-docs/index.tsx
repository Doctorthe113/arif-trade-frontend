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

export const Route = createFileRoute("/admin/api-docs/")({
	component: AdminApiDocsPage,
});

function AdminApiDocsPage() {
	const [search, setSearch] = useState("");
	const specQuery = useQuery({
		queryKey: ["admin-api-docs-spec"],
		queryFn: () => apiFetch<SpecResponse>("/spec"),
	});

	const filteredGroups = useMemo(() => {
		const groups = specQuery.data?.groups ?? {};
		const q = search.trim().toLowerCase();
		if (!q) return groups;

		const result: Record<string, SpecEndpoint[]> = {};
		for (const [group, endpoints] of Object.entries(groups)) {
			const matched = endpoints.filter((ep) => {
				const haystack = `${ep.method} ${ep.path} ${ep.summary ?? ""}`.toLowerCase();
				return haystack.includes(q);
			});
			if (matched.length) result[group] = matched;
		}
		return result;
	}, [specQuery.data?.groups, search]);

	const groupNames = Object.keys(filteredGroups);
	const endpointCount = Object.values(filteredGroups).reduce((n, arr) => n + arr.length, 0);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">API Docs</h1>
				<p className="text-muted-foreground text-sm">
					Search and browse API groups and endpoints from /spec.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Overview</CardTitle>
					<CardDescription>
						{specQuery.data?.app ?? "ATI API"} v{specQuery.data?.version ?? "-"}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<Input
						placeholder="Search by method, path, or summary"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<p className="text-muted-foreground text-xs">
						Groups: {groupNames.length} | Endpoints: {endpointCount}
					</p>
				</CardContent>
			</Card>

			{specQuery.isLoading ? (
				<Card>
					<CardContent className="pt-6 text-sm text-muted-foreground">Loading API docs...</CardContent>
				</Card>
			) : specQuery.isError ? (
				<Card>
					<CardContent className="pt-6 text-sm text-destructive">
						{specQuery.error instanceof Error ? specQuery.error.message : "Failed to load API docs"}
					</CardContent>
				</Card>
			) : (
				groupNames.map((group) => (
					<Card key={group}>
						<CardHeader className="pb-2">
							<CardTitle>{group}</CardTitle>
							<CardDescription>{filteredGroups[group].length} endpoints</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							{filteredGroups[group].map((ep, index) => (
								<div key={`${ep.method}-${ep.path}-${index}`} className="rounded-md border p-3 text-sm">
									<div className="font-medium">
										{ep.method} {ep.path}
									</div>
									<p className="text-muted-foreground text-xs">{ep.summary ?? "No summary"}</p>
									<p className="text-muted-foreground text-xs">
										Auth: {ep.auth ? "Required" : "Public"}
										{ep.roles?.length ? ` | Roles: ${ep.roles.join(", ")}` : ""}
									</p>
								</div>
							))}
						</CardContent>
					</Card>
				))
			)}
		</div>
	);
}
