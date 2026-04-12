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

export const Route = createFileRoute("/admin/variants/")({
	component: AdminVariantsPage,
});

function AdminVariantsPage() {
	const queryClient = useQueryClient();
	const [productId, setProductId] = useState("");
	const [skuValue, setSkuValue] = useState("");
	const [attributesText, setAttributesText] = useState('{"pack":"single"}');

	const [editId, setEditId] = useState<number | null>(null);
	const [editSku, setEditSku] = useState("");
	const [editAttributesText, setEditAttributesText] = useState("{}");
	const [editActive, setEditActive] = useState(true);

	const productsQuery = useQuery({
		queryKey: ["admin-variants-products"],
		queryFn: () => apiFetch<PaginatedProducts>("/products?per_page=200&page=1"),
	});

	const variantsQuery = useQuery({
		queryKey: ["admin-variants", productId],
		queryFn: () => apiFetch<VariantRow[]>(`/products/${productId}/variants`),
		enabled: !!productId,
	});

	const createVariant = useMutation({
		mutationFn: () => {
			if (!productId) {
				throw new Error("Select a product first");
			}
			let attributes: Record<string, unknown>;
			try {
				const parsed = JSON.parse(attributesText || "{}");
				if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
					throw new Error("Attributes must be a JSON object");
				}
				attributes = parsed as Record<string, unknown>;
			} catch {
				throw new Error("Invalid attributes JSON object");
			}

			return apiFetch(`/products/${productId}/variants`, {
				method: "POST",
				body: JSON.stringify({
					attributes,
					...(skuValue.trim() ? { sku: skuValue.trim() } : {}),
				}),
			});
		},
		onSuccess: () => {
			setSkuValue("");
			setAttributesText('{"pack":"single"}');
			queryClient.invalidateQueries({ queryKey: ["admin-variants", productId] });
		},
	});

	const updateVariant = useMutation({
		mutationFn: () => {
			if (!editId) {
				throw new Error("No variant selected");
			}
			let attributes: Record<string, unknown>;
			try {
				const parsed = JSON.parse(editAttributesText || "{}");
				if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
					throw new Error("Attributes must be a JSON object");
				}
				attributes = parsed as Record<string, unknown>;
			} catch {
				throw new Error("Invalid attributes JSON object");
			}

			return apiFetch(`/variants/${editId}`, {
				method: "PUT",
				body: JSON.stringify({
					attributes,
					sku: editSku.trim() || null,
					is_active: editActive,
				}),
			});
		},
		onSuccess: () => {
			setEditId(null);
			setEditSku("");
			setEditAttributesText("{}");
			setEditActive(true);
			queryClient.invalidateQueries({ queryKey: ["admin-variants", productId] });
		},
	});

	const deleteVariant = useMutation({
		mutationFn: (id: number) => apiFetch(`/variants/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			if (editId !== null) {
				setEditId(null);
			}
			queryClient.invalidateQueries({ queryKey: ["admin-variants", productId] });
		},
	});

	const rows = variantsQuery.data ?? [];

	const selectedProductLabel = useMemo(() => {
		const found = (productsQuery.data?.data ?? []).find((product) => String(product.id) === productId);
		return found ? `${found.name} (${found.product_code})` : "";
	}, [productId, productsQuery.data?.data]);

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
				<h1 className="text-2xl font-bold">Variants Management</h1>
				<p className="text-muted-foreground text-sm">
					Manage product variants, attributes, SKU, and active state.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Select Product</CardTitle>
					<CardDescription>Choose product to view and manage its variants</CardDescription>
				</CardHeader>
				<CardContent>
					<select
						className="w-full rounded-md border bg-background px-3 py-2 text-sm md:max-w-xl"
						value={productId}
						onChange={(event) => {
							setProductId(event.target.value);
							setEditId(null);
						}}
					>
						<option value="">Select product</option>
						{(productsQuery.data?.data ?? []).map((product) => (
							<option key={product.id} value={product.id}>
								{product.name} ({product.product_code})
							</option>
						))}
					</select>
				</CardContent>
			</Card>

			{productId ? (
				<>
					<Card>
						<CardHeader>
							<CardTitle>Create Variant</CardTitle>
							<CardDescription>{selectedProductLabel}</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-3 md:grid-cols-3">
							<Input
								placeholder="SKU (optional)"
								value={skuValue}
								onChange={(event) => setSkuValue(event.target.value)}
							/>
							<Input
								placeholder='Attributes JSON e.g. {"pack":"single"}'
								value={attributesText}
								onChange={(event) => setAttributesText(event.target.value)}
							/>
							<Button onClick={() => createVariant.mutate()} disabled={createVariant.isPending}>
								{createVariant.isPending ? "Creating..." : "Create"}
							</Button>
							{createVariant.isError ? (
								<p className="text-destructive text-sm md:col-span-3">
									{createVariant.error instanceof Error ? createVariant.error.message : "Failed"}
								</p>
							) : null}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Variants List</CardTitle>
							<CardDescription>Edit or delete variants for selected product</CardDescription>
						</CardHeader>
						<CardContent>
							{variantsQuery.isLoading ? (
								<p className="text-muted-foreground text-sm">Loading variants...</p>
							) : variantsQuery.isError ? (
								<p className="text-destructive text-sm">
									{variantsQuery.error instanceof Error ? variantsQuery.error.message : "Failed to load variants"}
								</p>
							) : !rows.length ? (
								<p className="text-muted-foreground text-sm">No variants found.</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>ID</TableHead>
											<TableHead>SKU</TableHead>
											<TableHead>Attributes</TableHead>
											<TableHead>Active</TableHead>
											<TableHead>Action</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{rows.map((row) => (
											<TableRow key={row.id}>
												<TableCell>{row.id}</TableCell>
												<TableCell>{row.sku || "-"}</TableCell>
												<TableCell className="max-w-[320px] text-xs">{formatAttributes(row.attributes)}</TableCell>
												<TableCell>{row.is_active ? "active" : "inactive"}</TableCell>
												<TableCell className="flex gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															setEditId(row.id);
															setEditSku(row.sku || "");
															setEditAttributesText(JSON.stringify(row.attributes || {}, null, 0));
															setEditActive(Boolean(row.is_active));
														}}
													>
														Edit
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => deleteVariant.mutate(row.id)}
														disabled={deleteVariant.isPending}
													>
														Delete
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
							{(updateVariant.isError || deleteVariant.isError) ? (
								<p className="mt-3 text-destructive text-sm">
									{updateVariant.error instanceof Error
										? updateVariant.error.message
										: deleteVariant.error instanceof Error
											? deleteVariant.error.message
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
						<CardTitle>Edit Variant</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-3 md:grid-cols-3">
						<Input
							placeholder="SKU"
							value={editSku}
							onChange={(event) => setEditSku(event.target.value)}
						/>
						<Input
							placeholder="Attributes JSON"
							value={editAttributesText}
							onChange={(event) => setEditAttributesText(event.target.value)}
						/>
						<div className="flex items-center gap-2 rounded-md border px-3 py-2">
							<input
								type="checkbox"
								id="variant-active"
								checked={editActive}
								onChange={(event) => setEditActive(event.target.checked)}
							/>
							<label htmlFor="variant-active" className="text-sm">
								Active variant
							</label>
						</div>
						<div className="flex gap-2 md:col-span-3">
							<Button onClick={() => updateVariant.mutate()} disabled={updateVariant.isPending}>
								{updateVariant.isPending ? "Saving..." : "Save"}
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									setEditId(null);
									setEditSku("");
									setEditAttributesText("{}");
									setEditActive(true);
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
