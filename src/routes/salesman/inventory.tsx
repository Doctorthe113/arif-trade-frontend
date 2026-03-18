import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { apiFetch } from "#/lib/api";

type InventoryLog = {
	id: number;
	product_name: string;
	product_code: string;
	unit_name: string;
	variant_attributes: unknown;
	quantity: number;
	action: string;
	note: string | null;
	user_name: string;
	created_at: string;
	category_name?: string;
};

type PaginatedInventory = {
	data: InventoryLog[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

type ProductVariantUnit = {
	id: number;
	unit_name: string;
	stock_quantity: number;
	unit_price: number;
};

type ProductVariant = {
	id: number;
	attributes: Record<string, unknown>;
	sku: string;
	is_active: number;
	units: ProductVariantUnit[];
};

type ProductDetail = {
	id: number;
	name: string;
	product_code: string;
	category_id: number | null;
	category_name: string | null;
	variants: ProductVariant[];
};

type PaginatedProducts = {
	data: ProductDetail[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

export const Route = createFileRoute("/salesman/inventory")({
	component: InventoryPage,
});

/// Inventory log table
function InventoryPage() {
	const [pageNumber, setPageNumber] = useState(1);
	const [dateSortDirection, setDateSortDirection] = useState<"asc" | "desc">(
		"desc",
	);
	const [categorySortDirection, setCategorySortDirection] = useState<
		"asc" | "desc"
	>("asc");

	const { data, isLoading } = useQuery({
		queryKey: ["inventory-log", pageNumber],
		queryFn: () =>
			apiFetch<PaginatedInventory>(
				`/inventory/log?per_page=20&page=${pageNumber}`,
			),
	});

	// Fetch all products to get category names and stock data
	const { data: productsData } = useQuery({
		queryKey: ["products-all"],
		queryFn: () => apiFetch<PaginatedProducts>("/products?per_page=200"),
	});

	// Fetch detailed product data for stock aggregation
	const { data: allProductDetails } = useQuery({
		queryKey: ["products-details"],
		queryFn: async () => {
			if (!productsData?.data) return [];
			const details = await Promise.all(
				productsData.data.map((product) =>
					apiFetch<ProductDetail>(`/products/${product.id}`).catch(() => null),
				),
			);
			return details.filter(Boolean) as ProductDetail[];
		},
		enabled: !!productsData?.data,
	});

	const actionVariant = (a: string) => {
		if (a === "sold") return "destructive" as const;
		if (a === "returned") return "secondary" as const;
		return "default" as const;
	};

	const formatVariantAttributes = (value: unknown) => {
		if (!value) return "—";
		if (typeof value === "string") return value;
		if (typeof value === "object") {
			return Object.entries(value as Record<string, unknown>)
				.map(([key, entryValue]) => `${key}: ${String(entryValue)}`)
				.join(", ");
		}
		return String(value);
	};

	// Build product -> category lookup
	const categoryLookup = useMemo(() => {
		const lookup: Record<string, string | null> = {};
		productsData?.data?.forEach((product) => {
			lookup[product.name] = product.category_name;
		});
		return lookup;
	}, [productsData?.data]);

	// Calculate summary statistics
	const summary = useMemo(() => {
		if (!allProductDetails)
			return { totalItems: 0, totalCategories: 0, byCategory: {} };

		let totalStock = 0;
		const categoryMap: Record<string, number> = {};
		const categorySet = new Set<string>();

		allProductDetails.forEach((product) => {
			if (product.category_name) {
				categorySet.add(product.category_name);
			}

			product.variants?.forEach((variant) => {
				variant.units?.forEach((unit) => {
					totalStock += unit.stock_quantity;

					const category = product.category_name || "Uncategorized";
					categoryMap[category] =
						(categoryMap[category] || 0) + unit.stock_quantity;
				});
			});
		});

		return {
			totalItems: totalStock,
			totalCategories: categorySet.size,
			byCategory: categoryMap,
		};
	}, [allProductDetails]);

	const inventoryRows = useMemo(() => {
		const rows = [...(data?.data ?? [])];
		rows.sort((leftLog, rightLog) => {
			const leftCategory = categoryLookup[leftLog.product_name] ?? "";
			const rightCategory = categoryLookup[rightLog.product_name] ?? "";

			if (categorySortDirection === "asc") {
				return leftCategory.localeCompare(rightCategory);
			}
			return rightCategory.localeCompare(leftCategory);
		});
		return rows;
	}, [data?.data, categorySortDirection, categoryLookup]);

	const pagination = data?.pagination;

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Inventory</h1>

			{/* Summary Cards */}
			<div className="grid grid-cols-3 gap-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total Items in Stock
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{summary.totalItems}</div>
						<p className="text-xs text-muted-foreground mt-1">
							Across all variants
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total Categories
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{summary.totalCategories}</div>
						<p className="text-xs text-muted-foreground mt-1">
							Product categories
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Stock per Category
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-1">
							{Object.entries(summary.byCategory)
								.sort(([, a], [, b]) => b - a)
								.slice(0, 3)
								.map(([category, count]) => (
									<p key={category} className="text-sm">
										<span className="font-medium">{category}:</span>{" "}
										<span className="text-muted-foreground">{count}</span>
									</p>
								))}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Inventory Log</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<p className="text-muted-foreground text-sm">Loading...</p>
					) : !inventoryRows.length ? (
						<p className="text-muted-foreground text-sm">
							No inventory logs found.
						</p>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Product</TableHead>
										<TableHead>Code</TableHead>
										<TableHead>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													setCategorySortDirection((curr) =>
														curr === "asc" ? "desc" : "asc",
													)
												}
											>
												Category (
												{categorySortDirection === "asc" ? "A-Z" : "Z-A"})
											</Button>
										</TableHead>
										<TableHead>Unit</TableHead>
										<TableHead>Variant</TableHead>
										<TableHead>Qty</TableHead>
										<TableHead>Action</TableHead>
										<TableHead>By</TableHead>
										<TableHead>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													setDateSortDirection((currentSortDirection) =>
														currentSortDirection === "asc" ? "desc" : "asc",
													)
												}
											>
												Date (
												{dateSortDirection === "asc" ? "Oldest" : "Newest"})
											</Button>
										</TableHead>
										<TableHead>Note</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{inventoryRows.map((log) => (
										<TableRow key={log.id}>
											<TableCell>{log.product_name}</TableCell>
											<TableCell className="font-mono text-xs">
												{log.product_code}
											</TableCell>
											<TableCell>
												{categoryLookup[log.product_name] || "—"}
											</TableCell>
											<TableCell>{log.unit_name}</TableCell>
											<TableCell>
												{formatVariantAttributes(log.variant_attributes)}
											</TableCell>
											<TableCell>{log.quantity}</TableCell>
											<TableCell>
												<Badge variant={actionVariant(log.action)}>
													{log.action}
												</Badge>
											</TableCell>
											<TableCell>{log.user_name}</TableCell>
											<TableCell>
												{new Date(log.created_at).toLocaleDateString()}
											</TableCell>
											<TableCell>{log.note ?? "—"}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							<div className="mt-4 flex items-center justify-between">
								<p className="text-muted-foreground text-sm">
									Page {pagination?.page ?? 1} of {pagination?.last_page ?? 1} (
									{pagination?.total ?? 0} total)
								</p>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={(pagination?.page ?? 1) <= 1}
										onClick={() =>
											setPageNumber((currentPageNumber) =>
												Math.max(1, currentPageNumber - 1),
											)
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
										onClick={() =>
											setPageNumber(
												(currentPageNumber) => currentPageNumber + 1,
											)
										}
									>
										Next
									</Button>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
