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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { Badge } from "#/components/ui/badge";
import { apiFetch } from "#/lib/api";

type LotDetails = {
	id: number;
	product_id: number;
	product_name: string;
	name: string;
	description: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
	stocks: {
		id: number;
		lot_id: number;
		variant_unit_id: number;
		unit_id: number;
		unit_name: string;
		variant_id: number;
		product_name: string;
		quantity_total: number;
		quantity_sold: number;
		quantity_left: number;
	}[];
};

export const Route = createFileRoute("/admin/lot-inspector")({
	component: AdminLotInspectorPage,
});

function AdminLotInspectorPage() {
	const [lotInput, setLotInput] = useState("");
	const [lotId, setLotId] = useState("");

	const lotQuery = useQuery({
		queryKey: ["admin-lot-inspector", lotId],
		queryFn: () => apiFetch<LotDetails>(`/lots/${lotId}`),
		enabled: lotId.trim().length > 0,
	});

	const totalQty = lotQuery.data?.stocks.reduce((acc, row) => acc + row.quantity_total, 0) ?? 0;
	const soldQty = lotQuery.data?.stocks.reduce((acc, row) => acc + row.quantity_sold, 0) ?? 0;
	const leftQty = lotQuery.data?.stocks.reduce((acc, row) => acc + row.quantity_left, 0) ?? 0;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Lot Inspector</h1>
				<p className="text-muted-foreground text-sm">
					Inspect one lot in depth including variant-unit stock balances.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lookup</CardTitle>
					<CardDescription>Enter lot id to inspect</CardDescription>
				</CardHeader>
				<CardContent className="flex gap-3">
					<Input
						type="number"
						placeholder="Lot ID"
						value={lotInput}
						onChange={(e) => setLotInput(e.target.value)}
						className="max-w-xs"
					/>
					<Button onClick={() => setLotId(lotInput.trim())} disabled={!lotInput.trim()}>
						Inspect
					</Button>
				</CardContent>
			</Card>

			{lotId ? (
				lotQuery.isLoading ? (
					<p className="text-muted-foreground text-sm">Loading lot...</p>
				) : lotQuery.isError ? (
					<p className="text-destructive text-sm">
						{lotQuery.error instanceof Error ? lotQuery.error.message : "Failed to load lot"}
					</p>
				) : lotQuery.data ? (
					<>
						<Card>
							<CardHeader>
								<CardTitle>{lotQuery.data.name}</CardTitle>
								<CardDescription>
									Product: {lotQuery.data.product_name} (#{lotQuery.data.product_id})
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-3 md:grid-cols-4">
									<div>
										<p className="text-muted-foreground text-xs">Status</p>
										<Badge variant={lotQuery.data.is_active ? "default" : "secondary"}>
											{lotQuery.data.is_active ? "active" : "archived"}
										</Badge>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Total Qty</p>
										<p className="font-medium">{totalQty.toLocaleString()}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Sold Qty</p>
										<p className="font-medium">{soldQty.toLocaleString()}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Left Qty</p>
										<p className="font-medium">{leftQty.toLocaleString()}</p>
									</div>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Description</p>
									<p className="font-medium">{lotQuery.data.description ?? "-"}</p>
								</div>
								<div className="grid gap-3 md:grid-cols-2">
									<div>
										<p className="text-muted-foreground text-xs">Created At</p>
										<p className="font-medium">{lotQuery.data.created_at}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Updated At</p>
										<p className="font-medium">{lotQuery.data.updated_at}</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Stock Rows</CardTitle>
								<CardDescription>
									Per variant-unit balances for this lot
								</CardDescription>
							</CardHeader>
							<CardContent>
								{!lotQuery.data.stocks.length ? (
									<p className="text-muted-foreground text-sm">No stock rows found for this lot.</p>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Variant Unit</TableHead>
												<TableHead>Variant</TableHead>
												<TableHead>Unit</TableHead>
												<TableHead>Total</TableHead>
												<TableHead>Sold</TableHead>
												<TableHead>Left</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{lotQuery.data.stocks.map((row) => (
												<TableRow key={row.id}>
													<TableCell>#{row.variant_unit_id}</TableCell>
													<TableCell>#{row.variant_id}</TableCell>
													<TableCell>{row.unit_name}</TableCell>
													<TableCell>{row.quantity_total.toLocaleString()}</TableCell>
													<TableCell>{row.quantity_sold.toLocaleString()}</TableCell>
													<TableCell>{row.quantity_left.toLocaleString()}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>
					</>
				) : null
			) : null}
		</div>
	);
}
