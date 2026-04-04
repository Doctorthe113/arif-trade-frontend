import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
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

type PaymentRow = {
	id: number;
	invoice_id: number;
	amount_paid: number | string;
	payment_date: string;
	method: string | null;
	reference: string | null;
	note: string | null;
	received_by_name: string | null;
};

type InvoicePayments = {
	invoice_id: number;
	total_amount: number | string;
	total_paid: number | string;
	due: number | string;
	payments: PaymentRow[];
};

export const Route = createFileRoute("/admin/payments")({
	component: AdminPaymentsPage,
});

function AdminPaymentsPage() {
	const queryClient = useQueryClient();
	const [invoiceIdInput, setInvoiceIdInput] = useState("");
	const [invoiceIdQuery, setInvoiceIdQuery] = useState("");

	const [amountInput, setAmountInput] = useState("");
	const [dateInput, setDateInput] = useState("");
	const [methodInput, setMethodInput] = useState("");
	const [referenceInput, setReferenceInput] = useState("");
	const [noteInput, setNoteInput] = useState("");

	const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
	const [editAmount, setEditAmount] = useState("");
	const [editDate, setEditDate] = useState("");
	const [editMethod, setEditMethod] = useState("");
	const [editReference, setEditReference] = useState("");
	const [editNote, setEditNote] = useState("");

	const paymentsQuery = useQuery({
		queryKey: ["admin-payments", invoiceIdQuery],
		queryFn: () => apiFetch<InvoicePayments>(`/invoices/${invoiceIdQuery}/payments`),
		enabled: invoiceIdQuery.trim().length > 0,
	});

	const createPayment = useMutation({
		mutationFn: () => {
			if (!invoiceIdQuery.trim()) {
				throw new Error("Load an invoice first");
			}
			if (!amountInput.trim() || Number(amountInput) <= 0) {
				throw new Error("Amount must be greater than 0");
			}
			if (!dateInput.trim()) {
				throw new Error("Payment date is required");
			}
			return apiFetch(`/invoices/${invoiceIdQuery}/payments`, {
				method: "POST",
				body: JSON.stringify({
					amount_paid: Number(amountInput),
					payment_date: dateInput,
					...(methodInput.trim() ? { method: methodInput.trim() } : {}),
					...(referenceInput.trim() ? { reference: referenceInput.trim() } : {}),
					...(noteInput.trim() ? { note: noteInput.trim() } : {}),
				}),
			});
		},
		onSuccess: () => {
			setAmountInput("");
			setDateInput("");
			setMethodInput("");
			setReferenceInput("");
			setNoteInput("");
			queryClient.invalidateQueries({ queryKey: ["admin-payments", invoiceIdQuery] });
		},
	});

	const updatePayment = useMutation({
		mutationFn: () => {
			if (!editingPaymentId) {
				throw new Error("No payment selected");
			}
			if (!editAmount.trim() || Number(editAmount) <= 0) {
				throw new Error("Amount must be greater than 0");
			}
			if (!editDate.trim()) {
				throw new Error("Payment date is required");
			}
			return apiFetch(`/payments/${editingPaymentId}`, {
				method: "PUT",
				body: JSON.stringify({
					amount_paid: Number(editAmount),
					payment_date: editDate,
					method: editMethod.trim() || null,
					reference: editReference.trim() || null,
					note: editNote.trim() || null,
				}),
			});
		},
		onSuccess: () => {
			setEditingPaymentId(null);
			setEditAmount("");
			setEditDate("");
			setEditMethod("");
			setEditReference("");
			setEditNote("");
			queryClient.invalidateQueries({ queryKey: ["admin-payments", invoiceIdQuery] });
		},
	});

	const deletePayment = useMutation({
		mutationFn: (id: number) => apiFetch(`/payments/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			if (editingPaymentId !== null) {
				setEditingPaymentId(null);
			}
			queryClient.invalidateQueries({ queryKey: ["admin-payments", invoiceIdQuery] });
		},
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Payments Management</h1>
				<p className="text-muted-foreground text-sm">
					Load an invoice and manage its payment transactions.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Invoice Lookup</CardTitle>
					<CardDescription>Enter invoice id to load its payment ledger</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
					<Input
						type="number"
						placeholder="Invoice ID"
						value={invoiceIdInput}
						onChange={(e) => setInvoiceIdInput(e.target.value)}
						className="max-w-xs"
					/>
					<Button
						onClick={() => setInvoiceIdQuery(invoiceIdInput.trim())}
						disabled={!invoiceIdInput.trim()}
					>
						Load Payments
					</Button>
				</CardContent>
			</Card>

			{invoiceIdQuery ? (
				<>
					<Card>
						<CardHeader>
							<CardTitle>Payment Summary</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-3 md:grid-cols-3">
							<div className="rounded-md border p-3">
								<p className="text-muted-foreground text-xs">Total</p>
								<p className="text-lg font-semibold">
									৳ {Number(paymentsQuery.data?.total_amount ?? 0).toLocaleString()}
								</p>
							</div>
							<div className="rounded-md border p-3">
								<p className="text-muted-foreground text-xs">Paid</p>
								<p className="text-lg font-semibold">
									৳ {Number(paymentsQuery.data?.total_paid ?? 0).toLocaleString()}
								</p>
							</div>
							<div className="rounded-md border p-3">
								<p className="text-muted-foreground text-xs">Due</p>
								<p className="text-lg font-semibold text-destructive">
									৳ {Number(paymentsQuery.data?.due ?? 0).toLocaleString()}
								</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Add Payment</CardTitle>
							<CardDescription>Record a new payment for this invoice</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-3 md:grid-cols-3">
							<Input
								type="number"
								placeholder="Amount"
								value={amountInput}
								onChange={(e) => setAmountInput(e.target.value)}
							/>
							<Input
								type="date"
								value={dateInput}
								onChange={(e) => setDateInput(e.target.value)}
							/>
							<Input
								placeholder="Method (optional)"
								value={methodInput}
								onChange={(e) => setMethodInput(e.target.value)}
							/>
							<Input
								placeholder="Reference (optional)"
								value={referenceInput}
								onChange={(e) => setReferenceInput(e.target.value)}
							/>
							<Input
								placeholder="Note (optional)"
								value={noteInput}
								onChange={(e) => setNoteInput(e.target.value)}
							/>
							<Button onClick={() => createPayment.mutate()} disabled={createPayment.isPending}>
								{createPayment.isPending ? "Adding..." : "Add Payment"}
							</Button>
							{createPayment.isError ? (
								<p className="text-destructive text-sm md:col-span-3">
									{createPayment.error instanceof Error ? createPayment.error.message : "Failed"}
								</p>
							) : null}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Payments List</CardTitle>
						</CardHeader>
						<CardContent>
							{paymentsQuery.isLoading ? (
								<p className="text-muted-foreground text-sm">Loading payments...</p>
							) : paymentsQuery.isError ? (
								<p className="text-destructive text-sm">
									{paymentsQuery.error instanceof Error ? paymentsQuery.error.message : "Failed to load payments"}
								</p>
							) : !(paymentsQuery.data?.payments ?? []).length ? (
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
											<TableHead>Received By</TableHead>
											<TableHead>Action</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{(paymentsQuery.data?.payments ?? []).map((payment) => (
											<TableRow key={payment.id}>
												<TableCell>{payment.id}</TableCell>
												<TableCell>{payment.payment_date}</TableCell>
												<TableCell>৳ {Number(payment.amount_paid).toLocaleString()}</TableCell>
												<TableCell>
													<Badge variant="outline">{payment.method ?? "-"}</Badge>
												</TableCell>
												<TableCell>{payment.reference ?? "-"}</TableCell>
												<TableCell>{payment.received_by_name ?? "-"}</TableCell>
												<TableCell className="flex gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															setEditingPaymentId(payment.id);
															setEditAmount(String(payment.amount_paid ?? ""));
															setEditDate(payment.payment_date || "");
															setEditMethod(payment.method || "");
															setEditReference(payment.reference || "");
															setEditNote(payment.note || "");
														}}
													>
														Edit
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => deletePayment.mutate(payment.id)}
														disabled={deletePayment.isPending}
													>
														Delete
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
							{(updatePayment.isError || deletePayment.isError) ? (
								<p className="mt-3 text-destructive text-sm">
									{updatePayment.error instanceof Error
										? updatePayment.error.message
										: deletePayment.error instanceof Error
											? deletePayment.error.message
											: "Action failed"}
								</p>
							) : null}
						</CardContent>
					</Card>

					{editingPaymentId !== null ? (
						<Card>
							<CardHeader>
								<CardTitle>Edit Payment</CardTitle>
							</CardHeader>
							<CardContent className="grid gap-3 md:grid-cols-3">
								<Input
									type="number"
									placeholder="Amount"
									value={editAmount}
									onChange={(e) => setEditAmount(e.target.value)}
								/>
								<Input
									type="date"
									value={editDate}
									onChange={(e) => setEditDate(e.target.value)}
								/>
								<Input
									placeholder="Method"
									value={editMethod}
									onChange={(e) => setEditMethod(e.target.value)}
								/>
								<Input
									placeholder="Reference"
									value={editReference}
									onChange={(e) => setEditReference(e.target.value)}
								/>
								<Input
									placeholder="Note"
									value={editNote}
									onChange={(e) => setEditNote(e.target.value)}
								/>
								<div className="flex gap-2">
									<Button onClick={() => updatePayment.mutate()} disabled={updatePayment.isPending}>
										{updatePayment.isPending ? "Saving..." : "Save"}
									</Button>
									<Button
										variant="outline"
										onClick={() => {
											setEditingPaymentId(null);
											setEditAmount("");
											setEditDate("");
											setEditMethod("");
											setEditReference("");
											setEditNote("");
										}}
									>
										Cancel
									</Button>
								</div>
							</CardContent>
						</Card>
					) : null}
				</>
			) : null}
		</div>
	);
}
