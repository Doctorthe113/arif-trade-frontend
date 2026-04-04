import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { apiFetch } from "#/lib/api";

type QuotationStatus = "pending" | "accepted" | "rejected" | "returned";

type QuotationDetails = {
	id: number;
	salesman_id: number;
	salesman_name: string;
	customer_id: number | null;
	customer_name: string | null;
	status: QuotationStatus;
	note: string | null;
	requested_at: string;
	processed_at: string | null;
	items: {
		id: number;
		variant_unit_id: number;
		quantity: number;
		unit_price: number;
		product_name: string;
		product_code: string;
		unit_name: string;
		attributes: Record<string, unknown> | null;
		lots: {
			id: number;
			lot_id: number;
			lot_name: string;
			quantity: number;
		}[];
	}[];
};

export const Route = createFileRoute("/admin/quotation-inspector")({
	component: AdminQuotationInspectorPage,
});

function AdminQuotationInspectorPage() {
	const queryClient = useQueryClient();
	const [quotationInput, setQuotationInput] = useState("");
	const [quotationId, setQuotationId] = useState("");
	const [acceptCustomerId, setAcceptCustomerId] = useState("");

	const quotationQuery = useQuery({
		queryKey: ["admin-quotation-inspector", quotationId],
		queryFn: () => apiFetch<QuotationDetails>(`/quotations/${quotationId}`),
		enabled: quotationId.trim().length > 0,
	});

	const statusMutation = useMutation({
		mutationFn: ({ status, customerId }: { status: "accepted" | "rejected" | "returned"; customerId?: number }) =>
			apiFetch(`/quotations/${quotationId}/status`, {
				method: "PUT",
				body: JSON.stringify({
					status,
					...(customerId ? { customer_id: customerId } : {}),
				}),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-quotation-inspector", quotationId] });
			queryClient.invalidateQueries({ queryKey: ["admin-quotations"] });
		},
	});

	const badgeVariant = (status: QuotationStatus) => {
		if (status === "accepted") return "default" as const;
		if (status === "rejected") return "destructive" as const;
		if (status === "returned") return "outline" as const;
		return "secondary" as const;
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Quotation Inspector</h1>
				<p className="text-muted-foreground text-sm">
					Inspect one quotation in detail including lots and status workflow.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lookup</CardTitle>
					<CardDescription>Enter quotation id to inspect</CardDescription>
				</CardHeader>
				<CardContent className="flex gap-3">
					<Input
						type="number"
						placeholder="Quotation ID"
						value={quotationInput}
						onChange={(e) => setQuotationInput(e.target.value)}
						className="max-w-xs"
					/>
					<Button onClick={() => setQuotationId(quotationInput.trim())} disabled={!quotationInput.trim()}>
						Inspect
					</Button>
				</CardContent>
			</Card>

			{quotationId ? (
				quotationQuery.isLoading ? (
					<p className="text-muted-foreground text-sm">Loading quotation...</p>
				) : quotationQuery.isError ? (
					<p className="text-destructive text-sm">
						{quotationQuery.error instanceof Error ? quotationQuery.error.message : "Failed to load quotation"}
					</p>
				) : quotationQuery.data ? (
					<>
						<Card>
							<CardHeader>
								<CardTitle>Quotation #{quotationQuery.data.id}</CardTitle>
								<CardDescription>
									Salesman: {quotationQuery.data.salesman_name} | Customer: {quotationQuery.data.customer_name ?? "-"}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-3 md:grid-cols-4">
									<div>
										<p className="text-muted-foreground text-xs">Requested</p>
										<p className="font-medium">{quotationQuery.data.requested_at}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Processed</p>
										<p className="font-medium">{quotationQuery.data.processed_at ?? "-"}</p>
									</div>
									<div className="md:col-span-2">
										<p className="text-muted-foreground text-xs">Status</p>
										<Badge variant={badgeVariant(quotationQuery.data.status)}>
											{quotationQuery.data.status}
										</Badge>
									</div>
								</div>

								{quotationQuery.data.status === "pending" ? (
									<div className="flex flex-wrap items-center gap-2">
										<Input
											placeholder="Customer ID for accept"
											value={acceptCustomerId}
											onChange={(e) => setAcceptCustomerId(e.target.value)}
											className="max-w-xs"
										/>
										<Button
											variant="outline"
											onClick={() => {
												if (!acceptCustomerId.trim()) return;
												statusMutation.mutate({
													status: "accepted",
													customerId: Number(acceptCustomerId),
												});
											}}
											disabled={statusMutation.isPending || !acceptCustomerId.trim()}
										>
											Accept
										</Button>
										<Button
											variant="outline"
											onClick={() => statusMutation.mutate({ status: "rejected" })}
											disabled={statusMutation.isPending}
										>
											Reject
										</Button>
									</div>
								) : quotationQuery.data.status === "accepted" ? (
									<Button
										variant="outline"
										onClick={() => statusMutation.mutate({ status: "returned" })}
										disabled={statusMutation.isPending}
									>
										Mark Returned
									</Button>
								) : null}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Items & Lots</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Product</TableHead>
											<TableHead>Variant</TableHead>
											<TableHead>Qty</TableHead>
											<TableHead>Unit Price</TableHead>
											<TableHead>Lots</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{quotationQuery.data.items.map((item) => (
											<TableRow key={item.id}>
												<TableCell>
													<div className="font-medium">{item.product_name}</div>
													<div className="text-muted-foreground text-xs">{item.product_code}</div>
												</TableCell>
												<TableCell className="text-xs">
													{item.attributes
														? Object.entries(item.attributes)
																.map(([k, v]) => `${k}: ${String(v)}`)
																.join(", ")
														: "-"}
												</TableCell>
												<TableCell>{item.quantity}</TableCell>
												<TableCell>Tk {item.unit_price.toLocaleString()}</TableCell>
												<TableCell className="text-xs">
													{item.lots.length
														? item.lots.map((lot) => `${lot.lot_name} (${lot.quantity})`).join(", ")
														: "-"}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
								{statusMutation.isError ? (
									<p className="mt-3 text-destructive text-sm">
										{statusMutation.error instanceof Error ? statusMutation.error.message : "Status update failed"}
									</p>
								) : null}
							</CardContent>
						</Card>
					</>
				) : null
			) : null}
		</div>
	);
}
