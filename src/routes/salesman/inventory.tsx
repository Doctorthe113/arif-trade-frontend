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

export const Route = createFileRoute("/salesman/inventory")({
	component: InventoryPage,
});

/// Inventory log table
function InventoryPage() {
	const [pageNumber, setPageNumber] = useState(1);
	const [dateSortDirection, setDateSortDirection] = useState<"asc" | "desc">(
		"desc",
	);

	const { data, isLoading } = useQuery({
		queryKey: ["inventory-log", pageNumber],
		queryFn: () =>
			apiFetch<PaginatedInventory>(
				`/inventory/log?per_page=20&page=${pageNumber}`,
			),
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

	const inventoryRows = useMemo(() => {
		const rows = [...(data?.data ?? [])];
		rows.sort((leftLog, rightLog) => {
			const leftTimeMs = new Date(leftLog.created_at).getTime();
			const rightTimeMs = new Date(rightLog.created_at).getTime();
			return dateSortDirection === "asc"
				? leftTimeMs - rightTimeMs
				: rightTimeMs - leftTimeMs;
		});
		return rows;
	}, [data?.data, dateSortDirection]);

	const pagination = data?.pagination;

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
