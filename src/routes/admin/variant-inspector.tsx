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

type VariantDetails = {
	id: number;
	product_id: number;
	product_name: string;
	product_code: string;
	sku: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
	attributes: Record<string, unknown> | null;
	units: {
		id: number;
		unit_id: number;
		unit_name: string;
		multiplier: number;
		stock_quantity: number;
		unit_price: number;
	}[];
};

export const Route = createFileRoute("/admin/variant-inspector")({
	component: AdminVariantInspectorPage,
});

function AdminVariantInspectorPage() {
	const [variantInput, setVariantInput] = useState("");
	const [variantId, setVariantId] = useState("");

	const variantQuery = useQuery({
		queryKey: ["admin-variant-inspector", variantId],
		queryFn: () => apiFetch<VariantDetails>(`/variants/${variantId}`),
		enabled: variantId.trim().length > 0,
	});

	const totalStock =
		variantQuery.data?.units.reduce((acc, row) => acc + row.stock_quantity, 0) ?? 0;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Variant Inspector</h1>
				<p className="text-muted-foreground text-sm">
					Inspect one variant with product context and unit-level stock/price details.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lookup</CardTitle>
					<CardDescription>Enter variant id to inspect</CardDescription>
				</CardHeader>
				<CardContent className="flex gap-3">
					<Input
						type="number"
						placeholder="Variant ID"
						value={variantInput}
						onChange={(e) => setVariantInput(e.target.value)}
						className="max-w-xs"
					/>
					<Button onClick={() => setVariantId(variantInput.trim())} disabled={!variantInput.trim()}>
						Inspect
					</Button>
				</CardContent>
			</Card>

			{variantId ? (
				variantQuery.isLoading ? (
					<p className="text-muted-foreground text-sm">Loading variant...</p>
				) : variantQuery.isError ? (
					<p className="text-destructive text-sm">
						{variantQuery.error instanceof Error ? variantQuery.error.message : "Failed to load variant"}
					</p>
				) : variantQuery.data ? (
					<>
						<Card>
							<CardHeader>
								<CardTitle>Variant #{variantQuery.data.id}</CardTitle>
								<CardDescription>
									Product: {variantQuery.data.product_name} ({variantQuery.data.product_code})
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-3 md:grid-cols-4">
									<div>
										<p className="text-muted-foreground text-xs">SKU</p>
										<p className="font-medium">{variantQuery.data.sku ?? "-"}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Status</p>
										<Badge variant={variantQuery.data.is_active ? "default" : "secondary"}>
											{variantQuery.data.is_active ? "active" : "inactive"}
										</Badge>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Units</p>
										<p className="font-medium">{variantQuery.data.units.length}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Total Stock</p>
										<p className="font-medium">{totalStock.toLocaleString()}</p>
									</div>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Attributes</p>
									<p className="font-medium text-sm">
										{variantQuery.data.attributes
											? Object.entries(variantQuery.data.attributes)
													.map(([k, v]) => `${k}: ${String(v)}`)
													.join(", ")
											: "-"}
									</p>
								</div>
								<div className="grid gap-3 md:grid-cols-2">
									<div>
										<p className="text-muted-foreground text-xs">Created At</p>
										<p className="font-medium">{variantQuery.data.created_at}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Updated At</p>
										<p className="font-medium">{variantQuery.data.updated_at}</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Variant Units</CardTitle>
								<CardDescription>Unit-level stock and pricing</CardDescription>
							</CardHeader>
							<CardContent>
								{!variantQuery.data.units.length ? (
									<p className="text-muted-foreground text-sm">No units linked to this variant.</p>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Variant Unit</TableHead>
												<TableHead>Unit</TableHead>
												<TableHead>Multiplier</TableHead>
												<TableHead>Stock</TableHead>
												<TableHead>Unit Price</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{variantQuery.data.units.map((row) => (
												<TableRow key={row.id}>
													<TableCell>#{row.id}</TableCell>
													<TableCell>{row.unit_name}</TableCell>
													<TableCell>{row.multiplier}</TableCell>
													<TableCell>{row.stock_quantity.toLocaleString()}</TableCell>
													<TableCell>Tk {row.unit_price.toLocaleString()}</TableCell>
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
