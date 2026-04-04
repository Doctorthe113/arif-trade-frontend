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
import { apiFetch } from "#/lib/api";

type CategoryDetails = {
	id: number;
	name: string;
	created_at: string;
};

export const Route = createFileRoute("/admin/category-inspector")({
	component: AdminCategoryInspectorPage,
});

function AdminCategoryInspectorPage() {
	const [categoryInput, setCategoryInput] = useState("");
	const [categoryId, setCategoryId] = useState("");

	const categoryQuery = useQuery({
		queryKey: ["admin-category-inspector", categoryId],
		queryFn: () => apiFetch<CategoryDetails>(`/categories/${categoryId}`),
		enabled: categoryId.trim().length > 0,
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Category Inspector</h1>
				<p className="text-muted-foreground text-sm">
					Inspect one category record with core metadata.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lookup</CardTitle>
					<CardDescription>Enter category id to inspect</CardDescription>
				</CardHeader>
				<CardContent className="flex gap-3">
					<Input
						type="number"
						placeholder="Category ID"
						value={categoryInput}
						onChange={(e) => setCategoryInput(e.target.value)}
						className="max-w-xs"
					/>
					<Button onClick={() => setCategoryId(categoryInput.trim())} disabled={!categoryInput.trim()}>
						Inspect
					</Button>
				</CardContent>
			</Card>

			{categoryId ? (
				categoryQuery.isLoading ? (
					<p className="text-muted-foreground text-sm">Loading category...</p>
				) : categoryQuery.isError ? (
					<p className="text-destructive text-sm">
						{categoryQuery.error instanceof Error ? categoryQuery.error.message : "Failed to load category"}
					</p>
				) : categoryQuery.data ? (
					<Card>
						<CardHeader>
							<CardTitle>Category #{categoryQuery.data.id}</CardTitle>
							<CardDescription>{categoryQuery.data.name}</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-3 md:grid-cols-3">
							<div>
								<p className="text-muted-foreground text-xs">ID</p>
								<p className="font-medium">{categoryQuery.data.id}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Name</p>
								<p className="font-medium">{categoryQuery.data.name}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Created At</p>
								<p className="font-medium">{categoryQuery.data.created_at}</p>
							</div>
						</CardContent>
					</Card>
				) : null
			) : null}
		</div>
	);
}
