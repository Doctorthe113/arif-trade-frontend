import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
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
	total: number;
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

	const { data, isLoading } = useQuery({
		queryKey: ["quotations"],
		queryFn: () => apiFetch<PaginatedQuotations>("/quotations?per_page=100"),
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
					) : (
						<div className="overflow-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left">
										<th className="pb-2 font-medium">ID</th>
										<th className="pb-2 font-medium">Salesman</th>
										<th className="pb-2 font-medium">Customer</th>
										<th className="pb-2 font-medium">Status</th>
										<th className="pb-2 font-medium">Note</th>
										<th className="pb-2 font-medium">Date</th>
									</tr>
								</thead>
								<tbody>
									{(data?.data ?? []).map((q) => (
										<tr key={q.id} className="border-b">
											<td className="py-2">{q.id}</td>
											<td className="py-2">{q.salesman_name}</td>
											<td className="py-2">{q.customer_name ?? "—"}</td>
											<td className="py-2">
												<Badge variant={statusVariant(q.status)}>
													{q.status}
												</Badge>
											</td>
											<td className="py-2">{q.note ?? "—"}</td>
											<td className="py-2">
												{new Date(q.requested_at).toLocaleDateString()}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
