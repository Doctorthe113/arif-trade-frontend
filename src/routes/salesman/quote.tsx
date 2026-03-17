import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
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

type Quotation = {
	id: number;
	salesman_name: string;
	customer_name: string | null;
	status: string;
	note: string | null;
	requested_at: string;
};

type PaginatedQuotations = {
	data: Quotation[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

export const Route = createFileRoute("/salesman/quote")({
	component: QuotePage,
});

/// Quotation creation + list
function QuotePage() {
	const queryClient = useQueryClient();
	const [showForm, setShowForm] = useState(false);
	const [note, setNote] = useState("");
	const [items, setItems] = useState<
		{ id: number; variant_unit_id: string; quantity: string }[]
	>([{ id: 1, variant_unit_id: "", quantity: "1" }]);
	const [nextId, setNextId] = useState(2);
	const [pageNumber, setPageNumber] = useState(1);
	const [dateSortDirection, setDateSortDirection] = useState<"asc" | "desc">(
		"desc",
	);

	const { data, isLoading } = useQuery({
		queryKey: ["quotations", pageNumber],
		queryFn: () =>
			apiFetch<PaginatedQuotations>(
				`/quotations?per_page=20&page=${pageNumber}`,
			),
	});

	const createMutation = useMutation({
		mutationFn: (body: {
			items: { variant_unit_id: number; quantity: number }[];
			note?: string;
		}) =>
			apiFetch<{ id: number }>("/quotations", {
				method: "POST",
				body: JSON.stringify(body),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["quotations"] });
			setShowForm(false);
			setNote("");
			setItems([{ id: 1, variant_unit_id: "", quantity: "1" }]);
			setNextId(2);
		},
	});

	function handleAddItem() {
		setItems([...items, { id: nextId, variant_unit_id: "", quantity: "1" }]);
		setNextId(nextId + 1);
	}

	function handleRemoveItem(index: number) {
		setItems(items.filter((_, i) => i !== index));
	}

	function handleItemChange(
		index: number,
		field: "variant_unit_id" | "quantity",
		value: string,
	) {
		const updated = [...items];
		updated[index] = { ...updated[index], [field]: value };
		setItems(updated);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const parsedItems = items
			.filter((i) => i.variant_unit_id)
			.map((i) => ({
				variant_unit_id: Number.parseInt(i.variant_unit_id, 10),
				quantity: Number.parseInt(i.quantity, 10) || 1,
			}));
		if (parsedItems.length === 0) return;
		createMutation.mutate({
			items: parsedItems,
			...(note ? { note } : {}),
		});
	}

	const statusVariant = (s: string) => {
		if (s === "accepted") return "default" as const;
		if (s === "rejected") return "destructive" as const;
		if (s === "pending") return "secondary" as const;
		return "outline" as const;
	};

	const quotations = useMemo(() => {
		const rows = [...(data?.data ?? [])];
		rows.sort((leftQuotation, rightQuotation) => {
			const leftTimeMs = new Date(leftQuotation.requested_at).getTime();
			const rightTimeMs = new Date(rightQuotation.requested_at).getTime();
			return dateSortDirection === "asc"
				? leftTimeMs - rightTimeMs
				: rightTimeMs - leftTimeMs;
		});
		return rows;
	}, [data?.data, dateSortDirection]);

	const pagination = data?.pagination;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Quotations</h1>
				<Button onClick={() => setShowForm(!showForm)}>
					{showForm ? "Cancel" : "New Quotation"}
				</Button>
			</div>

			{showForm && (
				<Card>
					<CardHeader>
						<CardTitle>Create Quotation</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							{items.map((item, i) => (
								<div key={item.id} className="flex items-center gap-2">
									<Input
										type="number"
										placeholder="Variant Unit ID"
										value={item.variant_unit_id}
										onChange={(e) =>
											handleItemChange(i, "variant_unit_id", e.target.value)
										}
										className="flex-1"
									/>
									<Input
										type="number"
										placeholder="Qty"
										value={item.quantity}
										onChange={(e) =>
											handleItemChange(i, "quantity", e.target.value)
										}
										className="w-24"
									/>
									{items.length > 1 && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => handleRemoveItem(i)}
										>
											Remove
										</Button>
									)}
								</div>
							))}
							<Button type="button" variant="outline" onClick={handleAddItem}>
								Add Item
							</Button>
							<Input
								placeholder="Note (optional)"
								value={note}
								onChange={(e) => setNote(e.target.value)}
							/>
							<Button type="submit" disabled={createMutation.isPending}>
								{createMutation.isPending ? "Creating..." : "Submit Quotation"}
							</Button>
							{createMutation.isError && (
								<p className="text-destructive text-sm">
									{createMutation.error instanceof Error
										? createMutation.error.message
										: "Failed"}
								</p>
							)}
						</form>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>All Quotations</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<p className="text-muted-foreground text-sm">Loading...</p>
					) : !quotations.length ? (
						<p className="text-muted-foreground text-sm">
							No quotations found.
						</p>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>ID</TableHead>
										<TableHead>Salesman</TableHead>
										<TableHead>Customer</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Note</TableHead>
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
									</TableRow>
								</TableHeader>
								<TableBody>
									{quotations.map((q) => (
										<TableRow key={q.id}>
											<TableCell>{q.id}</TableCell>
											<TableCell>{q.salesman_name}</TableCell>
											<TableCell>{q.customer_name ?? "—"}</TableCell>
											<TableCell>
												<Badge variant={statusVariant(q.status)}>
													{q.status}
												</Badge>
											</TableCell>
											<TableCell>{q.note ?? "—"}</TableCell>
											<TableCell>
												{new Date(q.requested_at).toLocaleDateString()}
											</TableCell>
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
