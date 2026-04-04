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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { Badge } from "#/components/ui/badge";
import { apiFetch } from "#/lib/api";

type ProductDetails = {
	id: number;
	name: string;
	product_code: string;
	description: string | null;
	is_active: boolean;
	category_id: number | null;
	category_name: string | null;
	variants: {
		id: number;
		sku: string | null;
		is_active: boolean;
		attributes: Record<string, unknown> | null;
		units: {
			id: number;
			unit_id: number;
			unit_name: string;
			multiplier: number;
			stock_quantity: number;
			unit_price: number;
		}[];
	}[];
};

type LotRow = {
	id: number;
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

export const Route = createFileRoute("/admin/product-inspector")({
	component: AdminProductInspectorPage,
});

function AdminProductInspectorPage() {
	const [productInput, setProductInput] = useState("");
	const [productId, setProductId] = useState("");

	const productQuery = useQuery({
		queryKey: ["admin-product-inspector", productId],
		queryFn: () => apiFetch<ProductDetails>(`/products/${productId}`),
		enabled: productId.trim().length > 0,
	});

	const lotsQuery = useQuery({
		queryKey: ["admin-product-inspector-lots", productId],
		queryFn: () => apiFetch<PaginatedLots>(`/lots?product_id=${productId}&per_page=50&page=1`),
		enabled: productId.trim().length > 0,
	});

	const totalVariantUnits =
		productQuery.data?.variants.reduce((acc, variant) => acc + variant.units.length, 0) ?? 0;
	const totalStock =
		productQuery.data?.variants.reduce(
			(acc, variant) =>
				acc + variant.units.reduce((inner, unitRow) => inner + unitRow.stock_quantity, 0),
			0,
		) ?? 0;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Product Inspector</h1>
				<p className="text-muted-foreground text-sm">
					Inspect one product deeply: metadata, variants, unit pricing/stock, and lot balances.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lookup</CardTitle>
					<CardDescription>Enter product id to inspect</CardDescription>
				</CardHeader>
				<CardContent className="flex gap-3">
					<Input
						type="number"
						placeholder="Product ID"
						value={productInput}
						onChange={(e) => setProductInput(e.target.value)}
						className="max-w-xs"
					/>
					<Button onClick={() => setProductId(productInput.trim())} disabled={!productInput.trim()}>
						Inspect
					</Button>
				</CardContent>
			</Card>

			{productId ? (
				productQuery.isLoading ? (
					<p className="text-muted-foreground text-sm">Loading product...</p>
				) : productQuery.isError ? (
					<p className="text-destructive text-sm">
						{productQuery.error instanceof Error ? productQuery.error.message : "Failed to load product"}
					</p>
				) : productQuery.data ? (
					<>
						<Card>
							<CardHeader>
								<CardTitle>{productQuery.data.name}</CardTitle>
								<CardDescription>
									{productQuery.data.product_code} | Category: {productQuery.data.category_name ?? "-"}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-3 md:grid-cols-4">
									<div>
										<p className="text-muted-foreground text-xs">Status</p>
										<Badge variant={productQuery.data.is_active ? "default" : "secondary"}>
											{productQuery.data.is_active ? "active" : "inactive"}
										</Badge>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Variants</p>
										<p className="font-medium">{productQuery.data.variants.length}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Variant Units</p>
										<p className="font-medium">{totalVariantUnits}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Total Stock</p>
										<p className="font-medium">{totalStock.toLocaleString()}</p>
									</div>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Description</p>
									<p className="font-medium">{productQuery.data.description ?? "-"}</p>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Variants & Unit Pricing</CardTitle>
							</CardHeader>
							<CardContent>
								{!productQuery.data.variants.length ? (
									<p className="text-muted-foreground text-sm">No variants found for this product.</p>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Variant</TableHead>
												<TableHead>Unit</TableHead>
												<TableHead>Multiplier</TableHead>
												<TableHead>Stock</TableHead>
												<TableHead>Unit Price</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{productQuery.data.variants.flatMap((variant) =>
												variant.units.map((unitRow) => (
													<TableRow key={`${variant.id}-${unitRow.id}`}>
														<TableCell>
															<div className="font-medium">SKU: {variant.sku ?? "-"}</div>
															<div className="text-muted-foreground text-xs">
																{variant.attributes
																	? Object.entries(variant.attributes)
																			.map(([k, v]) => `${k}: ${String(v)}`)
																			.join(", ")
																	: "-"}
															</div>
														</TableCell>
														<TableCell>{unitRow.unit_name}</TableCell>
														<TableCell>{unitRow.multiplier}</TableCell>
														<TableCell>{unitRow.stock_quantity.toLocaleString()}</TableCell>
														<TableCell>Tk {unitRow.unit_price.toLocaleString()}</TableCell>
													</TableRow>
												)),
											)}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Lots Snapshot</CardTitle>
								<CardDescription>
									{lotsQuery.data?.pagination.total ?? 0} lot(s) linked to this product
								</CardDescription>
							</CardHeader>
							<CardContent>
								{lotsQuery.isLoading ? (
									<p className="text-muted-foreground text-sm">Loading lots...</p>
								) : lotsQuery.isError ? (
									<p className="text-destructive text-sm">
										{lotsQuery.error instanceof Error ? lotsQuery.error.message : "Failed to load lots"}
									</p>
								) : !lotsQuery.data?.data.length ? (
									<p className="text-muted-foreground text-sm">No lots found for this product.</p>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Lot</TableHead>
												<TableHead>Status</TableHead>
												<TableHead>Total</TableHead>
												<TableHead>Sold</TableHead>
												<TableHead>Left</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{lotsQuery.data.data.map((lot) => (
												<TableRow key={lot.id}>
													<TableCell>
														<div className="font-medium">{lot.name}</div>
														<div className="text-muted-foreground text-xs">{lot.description ?? "-"}</div>
													</TableCell>
													<TableCell>{lot.is_active ? "active" : "archived"}</TableCell>
													<TableCell>{lot.quantity_total.toLocaleString()}</TableCell>
													<TableCell>{lot.quantity_sold.toLocaleString()}</TableCell>
													<TableCell>{lot.quantity_left.toLocaleString()}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>
					</>
				) : null
			) : null}
		</div>
	);
}
