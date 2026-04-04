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
import { apiFetch } from "#/lib/api";

type PaymentDetails = {
	id: number;
	invoice_id: number;
	amount_paid: number;
	payment_date: string;
	method: string | null;
	reference: string | null;
	note: string | null;
	received_by_name: string | null;
	created_at: string;
};

export const Route = createFileRoute("/admin/payment-inspector")({
	component: AdminPaymentInspectorPage,
});

function AdminPaymentInspectorPage() {
	const [paymentInput, setPaymentInput] = useState("");
	const [paymentId, setPaymentId] = useState("");

	const paymentQuery = useQuery({
		queryKey: ["admin-payment-inspector", paymentId],
		queryFn: () => apiFetch<PaymentDetails>(`/payments/${paymentId}`),
		enabled: paymentId.trim().length > 0,
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Payment Inspector</h1>
				<p className="text-muted-foreground text-sm">
					Inspect one payment transaction with invoice linkage and receiver context.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lookup</CardTitle>
					<CardDescription>Enter payment id to inspect</CardDescription>
				</CardHeader>
				<CardContent className="flex gap-3">
					<Input
						type="number"
						placeholder="Payment ID"
						value={paymentInput}
						onChange={(e) => setPaymentInput(e.target.value)}
						className="max-w-xs"
					/>
					<Button onClick={() => setPaymentId(paymentInput.trim())} disabled={!paymentInput.trim()}>
						Inspect
					</Button>
				</CardContent>
			</Card>

			{paymentId ? (
				paymentQuery.isLoading ? (
					<p className="text-muted-foreground text-sm">Loading payment...</p>
				) : paymentQuery.isError ? (
					<p className="text-destructive text-sm">
						{paymentQuery.error instanceof Error ? paymentQuery.error.message : "Failed to load payment"}
					</p>
				) : paymentQuery.data ? (
					<Card>
						<CardHeader>
							<CardTitle>Payment #{paymentQuery.data.id}</CardTitle>
							<CardDescription>Invoice #{paymentQuery.data.invoice_id}</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-3 md:grid-cols-3">
							<div>
								<p className="text-muted-foreground text-xs">Amount</p>
								<p className="font-medium">Tk {paymentQuery.data.amount_paid.toLocaleString()}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Payment Date</p>
								<p className="font-medium">{paymentQuery.data.payment_date}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Received By</p>
								<p className="font-medium">{paymentQuery.data.received_by_name ?? "-"}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Method</p>
								<p className="font-medium">{paymentQuery.data.method ?? "-"}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Reference</p>
								<p className="font-medium">{paymentQuery.data.reference ?? "-"}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Created At</p>
								<p className="font-medium">{paymentQuery.data.created_at}</p>
							</div>
							<div className="md:col-span-3">
								<p className="text-muted-foreground text-xs">Note</p>
								<p className="font-medium">{paymentQuery.data.note ?? "-"}</p>
							</div>
						</CardContent>
					</Card>
				) : null
			) : null}
		</div>
	);
}
