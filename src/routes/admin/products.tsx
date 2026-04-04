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

type ProductRow = {
	id: number;
	name: string;
	product_code: string;
	description: string | null;
	is_active: boolean;
	category_id: number | null;
	category_name: string | null;
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

type CategoryRow = {
	id: number;
	name: string;
};

export const Route = createFileRoute("/admin/products")({
	component: AdminProductsPage,
});

function AdminProductsPage() {
	const queryClient = useQueryClient();
	const [pageNumber, setPageNumber] = useState(1);
	const [searchValue, setSearchValue] = useState("");
	const [nameValue, setNameValue] = useState("");
	const [categoryValue, setCategoryValue] = useState("");
	const [descriptionValue, setDescriptionValue] = useState("");

	const products = useQuery({
		queryKey: ["admin-products", pageNumber, searchValue],
		queryFn: () =>
			apiFetch<PaginatedProducts>(
				`/products?per_page=15&page=${pageNumber}&search=${encodeURIComponent(searchValue)}`,
			),
	});

	const categories = useQuery({
		queryKey: ["admin-categories"],
		queryFn: () => apiFetch<CategoryRow[]>("/categories"),
	});

	const createProduct = useMutation({
		mutationFn: () => {
			if (!nameValue.trim()) {
				throw new Error("Product name is required");
			}
			return apiFetch("/products", {
				method: "POST",
				body: JSON.stringify({
					name: nameValue.trim(),
					...(categoryValue ? { category_id: Number(categoryValue) } : {}),
					...(descriptionValue.trim()
						? { description: descriptionValue.trim() }
						: {}),
				}),
			});
		},
		onSuccess: () => {
			setNameValue("");
			setCategoryValue("");
			setDescriptionValue("");
			queryClient.invalidateQueries({ queryKey: ["admin-products"] });
		},
	});

	const toggleProduct = useMutation({
		mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
			apiFetch(`/products/${id}`, {
				method: "PUT",
				body: JSON.stringify({ is_active: !isActive }),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-products"] });
		},
	});

	const deleteProduct = useMutation({
		mutationFn: (id: number) => apiFetch(`/products/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-products"] });
		},
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Products Management</h1>
				<p className="text-muted-foreground text-sm">
					Create products, toggle active state, and remove products.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Create Product</CardTitle>
					<CardDescription>Quick product creation for admin</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 md:grid-cols-4">
					<Input
						placeholder="Product name"
						value={nameValue}
						onChange={(e) => setNameValue(e.target.value)}
					/>
					<select
						className="rounded-md border bg-background px-3 py-2 text-sm"
						value={categoryValue}
						onChange={(e) => setCategoryValue(e.target.value)}
					>
						<option value="">No category</option>
						{(categories.data ?? []).map((category) => (
							<option key={category.id} value={category.id}>
								{category.name}
							</option>
						))}
					</select>
					<Input
						placeholder="Description (optional)"
						value={descriptionValue}
						onChange={(e) => setDescriptionValue(e.target.value)}
					/>
					<Button onClick={() => createProduct.mutate()} disabled={createProduct.isPending}>
						{createProduct.isPending ? "Creating..." : "Create"}
					</Button>
					{createProduct.isError ? (
						<p className="text-destructive text-sm md:col-span-4">
							{createProduct.error instanceof Error ? createProduct.error.message : "Failed"}
						</p>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Products List</CardTitle>
					<CardDescription>Search and manage product status</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Input
						placeholder="Search by name or code"
						value={searchValue}
						onChange={(e) => {
							setSearchValue(e.target.value);
							setPageNumber(1);
						}}
					/>
					{products.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading products...</p>
					) : products.isError ? (
						<p className="text-destructive text-sm">
							{products.error instanceof Error ? products.error.message : "Failed to load products"}
						</p>
					) : !products.data?.data.length ? (
						<p className="text-muted-foreground text-sm">No products found.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Product</TableHead>
									<TableHead>Code</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{products.data.data.map((product) => (
									<TableRow key={product.id}>
										<TableCell className="font-medium">{product.name}</TableCell>
										<TableCell>{product.product_code}</TableCell>
										<TableCell>{product.category_name ?? "—"}</TableCell>
										<TableCell>{product.is_active ? "active" : "inactive"}</TableCell>
										<TableCell className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													toggleProduct.mutate({ id: product.id, isActive: product.is_active })
												}
												disabled={toggleProduct.isPending}
											>
												{product.is_active ? "Deactivate" : "Activate"}
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => deleteProduct.mutate(product.id)}
												disabled={deleteProduct.isPending}
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
							Page {products.data?.pagination.page ?? 1} of {products.data?.pagination.last_page ?? 1}
						</p>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={(products.data?.pagination.page ?? 1) <= 1}
								onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={(products.data?.pagination.page ?? 1) >= (products.data?.pagination.last_page ?? 1)}
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
