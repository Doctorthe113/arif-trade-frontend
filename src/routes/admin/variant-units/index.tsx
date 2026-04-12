import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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

type ProductRow = {
	id: number;
	name: string;
	product_code: string;
};

type PaginatedProducts = {
	data: ProductRow[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

type VariantRow = {
	id: number;
	product_id: number;
	attributes: Record<string, unknown> | null;
	sku: string | null;
	is_active: boolean;
};

type VariantUnitRow = {
	id: number;
	variant_id: number;
	unit_id: number;
	unit_name: string;
	multiplier: number;
	stock_quantity: number;
	unit_price: number;
	updated_at: string;
};

type UnitRow = {
	id: number;
	name: string;
	multiplier: number;
};

export const Route = createFileRoute("/admin/variant-units/")({
	component: AdminVariantUnitsPage,
});

function AdminVariantUnitsPage() {
	const queryClient = useQueryClient();
	const [productId, setProductId] = useState("");
	const [variantId, setVariantId] = useState("");

	const [createUnitId, setCreateUnitId] = useState("");
	const [createPrice, setCreatePrice] = useState("");
	const [createStock, setCreateStock] = useState("");

	const [editId, setEditId] = useState<number | null>(null);
	const [editPrice, setEditPrice] = useState("");
	const [editStock, setEditStock] = useState("");

	const productsQuery = useQuery({
		queryKey: ["admin-variant-units-products"],
		queryFn: () => apiFetch<PaginatedProducts>("/products?per_page=200&page=1"),
	});

	const variantsQuery = useQuery({
		queryKey: ["admin-variant-units-variants", productId],
		queryFn: () => apiFetch<VariantRow[]>(`/products/${productId}/variants`),
		enabled: !!productId,
	});

	const unitsQuery = useQuery({
		queryKey: ["admin-units"],
		queryFn: () => apiFetch<UnitRow[]>("/units"),
	});

	const variantUnitsQuery = useQuery({
		queryKey: ["admin-variant-units", variantId],
		queryFn: () => apiFetch<VariantUnitRow[]>(`/variants/${variantId}/units`),
		enabled: !!variantId,
	});

	const createVariantUnit = useMutation({
		mutationFn: () => {
			if (!variantId) throw new Error("Select a variant first");
			if (!createUnitId) throw new Error("Unit is required");
			if (createPrice.trim() === "") throw new Error("Unit price is required");
			return apiFetch(`/variants/${variantId}/units`, {
				method: "POST",
				body: JSON.stringify({
					unit_id: Number(createUnitId),
					unit_price: Number(createPrice),
					stock_quantity: createStock.trim() ? Number(createStock) : 0,
				}),
			});
		},
		onSuccess: () => {
			setCreateUnitId("");
			setCreatePrice("");
			setCreateStock("");
			queryClient.invalidateQueries({ queryKey: ["admin-variant-units", variantId] });
		},
	});

	const updateVariantUnit = useMutation({
		mutationFn: () => {
			if (!editId) throw new Error("No row selected");
			if (editPrice.trim() === "" && editStock.trim() === "") {
				throw new Error("Provide unit price or stock quantity");
			}
			const body: Record<string, number> = {};
			if (editPrice.trim() !== "") body.unit_price = Number(editPrice);
			if (editStock.trim() !== "") body.stock_quantity = Number(editStock);
			return apiFetch(`/variant-units/${editId}`, {
				method: "PUT",
				body: JSON.stringify(body),
			});
		},
		onSuccess: () => {
			setEditId(null);
			setEditPrice("");
			setEditStock("");
			queryClient.invalidateQueries({ queryKey: ["admin-variant-units", variantId] });
		},
	});

	const deleteVariantUnit = useMutation({
		mutationFn: (id: number) => apiFetch(`/variant-units/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-variant-units", variantId] });
		},
	});

	const variants = variantsQuery.data ?? [];
	const variantUnits = variantUnitsQuery.data ?? [];

	const selectedVariantLabel = useMemo(() => {
		const selected = variants.find((variant) => String(variant.id) === variantId);
		if (!selected) return "";
		const attrs = selected.attributes
			? Object.entries(selected.attributes)
					.map(([key, value]) => `${key}: ${String(value)}`)
					.join(", ")
			: "";
		return attrs || selected.sku || `Variant #${selected.id}`;
	}, [variants, variantId]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Variant-Units Management</h1>
				<p className="text-muted-foreground text-sm">
					Manage per-variant unit pricing and stock values.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Selection</CardTitle>
					<CardDescription>Choose product and variant to manage linked units</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 md:grid-cols-2">
					<select
						className="rounded-md border bg-background px-3 py-2 text-sm"
						value={productId}
						onChange={(event) => {
							setProductId(event.target.value);
							setVariantId("");
						}}
					>
						<option value="">Select product</option>
						{(productsQuery.data?.data ?? []).map((product) => (
							<option key={product.id} value={product.id}>
								{product.name} ({product.product_code})
							</option>
						))}
					</select>
					<select
						className="rounded-md border bg-background px-3 py-2 text-sm"
						value={variantId}
						onChange={(event) => setVariantId(event.target.value)}
						disabled={!productId}
					>
						<option value="">Select variant</option>
						{variants.map((variant) => {
							const label = variant.attributes
								? Object.entries(variant.attributes)
										.map(([key, value]) => `${key}: ${String(value)}`)
										.join(", ")
								: "";
							return (
								<option key={variant.id} value={variant.id}>
									{label || variant.sku || `Variant #${variant.id}`}
								</option>
							);
						})}
					</select>
				</CardContent>
			</Card>

			{variantId ? (
				<>
					<Card>
						<CardHeader>
							<CardTitle>Add Unit Link</CardTitle>
							<CardDescription>{selectedVariantLabel}</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-3 md:grid-cols-4">
							<select
								className="rounded-md border bg-background px-3 py-2 text-sm"
								value={createUnitId}
								onChange={(event) => setCreateUnitId(event.target.value)}
							>
								<option value="">Select unit</option>
								{(unitsQuery.data ?? []).map((unit) => (
									<option key={unit.id} value={unit.id}>
										{unit.name} (x{unit.multiplier})
									</option>
								))}
							</select>
							<Input
								type="number"
								placeholder="Unit price"
								value={createPrice}
								onChange={(event) => setCreatePrice(event.target.value)}
							/>
							<Input
								type="number"
								placeholder="Stock quantity"
								value={createStock}
								onChange={(event) => setCreateStock(event.target.value)}
							/>
							<Button onClick={() => createVariantUnit.mutate()} disabled={createVariantUnit.isPending}>
								{createVariantUnit.isPending ? "Adding..." : "Add"}
							</Button>
							{createVariantUnit.isError ? (
								<p className="text-destructive text-sm md:col-span-4">
									{createVariantUnit.error instanceof Error ? createVariantUnit.error.message : "Failed"}
								</p>
							) : null}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Linked Units</CardTitle>
							<CardDescription>Price and stock management for selected variant</CardDescription>
						</CardHeader>
						<CardContent>
							{variantUnitsQuery.isLoading ? (
								<p className="text-muted-foreground text-sm">Loading variant-units...</p>
							) : variantUnitsQuery.isError ? (
								<p className="text-destructive text-sm">
									{variantUnitsQuery.error instanceof Error ? variantUnitsQuery.error.message : "Failed to load variant-units"}
								</p>
							) : !variantUnits.length ? (
								<p className="text-muted-foreground text-sm">No linked units found.</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>ID</TableHead>
											<TableHead>Unit</TableHead>
											<TableHead>Price</TableHead>
											<TableHead>Stock</TableHead>
											<TableHead>Action</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{variantUnits.map((row) => (
											<TableRow key={row.id}>
												<TableCell>{row.id}</TableCell>
												<TableCell>{row.unit_name} (x{row.multiplier})</TableCell>
												<TableCell>{row.unit_price}</TableCell>
												<TableCell>{row.stock_quantity}</TableCell>
												<TableCell className="flex gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															setEditId(row.id);
															setEditPrice(String(row.unit_price));
															setEditStock(String(row.stock_quantity));
														}}
													>
														Edit
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => deleteVariantUnit.mutate(row.id)}
														disabled={deleteVariantUnit.isPending}
													>
														Delete
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
							{(updateVariantUnit.isError || deleteVariantUnit.isError) ? (
								<p className="mt-3 text-destructive text-sm">
									{updateVariantUnit.error instanceof Error
										? updateVariantUnit.error.message
										: deleteVariantUnit.error instanceof Error
											? deleteVariantUnit.error.message
											: "Action failed"}
								</p>
							) : null}
						</CardContent>
					</Card>
				</>
			) : null}

			{editId !== null ? (
				<Card>
					<CardHeader>
						<CardTitle>Edit Variant-Unit</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-3 md:grid-cols-3">
						<Input
							type="number"
							placeholder="Unit price"
							value={editPrice}
							onChange={(event) => setEditPrice(event.target.value)}
						/>
						<Input
							type="number"
							placeholder="Stock quantity"
							value={editStock}
							onChange={(event) => setEditStock(event.target.value)}
						/>
						<div className="flex gap-2">
							<Button onClick={() => updateVariantUnit.mutate()} disabled={updateVariantUnit.isPending}>
								{updateVariantUnit.isPending ? "Saving..." : "Save"}
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									setEditId(null);
									setEditPrice("");
									setEditStock("");
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
