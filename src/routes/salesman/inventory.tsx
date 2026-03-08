import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { apiFetch } from "#/lib/api";

type InventoryLog = {
	id: number;
	product_name: string;
	product_code: string;
	unit_name: string;
	variant_attributes: string | null;
	quantity: number;
	action: string;
	note: string | null;
	user_name: string;
	created_at: string;
};

type PaginatedInventory = {
	data: InventoryLog[];
	total: number;
};

export const Route = createFileRoute("/salesman/inventory")({
	component: InventoryPage,
});

/// Inventory log table
function InventoryPage() {
	const { data, isLoading } = useQuery({
		queryKey: ["inventory-log"],
		queryFn: () => apiFetch<PaginatedInventory>("/inventory/log?per_page=100"),
	});

	const actionVariant = (a: string) => {
		if (a === "sold") return "destructive" as const;
		if (a === "returned") return "secondary" as const;
		return "default" as const;
	};

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Inventory</h1>
			<Card>
				<CardHeader>
					<CardTitle>Inventory Log</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<p className="text-muted-foreground text-sm">Loading...</p>
					) : (
						<div className="overflow-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left">
										<th className="pb-2 font-medium">Product</th>
										<th className="pb-2 font-medium">Code</th>
										<th className="pb-2 font-medium">Unit</th>
										<th className="pb-2 font-medium">Variant</th>
										<th className="pb-2 font-medium">Qty</th>
										<th className="pb-2 font-medium">Action</th>
										<th className="pb-2 font-medium">By</th>
										<th className="pb-2 font-medium">Date</th>
										<th className="pb-2 font-medium">Note</th>
									</tr>
								</thead>
								<tbody>
									{(data?.data ?? []).map((log) => (
										<tr key={log.id} className="border-b">
											<td className="py-2">{log.product_name}</td>
											<td className="py-2 font-mono text-xs">
												{log.product_code}
											</td>
											<td className="py-2">{log.unit_name}</td>
											<td className="py-2">{log.variant_attributes ?? "—"}</td>
											<td className="py-2">{log.quantity}</td>
											<td className="py-2">
												<Badge variant={actionVariant(log.action)}>
													{log.action}
												</Badge>
											</td>
											<td className="py-2">{log.user_name}</td>
											<td className="py-2">
												{new Date(log.created_at).toLocaleDateString()}
											</td>
											<td className="py-2">{log.note ?? "—"}</td>
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
