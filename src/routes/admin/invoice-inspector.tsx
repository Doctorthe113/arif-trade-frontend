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

type InvoiceStatus = "active" | "returned" | "void";

type InvoiceDetails = {
	id: number;
	quotation_id: number;
	customer_id: number;
	customer_name: string;
	date: string;
	total_amount: number;
	status: InvoiceStatus;
	paid: number;
	due: number;
	items: {
		id: number;
		variant_unit_id: number;
		quantity: number;
		unit_price: number;
		line_total: number;
		product_name: string;
		product_code: string;
		unit_name: string;
		attributes: Record<string, unknown> | null;
	}[];
	payments: {
		id: number;
		amount_paid: number;
		payment_date: string;
		method: string | null;
		reference: string | null;
		note: string | null;
	}[];
};

export const Route = createFileRoute("/admin/invoice-inspector")({
	component: AdminInvoiceInspectorPage,
});

function AdminInvoiceInspectorPage() {
	const queryClient = useQueryClient();
	const [invoiceInput, setInvoiceInput] = useState("");
	const [invoiceId, setInvoiceId] = useState("");

	const invoiceQuery = useQuery({
		queryKey: ["admin-invoice-inspector", invoiceId],
		queryFn: () => apiFetch<InvoiceDetails>(`/invoices/${invoiceId}`),
		enabled: invoiceId.trim().length > 0,
	});

	const statusMutation = useMutation({
		mutationFn: (status: InvoiceStatus) =>
			apiFetch(`/invoices/${invoiceId}`, {
				method: "PUT",
				body: JSON.stringify({ status }),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-invoice-inspector", invoiceId] });
			queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
		},
	});

	const statusBadge = (status: InvoiceStatus) => {
		if (status === "active") return "default" as const;
		if (status === "void") return "destructive" as const;
		return "secondary" as const;
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Invoice Inspector</h1>
				<p className="text-muted-foreground text-sm">
					Inspect one invoice deeply including line items and payment trail.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lookup</CardTitle>
					<CardDescription>Enter invoice id to load details</CardDescription>
				</CardHeader>
				<CardContent className="flex gap-3">
					<Input
						type="number"
						placeholder="Invoice ID"
						value={invoiceInput}
						onChange={(e) => setInvoiceInput(e.target.value)}
						className="max-w-xs"
					/>
					<Button onClick={() => setInvoiceId(invoiceInput.trim())} disabled={!invoiceInput.trim()}>
						Inspect
					</Button>
				</CardContent>
			</Card>

			{invoiceId ? (
				invoiceQuery.isLoading ? (
					<p className="text-muted-foreground text-sm">Loading invoice...</p>
				) : invoiceQuery.isError ? (
					<p className="text-destructive text-sm">
						{invoiceQuery.error instanceof Error ? invoiceQuery.error.message : "Failed to load invoice"}
					</p>
				) : invoiceQuery.data ? (
					<>
						<Card>
							<CardHeader>
								<CardTitle>Invoice #{invoiceQuery.data.id}</CardTitle>
								<CardDescription>
									Customer: {invoiceQuery.data.customer_name} | Quotation: #{invoiceQuery.data.quotation_id}
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4 md:grid-cols-4">
								<div>
									<p className="text-muted-foreground text-xs">Date</p>
									<p className="font-medium">{invoiceQuery.data.date}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Total</p>
									<p className="font-medium">৳ {invoiceQuery.data.total_amount.toLocaleString()}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Paid</p>
									<p className="font-medium">৳ {invoiceQuery.data.paid.toLocaleString()}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Due</p>
									<p className="font-medium text-destructive">৳ {invoiceQuery.data.due.toLocaleString()}</p>
								</div>
								<div className="md:col-span-4 flex items-center gap-3">
									<Badge variant={statusBadge(invoiceQuery.data.status)}>{invoiceQuery.data.status}</Badge>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											statusMutation.mutate(invoiceQuery.data.status === "active" ? "void" : "active")
										}
										disabled={statusMutation.isPending}
									>
										{invoiceQuery.data.status === "active" ? "Set Void" : "Set Active"}
									</Button>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Line Items</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Product</TableHead>
											<TableHead>Variant</TableHead>
											<TableHead>Qty</TableHead>
											<TableHead>Unit Price</TableHead>
											<TableHead>Line Total</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{invoiceQuery.data.items.map((item) => (
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
												<TableCell>৳ {item.unit_price.toLocaleString()}</TableCell>
												<TableCell>৳ {item.line_total.toLocaleString()}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Payments</CardTitle>
							</CardHeader>
							<CardContent>
								{!invoiceQuery.data.payments.length ? (
									<p className="text-muted-foreground text-sm">No payments recorded.</p>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>ID</TableHead>
												<TableHead>Date</TableHead>
												<TableHead>Amount</TableHead>
												<TableHead>Method</TableHead>
												<TableHead>Reference</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{invoiceQuery.data.payments.map((p) => (
												<TableRow key={p.id}>
													<TableCell>{p.id}</TableCell>
													<TableCell>{p.payment_date}</TableCell>
													<TableCell>৳ {p.amount_paid.toLocaleString()}</TableCell>
													<TableCell>{p.method ?? "-"}</TableCell>
													<TableCell>{p.reference ?? "-"}</TableCell>
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
