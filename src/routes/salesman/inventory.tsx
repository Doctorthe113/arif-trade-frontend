import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { apiFetch } from "#/lib/api";
import { useAuth } from "#/lib/auth";
import { isAuthDisabled } from "#/lib/auth-flags";
import { compareDateValues } from "#/lib/sort";

type InventoryLog = {
	id: number;
	product_name: string;
	product_code: string;
	expiry_date: string | null;
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
	unit_id?: number;
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
	expiry_date: string | null;
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

type Unit = {
	id: number;
	name: string;
	multiplier: number;
};

type Category = {
	id: number;
	name: string;
};

type InventoryDialogType = "none" | "add" | "update";

const numericOptionalField = z.preprocess((value) => {
	if (value === "" || value === undefined || value === null) return undefined;
	return Number(value);
}, z.number().min(0).optional());

const addInventorySchema = z.object({
	productName: z.string().min(1, "Product name required"),
	categoryId: z.string().optional(),
	description: z.string().optional(),
	expiryDate: z.string().optional(),
	variantLabel: z.string().min(1, "Variant label required"),
	sku: z.string().optional(),
	unitId: z.string().min(1, "Unit required"),
	unitPrice: z.coerce.number().min(0, "Price must be 0 or more"),
	stockQuantity: z.coerce.number().min(0, "Stock must be 0 or more"),
});

type AddInventoryForm = z.infer<typeof addInventorySchema>;
type AddInventoryFormInput = z.input<typeof addInventorySchema>;

const updateInventorySchema = z
	.object({
		variantUnitId: z.string().min(1, "Variant-unit required"),
		unitPrice: numericOptionalField,
		stockQuantity: numericOptionalField,
	})
	.refine(
		(values) =>
			typeof values.unitPrice === "number" ||
			typeof values.stockQuantity === "number",
		{ message: "Provide unit price or stock quantity", path: ["unitPrice"] },
	);

type UpdateInventoryForm = z.infer<typeof updateInventorySchema>;
type UpdateInventoryFormInput = z.input<typeof updateInventorySchema>;

export const Route = createFileRoute("/salesman/inventory")({
	component: InventoryPage,
});

/// Inventory log + admin controls
function InventoryPage() {
	const { hasRole } = useAuth();
	const canManageCatalog = isAuthDisabled || hasRole("superadmin", "editor");
	const canReadInventoryLog = isAuthDisabled || hasRole("superadmin");
	const queryClient = useQueryClient();

	const [pageNumber, setPageNumber] = useState(1);
	const [inventoryDialogType, setInventoryDialogType] =
		useState<InventoryDialogType>("none");
	const [dateSortDirection, setDateSortDirection] = useState<"asc" | "desc">(
		"desc",
	);
	const [categorySortDirection, setCategorySortDirection] = useState<
		"asc" | "desc"
	>("asc");

	const addForm = useForm<AddInventoryFormInput, unknown, AddInventoryForm>({
		resolver: zodResolver(addInventorySchema),
		defaultValues: {
			productName: "",
			categoryId: "",
			description: "",
			expiryDate: "",
			variantLabel: "",
			sku: "",
			unitId: "",
			unitPrice: 0,
			stockQuantity: 0,
		},
	});

	const updateForm = useForm<
		UpdateInventoryFormInput,
		unknown,
		UpdateInventoryForm
	>({
		resolver: zodResolver(updateInventorySchema),
		defaultValues: {
			variantUnitId: "",
			unitPrice: undefined,
			stockQuantity: undefined,
		},
	});

	const {
		data,
		isLoading,
		isError,
		error: inventoryError,
	} = useQuery({
		queryKey: ["inventory-log", pageNumber],
		queryFn: () =>
			apiFetch<PaginatedInventory>(
				`/inventory/log?per_page=20&page=${pageNumber}`,
			),
		enabled: canReadInventoryLog,
	});

	const unitsQuery = useQuery({
		queryKey: ["units"],
		queryFn: () => apiFetch<Unit[]>("/units"),
	});

	const categoriesQuery = useQuery({
		queryKey: ["categories"],
		queryFn: () => apiFetch<Category[]>("/categories"),
	});

	const productsQuery = useQuery({
		queryKey: ["products-all"],
		queryFn: () => apiFetch<PaginatedProducts>("/products?per_page=200"),
	});

	const productDetailsQuery = useQuery({
		queryKey: ["products-details"],
		queryFn: async () => {
			const products = productsQuery.data?.data ?? [];
			const details = await Promise.all(
				products.map((product) =>
					apiFetch<ProductDetail>(`/products/${product.id}`).catch(() => null),
				),
			);
			return details.filter(Boolean) as ProductDetail[];
		},
		enabled: (productsQuery.data?.data?.length ?? 0) > 0,
	});

	const addInventoryMutation = useMutation({
		mutationFn: async (values: AddInventoryForm) => {
			const createdProduct = await apiFetch<{ id: number }>("/products", {
				method: "POST",
				body: JSON.stringify({
					name: values.productName,
					...(values.categoryId
						? { category_id: Number.parseInt(values.categoryId, 10) }
						: {}),
					...(values.description ? { description: values.description } : {}),
					...(values.expiryDate ? { expiry_date: values.expiryDate } : {}),
				}),
			});

			const createdVariant = await apiFetch<{ id: number }>(
				`/products/${createdProduct.id}/variants`,
				{
					method: "POST",
					body: JSON.stringify({
						attributes: {
							label: values.variantLabel,
						},
						...(values.sku ? { sku: values.sku } : {}),
					}),
				},
			);

			return apiFetch<{ id: number }>(`/variants/${createdVariant.id}/units`, {
				method: "POST",
				body: JSON.stringify({
					unit_id: Number.parseInt(values.unitId, 10),
					unit_price: values.unitPrice,
					stock_quantity: values.stockQuantity,
				}),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products-details"] });
			queryClient.invalidateQueries({ queryKey: ["products-all"] });
			queryClient.invalidateQueries({ queryKey: ["inventory-log"] });
			setInventoryDialogType("none");
			addForm.reset({
				productName: "",
				categoryId: "",
				description: "",
				expiryDate: "",
				variantLabel: "",
				sku: "",
				unitId: "",
				unitPrice: 0,
				stockQuantity: 0,
			});
		},
	});

	const updateInventoryMutation = useMutation({
		mutationFn: (values: UpdateInventoryForm) => {
			const payload: { unit_price?: number; stock_quantity?: number } = {};
			if (typeof values.unitPrice === "number")
				payload.unit_price = values.unitPrice;
			if (typeof values.stockQuantity === "number") {
				payload.stock_quantity = values.stockQuantity;
			}

			return apiFetch(`/variant-units/${values.variantUnitId}`, {
				method: "PUT",
				body: JSON.stringify(payload),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products-details"] });
			queryClient.invalidateQueries({ queryKey: ["products-all"] });
			queryClient.invalidateQueries({ queryKey: ["inventory-log"] });
			setInventoryDialogType("none");
			updateForm.reset({
				variantUnitId: "",
				unitPrice: undefined,
				stockQuantity: undefined,
			});
		},
	});

	const actionVariant = (actionText: string) => {
		if (actionText === "in_stock") return "outline" as const;
		if (actionText === "sold") return "destructive" as const;
		if (actionText === "returned") return "secondary" as const;
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

	const categoryLookup = useMemo(() => {
		const lookup: Record<string, string | null> = {};
		productsQuery.data?.data?.forEach((product) => {
			lookup[product.name] = product.category_name;
		});
		return lookup;
	}, [productsQuery.data?.data]);

	const summary = useMemo(() => {
		if (!productDetailsQuery.data) {
			return { totalItems: 0, totalCategories: 0, byCategory: {} };
		}

		let totalStock = 0;
		const categoryMap: Record<string, number> = {};
		const categorySet = new Set<string>();

		for (const product of productDetailsQuery.data) {
			if (product.category_name) categorySet.add(product.category_name);

			for (const variant of product.variants ?? []) {
				for (const unit of variant.units ?? []) {
					totalStock += unit.stock_quantity;
					const categoryName = product.category_name ?? "Uncategorized";
					categoryMap[categoryName] =
						(categoryMap[categoryName] ?? 0) + unit.stock_quantity;
				}
			}
		}

		return {
			totalItems: totalStock,
			totalCategories: categorySet.size,
			byCategory: categoryMap,
		};
	}, [productDetailsQuery.data]);

	const inventoryRows = useMemo(() => {
		const rows = [...(data?.data ?? [])];
		rows.sort((leftLog, rightLog) => {
			const leftCategory = categoryLookup[leftLog.product_name] ?? "";
			const rightCategory = categoryLookup[rightLog.product_name] ?? "";

			const categoryComparison =
				categorySortDirection === "asc"
					? leftCategory.localeCompare(rightCategory)
					: rightCategory.localeCompare(leftCategory);

			if (categoryComparison !== 0) return categoryComparison;

			return compareDateValues(
				leftLog.created_at,
				rightLog.created_at,
				dateSortDirection,
			);
		});
		return rows;
	}, [data?.data, categorySortDirection, categoryLookup, dateSortDirection]);

	const stockRows = useMemo<InventoryLog[]>(() => {
		const rows: InventoryLog[] = [];

		for (const product of productDetailsQuery.data ?? []) {
			for (const variant of product.variants ?? []) {
				for (const unit of variant.units ?? []) {
					rows.push({
						id: unit.id,
						product_name: product.name,
						product_code: product.product_code,
						expiry_date: product.expiry_date,
						unit_name: unit.unit_name,
						variant_attributes: variant.attributes,
						quantity: unit.stock_quantity,
						action: "in_stock",
						note: null,
						user_name: "—",
						created_at: "1970-01-01",
						category_name: product.category_name ?? undefined,
					});
				}
			}
		}

		rows.sort((leftRow, rightRow) => {
			const leftCategory = categoryLookup[leftRow.product_name] ?? "";
			const rightCategory = categoryLookup[rightRow.product_name] ?? "";
			if (categorySortDirection === "asc") {
				return leftCategory.localeCompare(rightCategory);
			}
			return rightCategory.localeCompare(leftCategory);
		});

		return rows;
	}, [productDetailsQuery.data, categoryLookup, categorySortDirection]);

	const variantUnitOptions = useMemo(() => {
		const options: { value: string; label: string }[] = [];

		for (const product of productDetailsQuery.data ?? []) {
			for (const variant of product.variants ?? []) {
				const attributeText = Object.entries(variant.attributes ?? {})
					.map(([key, value]) => `${key}: ${String(value)}`)
					.join(", ");
				for (const unit of variant.units ?? []) {
					options.push({
						value: String(unit.id),
						label: `${product.name} | ${attributeText || variant.sku || "Variant"} | ${unit.unit_name}`,
					});
				}
			}
		}

		return options;
	}, [productDetailsQuery.data]);

	const pagination = data?.pagination;
	const displayedRows = canReadInventoryLog ? inventoryRows : stockRows;
	const isTableLoading = canReadInventoryLog
		? isLoading
		: productsQuery.isLoading || productDetailsQuery.isLoading;
	const tableErrorMessage = canReadInventoryLog
		? isError
			? inventoryError instanceof Error
				? inventoryError.message
				: "Failed to load inventory"
			: null
		: productsQuery.isError
			? productsQuery.error instanceof Error
				? productsQuery.error.message
				: "Failed to load products"
			: productDetailsQuery.isError
				? productDetailsQuery.error instanceof Error
					? productDetailsQuery.error.message
					: "Failed to load product details"
				: null;
	const isAddDialogOpen = inventoryDialogType === "add";
	const isUpdateDialogOpen = inventoryDialogType === "update";

	function handleAddSubmit(values: AddInventoryForm) {
		addInventoryMutation.mutate(values);
	}

	function handleUpdateSubmit(values: UpdateInventoryForm) {
		updateInventoryMutation.mutate(values);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3">
				<h1 className="text-2xl font-bold">Inventory</h1>
				{canManageCatalog && (
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							onClick={() => setInventoryDialogType("update")}
						>
							Update Inventory
						</Button>
						<Button onClick={() => setInventoryDialogType("add")}>
							Add Inventory Item
						</Button>
					</div>
				)}
			</div>

			<Dialog
				open={isAddDialogOpen}
				onOpenChange={(isOpen) =>
					setInventoryDialogType(isOpen ? "add" : "none")
				}
			>
				<DialogContent className="max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Add Inventory Item</DialogTitle>
						<DialogDescription>
							Create a new product, its first variant, and initial stock.
						</DialogDescription>
					</DialogHeader>
					<form
						onSubmit={addForm.handleSubmit(handleAddSubmit)}
						className="flex flex-col gap-4"
					>
						<div className="flex flex-col gap-2">
							<label
								htmlFor="inventory-add-product"
								className="text-sm font-medium"
							>
								Product Name
							</label>
							<Input
								id="inventory-add-product"
								placeholder="Enter product name"
								{...addForm.register("productName")}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<label
								htmlFor="inventory-add-category"
								className="text-sm font-medium"
							>
								Category (optional)
							</label>
							<Controller
								control={addForm.control}
								name="categoryId"
								render={({ field }) => (
									<Select
										value={field.value || "__none__"}
										onValueChange={(value) =>
											field.onChange(value === "__none__" ? "" : value)
										}
									>
										<SelectTrigger
											id="inventory-add-category"
											className="w-full"
										>
											<SelectValue placeholder="Select category" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="__none__">No category</SelectItem>
											{(categoriesQuery.data ?? []).map((category) => (
												<SelectItem
													key={category.id}
													value={String(category.id)}
												>
													{category.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<label
								htmlFor="inventory-add-description"
								className="text-sm font-medium"
							>
								Description (optional)
							</label>
							<Input
								id="inventory-add-description"
								placeholder="Enter description"
								{...addForm.register("description")}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<label
								htmlFor="inventory-add-expiry"
								className="text-sm font-medium"
							>
								Expiry Date (optional)
							</label>
							<Input
								id="inventory-add-expiry"
								type="date"
								{...addForm.register("expiryDate")}
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-2">
								<label
									htmlFor="inventory-add-variant"
									className="text-sm font-medium"
								>
									Variant Label
								</label>
								<Input
									id="inventory-add-variant"
									placeholder="e.g. 500mg"
									{...addForm.register("variantLabel")}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<label
									htmlFor="inventory-add-sku"
									className="text-sm font-medium"
								>
									SKU (optional)
								</label>
								<Input
									id="inventory-add-sku"
									placeholder="Enter SKU"
									{...addForm.register("sku")}
								/>
							</div>
						</div>

						<div className="flex flex-col gap-2">
							<label
								htmlFor="inventory-add-unit"
								className="text-sm font-medium"
							>
								Unit
							</label>
							<Controller
								control={addForm.control}
								name="unitId"
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger id="inventory-add-unit" className="w-full">
											<SelectValue placeholder="Select unit" />
										</SelectTrigger>
										<SelectContent>
											{(unitsQuery.data ?? []).map((unit) => (
												<SelectItem key={unit.id} value={String(unit.id)}>
													{unit.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-2">
								<label
									htmlFor="inventory-add-price"
									className="text-sm font-medium"
								>
									Unit Price
								</label>
								<Input
									id="inventory-add-price"
									type="number"
									step="0.01"
									min={0}
									{...addForm.register("unitPrice")}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<label
									htmlFor="inventory-add-stock"
									className="text-sm font-medium"
								>
									Stock Quantity
								</label>
								<Input
									id="inventory-add-stock"
									type="number"
									min={0}
									{...addForm.register("stockQuantity")}
								/>
							</div>
						</div>

						<Button type="submit" disabled={addInventoryMutation.isPending}>
							{addInventoryMutation.isPending
								? "Saving..."
								: "Create Inventory Item"}
						</Button>
						{addInventoryMutation.isError && (
							<p className="text-destructive text-sm">
								{addInventoryMutation.error instanceof Error
									? addInventoryMutation.error.message
									: "Failed to create inventory item"}
							</p>
						)}
					</form>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isUpdateDialogOpen}
				onOpenChange={(isOpen) =>
					setInventoryDialogType(isOpen ? "update" : "none")
				}
			>
				<DialogContent className="max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Update Inventory Item</DialogTitle>
						<DialogDescription>
							Select existing variant-unit and update stock or price.
						</DialogDescription>
					</DialogHeader>
					<form
						onSubmit={updateForm.handleSubmit(handleUpdateSubmit)}
						className="flex flex-col gap-4"
					>
						<div className="flex flex-col gap-2">
							<label
								htmlFor="inventory-update-variant-unit"
								className="text-sm font-medium"
							>
								Variant Unit
							</label>
							<Controller
								control={updateForm.control}
								name="variantUnitId"
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger
											id="inventory-update-variant-unit"
											className="w-full"
										>
											<SelectValue placeholder="Select variant-unit" />
										</SelectTrigger>
										<SelectContent>
											{variantUnitOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-2">
								<label
									htmlFor="inventory-update-price"
									className="text-sm font-medium"
								>
									Unit Price (optional)
								</label>
								<Input
									id="inventory-update-price"
									type="number"
									step="0.01"
									min={0}
									{...updateForm.register("unitPrice")}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<label
									htmlFor="inventory-update-stock"
									className="text-sm font-medium"
								>
									Stock Quantity (optional)
								</label>
								<Input
									id="inventory-update-stock"
									type="number"
									min={0}
									{...updateForm.register("stockQuantity")}
								/>
							</div>
						</div>

						{updateForm.formState.errors.unitPrice && (
							<p className="text-destructive text-sm">
								{updateForm.formState.errors.unitPrice.message}
							</p>
						)}

						<Button type="submit" disabled={updateInventoryMutation.isPending}>
							{updateInventoryMutation.isPending
								? "Updating..."
								: "Update Inventory Item"}
						</Button>
						{updateInventoryMutation.isError && (
							<p className="text-destructive text-sm">
								{updateInventoryMutation.error instanceof Error
									? updateInventoryMutation.error.message
									: "Failed to update inventory item"}
							</p>
						)}
					</form>
				</DialogContent>
			</Dialog>

			<div className="grid grid-cols-3 gap-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total Items in Stock
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{summary.totalItems}</div>
						<p className="mt-1 text-xs text-muted-foreground">
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
						<p className="mt-1 text-xs text-muted-foreground">
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
								.sort(([, leftCount], [, rightCount]) => rightCount - leftCount)
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
					<CardTitle>
						{canReadInventoryLog ? "Inventory Log" : "Current Stock"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isTableLoading ? (
						<p className="text-muted-foreground text-sm">Loading...</p>
					) : tableErrorMessage ? (
						<p className="text-destructive text-sm">{tableErrorMessage}</p>
					) : !displayedRows.length ? (
						<p className="text-muted-foreground text-sm">
							No inventory items found.
						</p>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Product</TableHead>
										<TableHead>Code</TableHead>
										<TableHead>Expiry</TableHead>
										<TableHead>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													setCategorySortDirection((currentDirection) =>
														currentDirection === "asc" ? "desc" : "asc",
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
										<TableHead>
											{canReadInventoryLog ? "Action" : "Status"}
										</TableHead>
										<TableHead>
											{canReadInventoryLog ? "By" : "Source"}
										</TableHead>
										<TableHead>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													setDateSortDirection((currentDirection) =>
														currentDirection === "asc" ? "desc" : "asc",
													)
												}
											>
												Date (
												{dateSortDirection === "asc" ? "Oldest" : "Newest"})
											</Button>
										</TableHead>
										<TableHead>
											{canReadInventoryLog ? "Note" : "Details"}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{displayedRows.map((log) => (
										<TableRow key={log.id}>
											<TableCell>{log.product_name}</TableCell>
											<TableCell className="font-mono text-xs">
												{log.product_code}
											</TableCell>
											<TableCell>{log.expiry_date ?? "—"}</TableCell>
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
													{log.action === "in_stock" ? "available" : log.action}
												</Badge>
											</TableCell>
											<TableCell>{log.user_name}</TableCell>
											<TableCell>
												{canReadInventoryLog
													? new Date(log.created_at).toLocaleDateString()
													: "—"}
											</TableCell>
											<TableCell>
												{canReadInventoryLog
													? (log.note ?? "—")
													: "Stock from catalog"}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							{canReadInventoryLog && (
								<div className="mt-4 flex items-center justify-between">
									<p className="text-muted-foreground text-sm">
										Page {pagination?.page ?? 1} of {pagination?.last_page ?? 1}{" "}
										({pagination?.total ?? 0} total)
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
							)}
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
