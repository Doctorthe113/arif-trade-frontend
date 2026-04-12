import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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

type InvoiceStatus = "active" | "returned" | "void";

type InvoiceRow = {
	id: number;
	quotation_id: number;
	customer_id: number;
	customer_name: string;
	date: string;
	total_amount: number | string;
	status: InvoiceStatus;
	paid: number | string;
	due: number | string;
};

type PaginatedInvoices = {
	data: InvoiceRow[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

export const Route = createFileRoute("/admin/invoices/")({
	component: AdminInvoicesPage,
});

function AdminInvoicesPage() {
	const queryClient = useQueryClient();
	const [pageNumber, setPageNumber] = useState(1);
	const [statusFilter, setStatusFilter] = useState("");
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");
	const [customerIdFilter, setCustomerIdFilter] = useState("");

	const invoices = useQuery({
		queryKey: [
			"admin-invoices",
			pageNumber,
			statusFilter,
			fromDate,
			toDate,
			customerIdFilter,
		],
		queryFn: () =>
			apiFetch<PaginatedInvoices>(
				`/invoices?per_page=15&page=${pageNumber}${statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : ""}${fromDate ? `&from=${encodeURIComponent(fromDate)}` : ""}${toDate ? `&to=${encodeURIComponent(toDate)}` : ""}${customerIdFilter.trim() ? `&customer_id=${encodeURIComponent(customerIdFilter.trim())}` : ""}`,
			),
	});

	const dueSnapshot = useQuery({
		queryKey: ["admin-invoices-due-snapshot"],
		queryFn: () => apiFetch<{ totals: { invoice_count: number; due_amount: number } }>("/invoices/due?per_page=1&page=1"),
	});

	const updateStatus = useMutation({
		mutationFn: ({ id, status }: { id: number; status: InvoiceStatus }) =>
			apiFetch(`/invoices/${id}`, {
				method: "PUT",
				body: JSON.stringify({ status }),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
			queryClient.invalidateQueries({ queryKey: ["admin-invoices-due-snapshot"] });
		},
	});

	const deleteInvoice = useMutation({
		mutationFn: (id: number) => apiFetch(`/invoices/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
			queryClient.invalidateQueries({ queryKey: ["admin-invoices-due-snapshot"] });
		},
	});

	const rows = invoices.data?.data ?? [];
	const pagination = invoices.data?.pagination;

	const totals = useMemo(() => {
		let sold = 0;
		let paid = 0;
		let due = 0;
		for (const row of rows) {
			sold += Number(row.total_amount || 0);
			paid += Number(row.paid || 0);
			due += Number(row.due || 0);
		}
		return { sold, paid, due };
	}, [rows]);

	const badgeVariant = (status: InvoiceStatus) => {
		if (status === "active") return "default" as const;
		if (status === "void") return "destructive" as const;
		return "secondary" as const;
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Invoices Management</h1>
				<p className="text-muted-foreground text-sm">
					Filter invoices, adjust status, and remove unpaid invoices.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Listed Invoices</CardDescription>
						<CardTitle>{rows.length}</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Listed Due</CardDescription>
						<CardTitle>৳ {totals.due.toLocaleString()}</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Total Active Due</CardDescription>
						<CardTitle>
							৳ {Number(dueSnapshot.data?.totals.due_amount ?? 0).toLocaleString()}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Due Invoice Count</CardDescription>
						<CardTitle>{dueSnapshot.data?.totals.invoice_count ?? 0}</CardTitle>
					</CardHeader>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Invoices</CardTitle>
					<CardDescription>Search by filters and manage status</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-3 md:grid-cols-5">
						<select
							className="rounded-md border bg-background px-3 py-2 text-sm"
							value={statusFilter}
							onChange={(e) => {
								setStatusFilter(e.target.value);
								setPageNumber(1);
							}}
						>
							<option value="">All statuses</option>
							<option value="active">active</option>
							<option value="returned">returned</option>
							<option value="void">void</option>
						</select>
						<Input
							type="date"
							value={fromDate}
							onChange={(e) => {
								setFromDate(e.target.value);
								setPageNumber(1);
							}}
						/>
						<Input
							type="date"
							value={toDate}
							onChange={(e) => {
								setToDate(e.target.value);
								setPageNumber(1);
							}}
						/>
						<Input
							placeholder="Customer ID"
							value={customerIdFilter}
							onChange={(e) => {
								setCustomerIdFilter(e.target.value);
								setPageNumber(1);
							}}
						/>
						<Button
							variant="outline"
							onClick={() => {
								setStatusFilter("");
								setFromDate("");
								setToDate("");
								setCustomerIdFilter("");
								setPageNumber(1);
							}}
						>
							Reset
						</Button>
					</div>

					{invoices.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading invoices...</p>
					) : invoices.isError ? (
						<p className="text-destructive text-sm">
							{invoices.error instanceof Error ? invoices.error.message : "Failed to load invoices"}
						</p>
					) : !rows.length ? (
						<p className="text-muted-foreground text-sm">No invoices found.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Paid</TableHead>
									<TableHead>Due</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((invoice) => (
									<TableRow key={invoice.id}>
										<TableCell>{invoice.id}</TableCell>
										<TableCell>{invoice.customer_name}</TableCell>
										<TableCell>{invoice.date}</TableCell>
										<TableCell>৳ {Number(invoice.total_amount).toLocaleString()}</TableCell>
										<TableCell>৳ {Number(invoice.paid).toLocaleString()}</TableCell>
										<TableCell className="text-destructive">৳ {Number(invoice.due).toLocaleString()}</TableCell>
										<TableCell>
											<Badge variant={badgeVariant(invoice.status)}>{invoice.status}</Badge>
										</TableCell>
										<TableCell className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													updateStatus.mutate({
														id: invoice.id,
														status: invoice.status === "active" ? "void" : "active",
													})
												}
												disabled={updateStatus.isPending}
											>
												{invoice.status === "active" ? "Mark Void" : "Set Active"}
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => deleteInvoice.mutate(invoice.id)}
												disabled={deleteInvoice.isPending}
											>
												Delete
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}

					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-xs">
							Page {pagination?.page ?? 1} of {pagination?.last_page ?? 1}
						</p>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={(pagination?.page ?? 1) <= 1}
								onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={(pagination?.page ?? 1) >= (pagination?.last_page ?? 1)}
								onClick={() => setPageNumber((p) => p + 1)}
							>
								Next
							</Button>
						</div>
					</div>
					{(updateStatus.isError || deleteInvoice.isError) ? (
						<p className="text-destructive text-sm">
							{updateStatus.error instanceof Error
								? updateStatus.error.message
								: deleteInvoice.error instanceof Error
									? deleteInvoice.error.message
									: "Action failed"}
						</p>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}
