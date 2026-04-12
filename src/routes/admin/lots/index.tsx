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

type LotRow = {
	id: number;
	product_id: number;
	product_name: string;
	name: string;
	description: string | null;
	is_active: boolean;
	quantity_total: number;
	quantity_sold: number;
	quantity_left: number;
};

type PaginatedLots = {
	data: LotRow[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

type ProductRow = {
	id: number;
	name: string;
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

export const Route = createFileRoute("/admin/lots/")({
	component: AdminLotsPage,
});

function AdminLotsPage() {
	const queryClient = useQueryClient();
	const [pageNumber, setPageNumber] = useState(1);
	const [searchValue, setSearchValue] = useState("");
	const [productId, setProductId] = useState("");
	const [lotName, setLotName] = useState("");
	const [lotDescription, setLotDescription] = useState("");
	const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
	const [stockVariantUnitId, setStockVariantUnitId] = useState("");
	const [stockQty, setStockQty] = useState("");

	const lots = useQuery({
		queryKey: ["admin-lots", pageNumber, searchValue],
		queryFn: () =>
			apiFetch<PaginatedLots>(
				`/lots?per_page=15&page=${pageNumber}&search=${encodeURIComponent(searchValue)}`,
			),
	});

	const products = useQuery({
		queryKey: ["admin-products-for-lot"],
		queryFn: () => apiFetch<PaginatedProducts>("/products?per_page=200&page=1"),
	});

	const createLot = useMutation({
		mutationFn: () => {
			if (!productId || !lotName.trim()) {
				throw new Error("Select product and enter lot name");
			}
			return apiFetch("/lots", {
				method: "POST",
				body: JSON.stringify({
					product_id: Number(productId),
					name: lotName.trim(),
					description: lotDescription.trim() || null,
				}),
			});
		},
		onSuccess: () => {
			setLotName("");
			setLotDescription("");
			queryClient.invalidateQueries({ queryKey: ["admin-lots"] });
		},
	});

	const addStock = useMutation({
		mutationFn: () => {
			if (!selectedLotId) throw new Error("Select a lot first");
			const variantUnitId = Number.parseInt(stockVariantUnitId, 10);
			const quantity = Number.parseFloat(stockQty);
			if (!Number.isFinite(variantUnitId) || !Number.isFinite(quantity) || quantity <= 0) {
				throw new Error("Enter valid variant-unit id and quantity");
			}
			return apiFetch(`/lots/${selectedLotId}/stocks`, {
				method: "POST",
				body: JSON.stringify({ variant_unit_id: variantUnitId, quantity_total: quantity }),
			});
		},
		onSuccess: () => {
			setStockVariantUnitId("");
			setStockQty("");
			queryClient.invalidateQueries({ queryKey: ["admin-lots"] });
		},
	});

	const archiveLot = useMutation({
		mutationFn: (id: number) => apiFetch(`/lots/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-lots"] });
		},
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Lots Management</h1>
				<p className="text-muted-foreground text-sm">
					Create lots, add stock by variant-unit, and archive old lots.
				</p>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Create Lot</CardTitle>
						<CardDescription>Assign a new lot to a product</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<select
							className="w-full rounded-md border bg-background px-3 py-2 text-sm"
							value={productId}
							onChange={(e) => setProductId(e.target.value)}
						>
							<option value="">Select Product</option>
							{(products.data?.data ?? []).map((p) => (
								<option key={p.id} value={p.id}>
									{p.name} (#{p.id})
								</option>
							))}
						</select>
						<Input
							placeholder="Lot name"
							value={lotName}
							onChange={(e) => setLotName(e.target.value)}
						/>
						<Input
							placeholder="Description (optional)"
							value={lotDescription}
							onChange={(e) => setLotDescription(e.target.value)}
						/>
						<Button onClick={() => createLot.mutate()} disabled={createLot.isPending}>
							{createLot.isPending ? "Creating..." : "Create Lot"}
						</Button>
						{createLot.isError ? (
							<p className="text-destructive text-sm">
								{createLot.error instanceof Error ? createLot.error.message : "Failed"}
							</p>
						) : null}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Add Stock To Lot</CardTitle>
						<CardDescription>Use selected lot and variant-unit id</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm">
							Selected lot: {selectedLotId ? `#${selectedLotId}` : "none"}
						</p>
						<Input
							placeholder="Variant-Unit ID"
							type="number"
							value={stockVariantUnitId}
							onChange={(e) => setStockVariantUnitId(e.target.value)}
						/>
						<Input
							placeholder="Quantity"
							type="number"
							step="0.0001"
							value={stockQty}
							onChange={(e) => setStockQty(e.target.value)}
						/>
						<Button onClick={() => addStock.mutate()} disabled={addStock.isPending}>
							{addStock.isPending ? "Adding..." : "Add Stock"}
						</Button>
						{addStock.isError ? (
							<p className="text-destructive text-sm">
								{addStock.error instanceof Error ? addStock.error.message : "Failed"}
							</p>
						) : null}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lots</CardTitle>
					<CardDescription>Active and archived lots with balances</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Input
						placeholder="Search lot by name"
						value={searchValue}
						onChange={(e) => {
							setSearchValue(e.target.value);
							setPageNumber(1);
						}}
					/>
					{lots.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading lots...</p>
					) : lots.isError ? (
						<p className="text-destructive text-sm">
							{lots.error instanceof Error ? lots.error.message : "Failed to load lots"}
						</p>
					) : !lots.data?.data.length ? (
						<p className="text-muted-foreground text-sm">No lots found.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Lot</TableHead>
									<TableHead>Product</TableHead>
									<TableHead>Left</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{lots.data.data.map((lot) => (
									<TableRow key={lot.id}>
										<TableCell>
											<div className="font-medium">{lot.name}</div>
											<div className="text-muted-foreground text-xs">#{lot.id}</div>
										</TableCell>
										<TableCell>{lot.product_name}</TableCell>
										<TableCell>{lot.quantity_left.toLocaleString()}</TableCell>
										<TableCell>{lot.is_active ? "active" : "archived"}</TableCell>
										<TableCell className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setSelectedLotId(lot.id)}
											>
												Select
											</Button>
											{lot.is_active ? (
												<Button
													variant="outline"
													size="sm"
													onClick={() => archiveLot.mutate(lot.id)}
													disabled={archiveLot.isPending}
												>
													Archive
												</Button>
											) : null}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}

					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-xs">
							Page {lots.data?.pagination.page ?? 1} of {lots.data?.pagination.last_page ?? 1}
						</p>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={(lots.data?.pagination.page ?? 1) <= 1}
								onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={(lots.data?.pagination.page ?? 1) >= (lots.data?.pagination.last_page ?? 1)}
								onClick={() => setPageNumber((p) => p + 1)}
							>
								Next
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
