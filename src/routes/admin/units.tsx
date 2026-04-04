import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { apiFetch } from "#/lib/api";

type UnitRow = {
	id: number;
	name: string;
	multiplier: number;
	created_at: string;
};

export const Route = createFileRoute("/admin/units")({
	component: AdminUnitsPage,
});

function AdminUnitsPage() {
	const queryClient = useQueryClient();
	const [newUnitName, setNewUnitName] = useState("");
	const [newMultiplier, setNewMultiplier] = useState("1");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editingName, setEditingName] = useState("");
	const [editingMultiplier, setEditingMultiplier] = useState("1");

	const units = useQuery({
		queryKey: ["admin-units-list"],
		queryFn: () => apiFetch<UnitRow[]>("/units"),
	});

	const createUnit = useMutation({
		mutationFn: () => {
			const multiplier = Number.parseFloat(newMultiplier);
			if (!newUnitName.trim()) throw new Error("Unit name is required");
			if (!Number.isFinite(multiplier) || multiplier <= 0) {
				throw new Error("Multiplier must be greater than 0");
			}
			return apiFetch("/units", {
				method: "POST",
				body: JSON.stringify({ name: newUnitName.trim(), multiplier }),
			});
		},
		onSuccess: () => {
			setNewUnitName("");
			setNewMultiplier("1");
			queryClient.invalidateQueries({ queryKey: ["admin-units-list"] });
		},
	});

	const updateUnit = useMutation({
		mutationFn: ({ id, name, multiplier }: { id: number; name: string; multiplier: string }) => {
			const parsedMultiplier = Number.parseFloat(multiplier);
			if (!name.trim()) throw new Error("Unit name is required");
			if (!Number.isFinite(parsedMultiplier) || parsedMultiplier <= 0) {
				throw new Error("Multiplier must be greater than 0");
			}
			return apiFetch(`/units/${id}`, {
				method: "PUT",
				body: JSON.stringify({ name: name.trim(), multiplier: parsedMultiplier }),
			});
		},
		onSuccess: () => {
			setEditingId(null);
			setEditingName("");
			setEditingMultiplier("1");
			queryClient.invalidateQueries({ queryKey: ["admin-units-list"] });
		},
	});

	const deleteUnit = useMutation({
		mutationFn: (id: number) => apiFetch(`/units/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-units-list"] });
		},
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Units Management</h1>
				<p className="text-muted-foreground text-sm">
					Create, update, and delete unit definitions.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Create Unit</CardTitle>
					<CardDescription>Add a new measurable/sellable unit</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 md:grid-cols-3">
					<Input
						placeholder="Unit name"
						value={newUnitName}
						onChange={(e) => setNewUnitName(e.target.value)}
					/>
					<Input
						placeholder="Multiplier"
						type="number"
						step="0.0001"
						min="0.0001"
						value={newMultiplier}
						onChange={(e) => setNewMultiplier(e.target.value)}
					/>
					<Button onClick={() => createUnit.mutate()} disabled={createUnit.isPending}>
						{createUnit.isPending ? "Creating..." : "Create"}
					</Button>
					{createUnit.isError ? (
						<p className="text-destructive text-sm md:col-span-3">
							{createUnit.error instanceof Error ? createUnit.error.message : "Failed"}
						</p>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Units</CardTitle>
					<CardDescription>Update multipliers and remove unused units</CardDescription>
				</CardHeader>
				<CardContent>
					{units.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading units...</p>
					) : units.isError ? (
						<p className="text-destructive text-sm">
							{units.error instanceof Error ? units.error.message : "Failed to load units"}
						</p>
					) : !units.data?.length ? (
						<p className="text-muted-foreground text-sm">No units found.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Multiplier</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{units.data.map((unit) => (
									<TableRow key={unit.id}>
										<TableCell>
											{editingId === unit.id ? (
												<Input
													value={editingName}
													onChange={(e) => setEditingName(e.target.value)}
												/>
											) : (
												unit.name
											)}
										</TableCell>
										<TableCell>
											{editingId === unit.id ? (
												<Input
													type="number"
													step="0.0001"
													min="0.0001"
													value={editingMultiplier}
													onChange={(e) => setEditingMultiplier(e.target.value)}
												/>
											) : (
												unit.multiplier
											)}
										</TableCell>
										<TableCell>{new Date(unit.created_at).toLocaleDateString()}</TableCell>
										<TableCell className="flex gap-2">
											{editingId === unit.id ? (
												<>
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															updateUnit.mutate({
																id: unit.id,
																name: editingName,
																multiplier: editingMultiplier,
															})
														}
														disabled={updateUnit.isPending}
													>
														Save
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															setEditingId(null);
															setEditingName("");
															setEditingMultiplier("1");
														}}
													>
														Cancel
													</Button>
												</>
											) : (
												<>
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															setEditingId(unit.id);
															setEditingName(unit.name);
															setEditingMultiplier(unit.multiplier.toString());
														}}
													>
														Edit
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => deleteUnit.mutate(unit.id)}
														disabled={deleteUnit.isPending}
													>
														Delete
													</Button>
												</>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
