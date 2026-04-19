import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
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

type InventoryAction = "handover" | "sold" | "returned";

type InventoryRow = {
	id: number;
	variant_unit_id: number;
	quantity: number | string;
	action: InventoryAction;
	related_id: number | null;
	note: string | null;
	created_at: string;
	user_name: string | null;
	product_id: number;
	product_name: string;
	product_code: string;
	expiry_date: string | null;
	unit_name: string;
	variant_attributes: Record<string, unknown> | null;
};

type PaginatedInventory = {
	data: InventoryRow[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

export const Route = createFileRoute("/admin/inventory/")({
	component: AdminInventoryPage,
});

function AdminInventoryPage() {
	const queryClient = useQueryClient();
	const [pageNumber, setPageNumber] = useState(1);
	const [actionFilter, setActionFilter] = useState("");
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");
	const [variantUnitFilter, setVariantUnitFilter] = useState("");

	const [createVariantUnitId, setCreateVariantUnitId] = useState("");
	const [createQuantity, setCreateQuantity] = useState("");
	const [createAction, setCreateAction] = useState<InventoryAction>("returned");
	const [createRelatedId, setCreateRelatedId] = useState("");
	const [createNote, setCreateNote] = useState("");

	const [editId, setEditId] = useState<number | null>(null);
	const [editVariantUnitId, setEditVariantUnitId] = useState("");
	const [editQuantity, setEditQuantity] = useState("");
	const [editAction, setEditAction] = useState<InventoryAction>("returned");
	const [editRelatedId, setEditRelatedId] = useState("");
	const [editNote, setEditNote] = useState("");

	const logs = useQuery({
		queryKey: [
			"admin-inventory",
			pageNumber,
			actionFilter,
			fromDate,
			toDate,
			variantUnitFilter,
		],
		queryFn: () =>
			apiFetch<PaginatedInventory>(
				`/inventory/log?per_page=20&page=${pageNumber}${actionFilter ? `&action=${encodeURIComponent(actionFilter)}` : ""}${fromDate ? `&from=${encodeURIComponent(fromDate)}` : ""}${toDate ? `&to=${encodeURIComponent(toDate)}` : ""}${variantUnitFilter.trim() ? `&variant_unit_id=${encodeURIComponent(variantUnitFilter.trim())}` : ""}`,
			),
	});

	const createEntry = useMutation({
		mutationFn: () => {
			if (!createVariantUnitId.trim()) {
				throw new Error("Variant-unit id is required");
			}
			if (!createQuantity.trim() || Number(createQuantity) === 0) {
				throw new Error("Quantity must be non-zero");
			}
			return apiFetch("/inventory", {
				method: "POST",
				body: JSON.stringify({
					variant_unit_id: Number(createVariantUnitId),
					quantity: Number(createQuantity),
					action: createAction,
					...(createRelatedId.trim()
						? { related_id: Number(createRelatedId) }
						: {}),
					...(createNote.trim() ? { note: createNote.trim() } : {}),
				}),
			});
		},
		onSuccess: () => {
			setCreateVariantUnitId("");
			setCreateQuantity("");
			setCreateAction("returned");
			setCreateRelatedId("");
			setCreateNote("");
			queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
		},
	});

	const updateEntry = useMutation({
		mutationFn: () => {
			if (!editId) {
				throw new Error("No inventory entry selected");
			}
			if (!editVariantUnitId.trim()) {
				throw new Error("Variant-unit id is required");
			}
			if (!editQuantity.trim() || Number(editQuantity) === 0) {
				throw new Error("Quantity must be non-zero");
			}
			return apiFetch(`/inventory/${editId}`, {
				method: "PUT",
				body: JSON.stringify({
					variant_unit_id: Number(editVariantUnitId),
					quantity: Number(editQuantity),
					action: editAction,
					related_id: editRelatedId.trim() ? Number(editRelatedId) : null,
					note: editNote.trim() || null,
				}),
			});
		},
		onSuccess: () => {
			setEditId(null);
			setEditVariantUnitId("");
			setEditQuantity("");
			setEditAction("returned");
			setEditRelatedId("");
			setEditNote("");
			queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
		},
	});

	const deleteEntry = useMutation({
		mutationFn: (id: number) =>
			apiFetch(`/inventory/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			if (editId !== null) {
				setEditId(null);
			}
			queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
		},
	});

	const rows = logs.data?.data ?? [];
	const pagination = logs.data?.pagination;

	const actionVariant = (action: InventoryAction) => {
		if (action === "sold") return "destructive" as const;
		if (action === "returned") return "secondary" as const;
		return "default" as const;
	};

	const formatAttributes = (attributes: Record<string, unknown> | null) => {
		if (!attributes) return "-";
		const text = Object.entries(attributes)
			.map(([key, value]) => `${key}: ${String(value)}`)
			.join(", ");
		return text || "-";
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Inventory Management</h1>
				<p className="text-muted-foreground text-sm">
					Monitor inventory logs and make manual stock movement adjustments.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Add Inventory Log Entry</CardTitle>
					<CardDescription>
						Create a manual handover/sold/returned entry
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 md:grid-cols-3">
					<Input
						placeholder="Variant-unit ID"
						value={createVariantUnitId}
						onChange={(e) => setCreateVariantUnitId(e.target.value)}
					/>
					<Input
						type="number"
						placeholder="Quantity"
						value={createQuantity}
						onChange={(e) => setCreateQuantity(e.target.value)}
					/>
					<select
						className="rounded-md border bg-background px-3 py-2 text-sm"
						value={createAction}
						onChange={(e) => setCreateAction(e.target.value as InventoryAction)}
					>
						<option value="handover">handover</option>
						<option value="sold">sold</option>
						<option value="returned">returned</option>
					</select>
					<Input
						placeholder="Related ID (optional)"
						value={createRelatedId}
						onChange={(e) => setCreateRelatedId(e.target.value)}
					/>
					<Input
						placeholder="Note (optional)"
						value={createNote}
						onChange={(e) => setCreateNote(e.target.value)}
					/>
					<Button
						onClick={() => createEntry.mutate()}
						disabled={createEntry.isPending}
					>
						{createEntry.isPending ? "Adding..." : "Add Entry"}
					</Button>
					{createEntry.isError ? (
						<p className="text-destructive text-sm md:col-span-3">
							{createEntry.error instanceof Error
								? createEntry.error.message
								: "Failed"}
						</p>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Inventory Log</CardTitle>
					<CardDescription>
						Filter and manage inventory movements
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-3 md:grid-cols-5">
						<select
							className="rounded-md border bg-background px-3 py-2 text-sm"
							value={actionFilter}
							onChange={(e) => {
								setActionFilter(e.target.value);
								setPageNumber(1);
							}}
						>
							<option value="">All actions</option>
							<option value="handover">handover</option>
							<option value="sold">sold</option>
							<option value="returned">returned</option>
						</select>
						<Input
							placeholder="Variant-unit ID"
							value={variantUnitFilter}
							onChange={(e) => {
								setVariantUnitFilter(e.target.value);
								setPageNumber(1);
							}}
						/>
						<Input
							type="date"
							value={fromDate}
							onChange={(e) => {
								setFromDate(e.target.value);
								setPageNumber(1);
							}}
						/>
						<Input
							type="date"
							value={toDate}
							onChange={(e) => {
								setToDate(e.target.value);
								setPageNumber(1);
							}}
						/>
						<Button
							variant="outline"
							onClick={() => {
								setActionFilter("");
								setVariantUnitFilter("");
								setFromDate("");
								setToDate("");
								setPageNumber(1);
							}}
						>
							Reset
						</Button>
					</div>

					{logs.isLoading ? (
						<p className="text-muted-foreground text-sm">
							Loading inventory log...
						</p>
					) : logs.isError ? (
						<p className="text-destructive text-sm">
							{logs.error instanceof Error
								? logs.error.message
								: "Failed to load inventory log"}
						</p>
					) : !rows.length ? (
						<p className="text-muted-foreground text-sm">
							No inventory log entries found.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Time</TableHead>
									<TableHead>Product</TableHead>
									<TableHead>Expiry</TableHead>
									<TableHead>Variant</TableHead>
									<TableHead>Action</TableHead>
									<TableHead>Qty</TableHead>
									<TableHead>User</TableHead>
									<TableHead>Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((row) => (
									<TableRow key={row.id}>
										<TableCell>{row.id}</TableCell>
										<TableCell>{row.created_at}</TableCell>
										<TableCell>
											<div className="font-medium">{row.product_name}</div>
											<div className="text-muted-foreground text-xs">
												{row.product_code} | {row.unit_name}
											</div>
										</TableCell>
										<TableCell>{row.expiry_date ?? "-"}</TableCell>
										<TableCell className="max-w-55 text-xs">
											{formatAttributes(row.variant_attributes)}
										</TableCell>
										<TableCell>
											<Badge variant={actionVariant(row.action)}>
												{row.action}
											</Badge>
										</TableCell>
										<TableCell>
											{Number(row.quantity).toLocaleString()}
										</TableCell>
										<TableCell>{row.user_name ?? "-"}</TableCell>
										<TableCell className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setEditId(row.id);
													setEditVariantUnitId(String(row.variant_unit_id));
													setEditQuantity(String(row.quantity));
													setEditAction(row.action);
													setEditRelatedId(
														row.related_id ? String(row.related_id) : "",
													);
													setEditNote(row.note ?? "");
												}}
											>
												Edit
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => deleteEntry.mutate(row.id)}
												disabled={deleteEntry.isPending}
											>
												Delete
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-xs">
							Page {pagination?.page ?? 1} of {pagination?.last_page ?? 1}
						</p>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={(pagination?.page ?? 1) <= 1}
								onClick={() =>
									setPageNumber((currentPage) => Math.max(1, currentPage - 1))
								}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={
									(pagination?.page ?? 1) >= (pagination?.last_page ?? 1)
								}
								onClick={() => setPageNumber((currentPage) => currentPage + 1)}
							>
								Next
							</Button>
						</div>
					</div>
					{updateEntry.isError || deleteEntry.isError ? (
						<p className="text-destructive text-sm">
							{updateEntry.error instanceof Error
								? updateEntry.error.message
								: deleteEntry.error instanceof Error
									? deleteEntry.error.message
									: "Action failed"}
						</p>
					) : null}
				</CardContent>
			</Card>

			{editId !== null ? (
				<Card>
					<CardHeader>
						<CardTitle>Edit Inventory Log Entry</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-3 md:grid-cols-3">
						<Input
							placeholder="Variant-unit ID"
							value={editVariantUnitId}
							onChange={(e) => setEditVariantUnitId(e.target.value)}
						/>
						<Input
							type="number"
							placeholder="Quantity"
							value={editQuantity}
							onChange={(e) => setEditQuantity(e.target.value)}
						/>
						<select
							className="rounded-md border bg-background px-3 py-2 text-sm"
							value={editAction}
							onChange={(e) => setEditAction(e.target.value as InventoryAction)}
						>
							<option value="handover">handover</option>
							<option value="sold">sold</option>
							<option value="returned">returned</option>
						</select>
						<Input
							placeholder="Related ID"
							value={editRelatedId}
							onChange={(e) => setEditRelatedId(e.target.value)}
						/>
						<Input
							placeholder="Note"
							value={editNote}
							onChange={(e) => setEditNote(e.target.value)}
						/>
						<div className="flex gap-2">
							<Button
								onClick={() => updateEntry.mutate()}
								disabled={updateEntry.isPending}
							>
								{updateEntry.isPending ? "Saving..." : "Save"}
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									setEditId(null);
									setEditVariantUnitId("");
									setEditQuantity("");
									setEditAction("returned");
									setEditRelatedId("");
									setEditNote("");
								}}
							>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}
