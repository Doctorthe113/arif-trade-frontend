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
import { apiFetch } from "#/lib/api";

type VariantUnitDetails = {
	id: number;
	variant_id: number;
	unit_id: number;
	unit_name: string;
	multiplier: number;
	stock_quantity: number;
	unit_price: number;
	updated_at: string;
};

type LotStatRow = {
	lot_id: number;
	product_id: number;
	lot_name: string;
	quantity_total: number;
	quantity_sold: number;
	quantity_left: number;
};

export const Route = createFileRoute("/admin/variant-unit-inspector")({
	component: AdminVariantUnitInspectorPage,
});

function AdminVariantUnitInspectorPage() {
	const [variantUnitInput, setVariantUnitInput] = useState("");
	const [variantUnitId, setVariantUnitId] = useState("");

	const detailQuery = useQuery({
		queryKey: ["admin-variant-unit-inspector", variantUnitId],
		queryFn: () => apiFetch<VariantUnitDetails>(`/variant-units/${variantUnitId}`),
		enabled: variantUnitId.trim().length > 0,
	});

	const lotStatsQuery = useQuery({
		queryKey: ["admin-variant-unit-inspector-lot-stats", variantUnitId],
		queryFn: () => apiFetch<LotStatRow[]>(`/lots/stats?variant_unit_id=${variantUnitId}`),
		enabled: variantUnitId.trim().length > 0,
	});

	const totalLotLeft = lotStatsQuery.data?.reduce((acc, row) => acc + row.quantity_left, 0) ?? 0;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Variant-Unit Inspector</h1>
				<p className="text-muted-foreground text-sm">
					Inspect one variant-unit with pricing, stock, and lot-level balances.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lookup</CardTitle>
					<CardDescription>Enter variant-unit id to inspect</CardDescription>
				</CardHeader>
				<CardContent className="flex gap-3">
					<Input
						type="number"
						placeholder="Variant-Unit ID"
						value={variantUnitInput}
						onChange={(e) => setVariantUnitInput(e.target.value)}
						className="max-w-xs"
					/>
					<Button onClick={() => setVariantUnitId(variantUnitInput.trim())} disabled={!variantUnitInput.trim()}>
						Inspect
					</Button>
				</CardContent>
			</Card>

			{variantUnitId ? (
				detailQuery.isLoading ? (
					<p className="text-muted-foreground text-sm">Loading variant-unit...</p>
				) : detailQuery.isError ? (
					<p className="text-destructive text-sm">
						{detailQuery.error instanceof Error ? detailQuery.error.message : "Failed to load variant-unit"}
					</p>
				) : detailQuery.data ? (
					<>
						<Card>
							<CardHeader>
								<CardTitle>Variant-Unit #{detailQuery.data.id}</CardTitle>
								<CardDescription>
									Variant #{detailQuery.data.variant_id} | Unit {detailQuery.data.unit_name}
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-3 md:grid-cols-4">
								<div>
									<p className="text-muted-foreground text-xs">Unit ID</p>
									<p className="font-medium">{detailQuery.data.unit_id}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Multiplier</p>
									<p className="font-medium">{detailQuery.data.multiplier}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Stock Quantity</p>
									<p className="font-medium">{detailQuery.data.stock_quantity.toLocaleString()}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Unit Price</p>
									<p className="font-medium">Tk {detailQuery.data.unit_price.toLocaleString()}</p>
								</div>
								<div className="md:col-span-4">
									<p className="text-muted-foreground text-xs">Updated At</p>
									<p className="font-medium">{detailQuery.data.updated_at}</p>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Lot Balances</CardTitle>
								<CardDescription>
									Total lot quantity left: {totalLotLeft.toLocaleString()}
								</CardDescription>
							</CardHeader>
							<CardContent>
								{lotStatsQuery.isLoading ? (
									<p className="text-muted-foreground text-sm">Loading lot stats...</p>
								) : lotStatsQuery.isError ? (
									<p className="text-destructive text-sm">
										{lotStatsQuery.error instanceof Error ? lotStatsQuery.error.message : "Failed to load lot stats"}
									</p>
								) : !lotStatsQuery.data?.length ? (
									<p className="text-muted-foreground text-sm">No lots linked to this variant-unit.</p>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Lot</TableHead>
												<TableHead>Total</TableHead>
												<TableHead>Sold</TableHead>
												<TableHead>Left</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{lotStatsQuery.data.map((row) => (
												<TableRow key={row.lot_id}>
													<TableCell>{row.lot_name}</TableCell>
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
