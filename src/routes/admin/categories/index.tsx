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

type CategoryRow = {
	id: number;
	name: string;
	created_at: string;
};

export const Route = createFileRoute("/admin/categories/")({
	component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
	const queryClient = useQueryClient();
	const [newCategoryName, setNewCategoryName] = useState("");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editingName, setEditingName] = useState("");

	const categories = useQuery({
		queryKey: ["admin-categories-list"],
		queryFn: () => apiFetch<CategoryRow[]>("/categories"),
	});

	const createCategory = useMutation({
		mutationFn: () => {
			if (!newCategoryName.trim()) throw new Error("Category name is required");
			return apiFetch("/categories", {
				method: "POST",
				body: JSON.stringify({ name: newCategoryName.trim() }),
			});
		},
		onSuccess: () => {
			setNewCategoryName("");
			queryClient.invalidateQueries({ queryKey: ["admin-categories-list"] });
		},
	});

	const updateCategory = useMutation({
		mutationFn: ({ id, name }: { id: number; name: string }) => {
			if (!name.trim()) throw new Error("Category name is required");
			return apiFetch(`/categories/${id}`, {
				method: "PUT",
				body: JSON.stringify({ name: name.trim() }),
			});
		},
		onSuccess: () => {
			setEditingId(null);
			setEditingName("");
			queryClient.invalidateQueries({ queryKey: ["admin-categories-list"] });
		},
	});

	const deleteCategory = useMutation({
		mutationFn: (id: number) => apiFetch(`/categories/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-categories-list"] });
		},
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Categories Management</h1>
				<p className="text-muted-foreground text-sm">
					Create, rename, and delete product categories.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Create Category</CardTitle>
					<CardDescription>Add a new category</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 sm:flex-row">
					<Input
						placeholder="Category name"
						value={newCategoryName}
						onChange={(e) => setNewCategoryName(e.target.value)}
					/>
					<Button onClick={() => createCategory.mutate()} disabled={createCategory.isPending}>
						{createCategory.isPending ? "Creating..." : "Create"}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Categories</CardTitle>
					<CardDescription>Manage existing categories</CardDescription>
				</CardHeader>
				<CardContent>
					{categories.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading categories...</p>
					) : categories.isError ? (
						<p className="text-destructive text-sm">
							{categories.error instanceof Error ? categories.error.message : "Failed to load categories"}
						</p>
					) : !categories.data?.length ? (
						<p className="text-muted-foreground text-sm">No categories found.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{categories.data.map((category) => (
									<TableRow key={category.id}>
										<TableCell>
											{editingId === category.id ? (
												<Input
													value={editingName}
													onChange={(e) => setEditingName(e.target.value)}
												/>
											) : (
												category.name
											)}
										</TableCell>
										<TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
										<TableCell className="flex gap-2">
											{editingId === category.id ? (
												<>
													<Button
														variant="outline"
														size="sm"
														onClick={() => updateCategory.mutate({ id: category.id, name: editingName })}
														disabled={updateCategory.isPending}
													>
														Save
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															setEditingId(null);
															setEditingName("");
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
															setEditingId(category.id);
															setEditingName(category.name);
														}}
													>
														Rename
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => deleteCategory.mutate(category.id)}
														disabled={deleteCategory.isPending}
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
