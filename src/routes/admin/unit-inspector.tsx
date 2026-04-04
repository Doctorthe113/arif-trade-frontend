import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { apiFetch } from "#/lib/api";

type UnitDetails = {
	id: number;
	name: string;
	multiplier: number;
	created_at: string;
};

export const Route = createFileRoute("/admin/unit-inspector")({
	component: AdminUnitInspectorPage,
});

function AdminUnitInspectorPage() {
	const [unitInput, setUnitInput] = useState("");
	const [unitId, setUnitId] = useState("");

	const unitQuery = useQuery({
		queryKey: ["admin-unit-inspector", unitId],
		queryFn: () => apiFetch<UnitDetails>(`/units/${unitId}`),
		enabled: unitId.trim().length > 0,
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Unit Inspector</h1>
				<p className="text-muted-foreground text-sm">
					Inspect one unit definition and conversion multiplier in detail.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lookup</CardTitle>
					<CardDescription>Enter unit id to inspect</CardDescription>
				</CardHeader>
				<CardContent className="flex gap-3">
					<Input
						type="number"
						placeholder="Unit ID"
						value={unitInput}
						onChange={(e) => setUnitInput(e.target.value)}
						className="max-w-xs"
					/>
					<Button onClick={() => setUnitId(unitInput.trim())} disabled={!unitInput.trim()}>
						Inspect
					</Button>
				</CardContent>
			</Card>

			{unitId ? (
				unitQuery.isLoading ? (
					<p className="text-muted-foreground text-sm">Loading unit...</p>
				) : unitQuery.isError ? (
					<p className="text-destructive text-sm">
						{unitQuery.error instanceof Error ? unitQuery.error.message : "Failed to load unit"}
					</p>
				) : unitQuery.data ? (
					<Card>
						<CardHeader>
							<CardTitle>Unit #{unitQuery.data.id}</CardTitle>
							<CardDescription>{unitQuery.data.name}</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-3 md:grid-cols-3">
							<div>
								<p className="text-muted-foreground text-xs">Name</p>
								<p className="font-medium">{unitQuery.data.name}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Multiplier</p>
								<p className="font-medium">{unitQuery.data.multiplier}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Created At</p>
								<p className="font-medium">{unitQuery.data.created_at}</p>
							</div>
						</CardContent>
					</Card>
				) : null
			) : null}
		</div>
	);
}
