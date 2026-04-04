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
import { Badge } from "#/components/ui/badge";
import { apiFetch } from "#/lib/api";

type InventoryAction = "handover" | "sold" | "returned";

type InventoryDetails = {
	id: number;
	variant_unit_id: number;
	quantity: number;
	action: InventoryAction;
	related_id: number | null;
	note: string | null;
	created_at: string;
	user_name: string | null;
	user_role: string | null;
	product_id: number;
	product_name: string;
	product_code: string;
	unit_name: string;
	variant_attributes: Record<string, unknown> | null;
};

export const Route = createFileRoute("/admin/inventory-inspector")({
	component: AdminInventoryInspectorPage,
});

function AdminInventoryInspectorPage() {
	const [entryInput, setEntryInput] = useState("");
	const [entryId, setEntryId] = useState("");

	const entryQuery = useQuery({
		queryKey: ["admin-inventory-inspector", entryId],
		queryFn: () => apiFetch<InventoryDetails>(`/inventory/${entryId}`),
		enabled: entryId.trim().length > 0,
	});

	const actionVariant = (action: InventoryAction) => {
		if (action === "sold") return "destructive" as const;
		if (action === "returned") return "secondary" as const;
		return "default" as const;
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Inventory Inspector</h1>
				<p className="text-muted-foreground text-sm">
					Inspect one inventory log entry with product, variant, and actor context.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lookup</CardTitle>
					<CardDescription>Enter inventory log id to inspect</CardDescription>
				</CardHeader>
				<CardContent className="flex gap-3">
					<Input
						type="number"
						placeholder="Inventory Log ID"
						value={entryInput}
						onChange={(e) => setEntryInput(e.target.value)}
						className="max-w-xs"
					/>
					<Button onClick={() => setEntryId(entryInput.trim())} disabled={!entryInput.trim()}>
						Inspect
					</Button>
				</CardContent>
			</Card>

			{entryId ? (
				entryQuery.isLoading ? (
					<p className="text-muted-foreground text-sm">Loading inventory entry...</p>
				) : entryQuery.isError ? (
					<p className="text-destructive text-sm">
						{entryQuery.error instanceof Error ? entryQuery.error.message : "Failed to load inventory entry"}
					</p>
				) : entryQuery.data ? (
					<Card>
						<CardHeader>
							<CardTitle>Inventory Log #{entryQuery.data.id}</CardTitle>
							<CardDescription>
								{entryQuery.data.product_name} ({entryQuery.data.product_code})
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-3 md:grid-cols-4">
							<div>
								<p className="text-muted-foreground text-xs">Action</p>
								<Badge variant={actionVariant(entryQuery.data.action)}>{entryQuery.data.action}</Badge>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Quantity</p>
								<p className="font-medium">{entryQuery.data.quantity.toLocaleString()}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Variant Unit</p>
								<p className="font-medium">#{entryQuery.data.variant_unit_id}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Related ID</p>
								<p className="font-medium">{entryQuery.data.related_id ?? "-"}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Unit</p>
								<p className="font-medium">{entryQuery.data.unit_name}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">User</p>
								<p className="font-medium">{entryQuery.data.user_name ?? "-"}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Role</p>
								<p className="font-medium">{entryQuery.data.user_role ?? "-"}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Created At</p>
								<p className="font-medium">{entryQuery.data.created_at}</p>
							</div>
							<div className="md:col-span-4">
								<p className="text-muted-foreground text-xs">Variant Attributes</p>
								<p className="font-medium text-sm">
									{entryQuery.data.variant_attributes
										? Object.entries(entryQuery.data.variant_attributes)
												.map(([k, v]) => `${k}: ${String(v)}`)
												.join(", ")
										: "-"}
								</p>
							</div>
							<div className="md:col-span-4">
								<p className="text-muted-foreground text-xs">Note</p>
								<p className="font-medium">{entryQuery.data.note ?? "-"}</p>
							</div>
						</CardContent>
					</Card>
				) : null
			) : null}
		</div>
	);
}
