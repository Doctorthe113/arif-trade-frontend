import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { apiFetch } from "#/lib/api";
import { useAuth } from "#/lib/auth";
import { isAuthDisabled } from "#/lib/auth-flags";

type Payment = {
	id: number;
	invoice_id: number;
	amount_paid: string;
	payment_date: string;
	method: string | null;
	reference: string | null;
	note: string | null;
	received_by_name: string | null;
};

export const Route = createFileRoute("/salesman/transaction")({
	component: TransactionPage,
});

/// Transaction / payment list
function TransactionPage() {
	const { hasRole } = useAuth();
	const isSuperAdminUser = isAuthDisabled || hasRole("superadmin");

	const [invoiceId, setInvoiceId] = useState("");

	const { data, isLoading, error } = useQuery({
		queryKey: ["payments", invoiceId],
		queryFn: () =>
			apiFetch<{
				invoice_id: number;
				total_amount: string;
				total_paid: string;
				due: string;
				payments: Payment[];
			}>(`/invoices/${invoiceId}/payments`),
		enabled: invoiceId.length > 0,
	});

	if (!isSuperAdminUser) return <Navigate to="/salesman/inventory" />;

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Transactions</h1>

			<div className="flex items-center gap-3">
				<Input
					type="number"
					placeholder="Enter Invoice ID to view payments"
					value={invoiceId}
					onChange={(e) => setInvoiceId(e.target.value)}
					className="max-w-xs"
				/>
			</div>

			{invoiceId && (
				<Card>
					<CardHeader>
						<CardTitle>
							Payments for Invoice #{invoiceId}
							{data && (
								<span className="ml-3 text-sm font-normal text-muted-foreground">
									Total: ৳
									{Number.parseFloat(data.total_amount).toLocaleString()} |
									Paid: ৳{Number.parseFloat(data.total_paid).toLocaleString()} |
									Due: ৳{Number.parseFloat(data.due).toLocaleString()}
								</span>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<p className="text-muted-foreground text-sm">Loading...</p>
						) : error ? (
							<p className="text-destructive text-sm">
								{error instanceof Error ? error.message : "Failed to load"}
							</p>
						) : (
							<div className="overflow-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b text-left">
											<th className="pb-2 font-medium">ID</th>
											<th className="pb-2 font-medium">Date</th>
											<th className="pb-2 font-medium">Amount</th>
											<th className="pb-2 font-medium">Method</th>
											<th className="pb-2 font-medium">Reference</th>
											<th className="pb-2 font-medium">Received By</th>
											<th className="pb-2 font-medium">Note</th>
										</tr>
									</thead>
									<tbody>
										{(data?.payments ?? []).map((p) => (
											<tr key={p.id} className="border-b">
												<td className="py-2">{p.id}</td>
												<td className="py-2">{p.payment_date}</td>
												<td className="py-2">
													৳{Number.parseFloat(p.amount_paid).toLocaleString()}
												</td>
												<td className="py-2">
													<Badge variant="outline">{p.method ?? "—"}</Badge>
												</td>
												<td className="py-2">{p.reference ?? "—"}</td>
												<td className="py-2">{p.received_by_name ?? "—"}</td>
												<td className="py-2">{p.note ?? "—"}</td>
											</tr>
										))}
										{data?.payments.length === 0 && (
											<tr>
												<td
													colSpan={7}
													className="py-4 text-center text-muted-foreground"
												>
													No payments recorded
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
