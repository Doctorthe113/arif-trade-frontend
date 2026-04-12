import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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

type DueInvoiceRow = {
	id: number;
	quotation_id: number;
	customer_id: number;
	customer_name: string;
	customer_phone: string | null;
	customer_email: string | null;
	date: string;
	status: "active" | "returned" | "void";
	total_amount: number;
	paid: number;
	due: number;
};

type DueInvoiceResponse = {
	filters: {
		customer_id: number | null;
		search: string | null;
		from: string | null;
		to: string | null;
	};
	totals: {
		invoice_count: number;
		sold_amount: number;
		paid_amount: number;
		due_amount: number;
	};
	invoices: {
		data: DueInvoiceRow[];
		pagination: {
			page: number;
			per_page: number;
			total: number;
			last_page: number;
		};
	};
};

export const Route = createFileRoute("/admin/due-collection/")({
	component: DueCollectionPage,
});

function DueCollectionPage() {
	const queryClient = useQueryClient();
	const [pageNumber, setPageNumber] = useState(1);
	const [monthValue, setMonthValue] = useState(() => {
		const now = new Date();
		const yearNumber = now.getFullYear();
		const monthNumber = `${now.getMonth() + 1}`.padStart(2, "0");
		return `${yearNumber}-${monthNumber}`;
	});
	const [searchValue, setSearchValue] = useState("");
	const [customerIdValue, setCustomerIdValue] = useState("");
	const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(
		null,
	);
	const [payAmount, setPayAmount] = useState("");
	const [payMethod, setPayMethod] = useState("cash");
	const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

	const { fromDateValue, toDateValue } = useMemo(() => {
		const [yearText = "", monthText = ""] = monthValue.split("-");
		if (!yearText || !monthText) {
			return { fromDateValue: "", toDateValue: "" };
		}

		const fromDate = `${yearText}-${monthText}-01`;
		const toDate = new Date(Number(yearText), Number(monthText), 0)
			.toISOString()
			.slice(0, 10);

		return {
			fromDateValue: fromDate,
			toDateValue: toDate,
		};
	}, [monthValue]);

	const dueQueryString = useMemo(() => {
		const searchParams = new URLSearchParams();
		searchParams.set("page", String(pageNumber));
		searchParams.set("per_page", "15");
		if (searchValue.trim()) {
			searchParams.set("search", searchValue.trim());
		}
		if (customerIdValue.trim()) {
			searchParams.set("customer_id", customerIdValue.trim());
		}
		if (fromDateValue) {
			searchParams.set("from", fromDateValue);
		}
		if (toDateValue) {
			searchParams.set("to", toDateValue);
		}
		return searchParams.toString();
	}, [customerIdValue, fromDateValue, pageNumber, searchValue, toDateValue]);

	const dueInvoices = useQuery({
		queryKey: ["due-invoices", dueQueryString],
		queryFn: () =>
			apiFetch<DueInvoiceResponse>(`/invoices/due?${dueQueryString}`),
	});

	const selectedInvoice = useMemo(
		() =>
			(dueInvoices.data?.invoices.data ?? []).find(
				(i) => i.id === selectedInvoiceId,
			),
		[dueInvoices.data, selectedInvoiceId],
	);

	const collectMutation = useMutation({
		mutationFn: async () => {
			if (!selectedInvoiceId) throw new Error("Select an invoice first");
			const amount = Number.parseFloat(payAmount);
			if (!Number.isFinite(amount) || amount <= 0) {
				throw new Error("Enter a valid payment amount");
			}
			return apiFetch(`/invoices/${selectedInvoiceId}/payments`, {
				method: "POST",
				body: JSON.stringify({
					amount_paid: amount,
					payment_date: today,
					method: payMethod,
					note: "Collected via admin due collection page",
				}),
			});
		},
		onSuccess: () => {
			setPayAmount("");
			queryClient.invalidateQueries({ queryKey: ["due-invoices"] });
		},
	});

	return (
		<div className="space-y-6">
			{/* Header section */}
			<div>
				<h1 className="text-2xl font-bold">Due Collection</h1>
				<p className="text-muted-foreground text-sm">
					Collect payments and inspect due balances with month and customer
					filters.
				</p>
			</div>

			{/* Summary section */}
			{dueInvoices.data ? (
				<div className="grid gap-4 sm:grid-cols-3">
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Total Sold</CardDescription>
							<CardTitle>
								৳{dueInvoices.data.totals.sold_amount.toLocaleString()}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Total Paid</CardDescription>
							<CardTitle className="text-emerald-600">
								৳{dueInvoices.data.totals.paid_amount.toLocaleString()}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Total Due</CardDescription>
							<CardTitle className="text-destructive">
								৳{dueInvoices.data.totals.due_amount.toLocaleString()}
							</CardTitle>
						</CardHeader>
					</Card>
				</div>
			) : null}

			{/* Workspace section */}
			<div className="grid gap-4 lg:grid-cols-2">
				{/* Due invoices panel */}
				<Card>
					<CardHeader>
						<CardTitle>Due Invoices</CardTitle>
						<CardDescription>
							Filter due rows, then choose invoice to collect payment.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-3 md:grid-cols-2">
							<Input
								type="month"
								value={monthValue}
								onChange={(event) => {
									setMonthValue(event.target.value);
									setPageNumber(1);
								}}
							/>
							<Input
								placeholder="Customer ID (optional)"
								value={customerIdValue}
								onChange={(event) => {
									setCustomerIdValue(event.target.value);
									setPageNumber(1);
								}}
							/>
							<div className="md:col-span-2 grid gap-3 md:grid-cols-[1fr_auto]">
								<Input
									placeholder="Search customer by name / phone / email"
									value={searchValue}
									onChange={(event) => {
										setSearchValue(event.target.value);
										setPageNumber(1);
									}}
								/>
								<Button
									variant="outline"
									onClick={() => {
										setMonthValue(() => {
											const now = new Date();
											const yearNumber = now.getFullYear();
											const monthNumber = `${now.getMonth() + 1}`.padStart(
												2,
												"0",
											);
											return `${yearNumber}-${monthNumber}`;
										});
										setCustomerIdValue("");
										setSearchValue("");
										setPageNumber(1);
									}}
								>
									Reset
								</Button>
							</div>
						</div>
						<p className="text-muted-foreground text-xs">
							Range: {fromDateValue || "-"} to {toDateValue || "-"}
						</p>
						{dueInvoices.isLoading ? (
							<p className="text-muted-foreground text-sm">
								Loading due invoices...
							</p>
						) : dueInvoices.isError ? (
							<p className="text-destructive text-sm">
								{dueInvoices.error instanceof Error
									? dueInvoices.error.message
									: "Failed to load due invoices"}
							</p>
						) : !dueInvoices.data?.invoices.data.length ? (
							<p className="text-muted-foreground text-sm">
								No due invoices found.
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Invoice</TableHead>
										<TableHead>Customer</TableHead>
										<TableHead>Due</TableHead>
										<TableHead>Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{dueInvoices.data.invoices.data.map((invoice) => (
										<TableRow key={invoice.id}>
											<TableCell>#{invoice.id}</TableCell>
											<TableCell>{invoice.customer_name}</TableCell>
											<TableCell className="text-destructive">
												৳{invoice.due.toLocaleString()}
											</TableCell>
											<TableCell>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setSelectedInvoiceId(invoice.id);
														setPayAmount(invoice.due.toString());
													}}
												>
													Collect
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
						<div className="flex items-center justify-between">
							<p className="text-muted-foreground text-xs">
								Page {dueInvoices.data?.invoices.pagination.page ?? 1} of{" "}
								{dueInvoices.data?.invoices.pagination.last_page ?? 1}
							</p>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={
										(dueInvoices.data?.invoices.pagination.page ?? 1) <= 1
									}
									onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
								>
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={
										(dueInvoices.data?.invoices.pagination.page ?? 1) >=
										(dueInvoices.data?.invoices.pagination.last_page ?? 1)
									}
									onClick={() => setPageNumber((p) => p + 1)}
								>
									Next
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Payment panel */}
				<Card>
					<CardHeader>
						<CardTitle>Collect Payment</CardTitle>
						<CardDescription>
							{selectedInvoice
								? `Invoice #${selectedInvoice.id} - ${selectedInvoice.customer_name}`
								: "Select an invoice from the left"}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{selectedInvoice ? (
							<>
								<div className="text-sm">
									<p>Total: ৳{selectedInvoice.total_amount.toLocaleString()}</p>
									<p className="text-emerald-600">
										Paid: ৳{selectedInvoice.paid.toLocaleString()}
									</p>
									<p className="text-destructive">
										Due: ৳{selectedInvoice.due.toLocaleString()}
									</p>
								</div>
								<div className="space-y-2">
									<label
										htmlFor="collect-amount"
										className="text-sm font-medium"
									>
										Amount
									</label>
									<Input
										id="collect-amount"
										type="number"
										step="0.01"
										min="0"
										max={selectedInvoice.due}
										value={payAmount}
										onChange={(event) => setPayAmount(event.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<label
										htmlFor="collect-method"
										className="text-sm font-medium"
									>
										Method
									</label>
									<Input
										id="collect-method"
										value={payMethod}
										onChange={(event) => setPayMethod(event.target.value)}
									/>
								</div>
								<Button
									onClick={() => collectMutation.mutate()}
									disabled={collectMutation.isPending}
								>
									{collectMutation.isPending
										? "Collecting..."
										: "Submit Payment"}
								</Button>
								{collectMutation.isError ? (
									<p className="text-destructive text-sm">
										{collectMutation.error instanceof Error
											? collectMutation.error.message
											: "Payment failed"}
									</p>
								) : null}
								{collectMutation.isSuccess ? (
									<p className="text-sm text-emerald-600">
										Payment collected successfully.
									</p>
								) : null}
							</>
						) : (
							<p className="text-muted-foreground text-sm">
								Choose an invoice first to collect payment.
							</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
