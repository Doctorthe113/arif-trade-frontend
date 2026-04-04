import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
		data: {
			id: number;
			quotation_id: number;
			customer_id: number;
			customer_name: string;
			customer_phone: string | null;
			customer_email: string | null;
			date: string;
			total_amount: number;
			paid: number;
			due: number;
		}[];
		pagination: {
			page: number;
			per_page: number;
			total: number;
			last_page: number;
		};
	};
};

export const Route = createFileRoute("/admin/due-inspector")({
	component: AdminDueInspectorPage,
});

function AdminDueInspectorPage() {
	const [search, setSearch] = useState("");
	const [customerId, setCustomerId] = useState("");
	const [month, setMonth] = useState(() => {
		const now = new Date();
		const y = now.getFullYear();
		const m = `${now.getMonth() + 1}`.padStart(2, "0");
		return `${y}-${m}`;
	});

	const [year, monthPart] = month.split("-");
	const fromDate = `${year}-${monthPart}-01`;
	const toDate = new Date(Number(year), Number(monthPart), 0).toISOString().slice(0, 10);

	const queryString = useMemo(() => {
		const params = new URLSearchParams();
		params.set("from", fromDate);
		params.set("to", toDate);
		params.set("per_page", "25");
		params.set("page", "1");
		if (search.trim()) params.set("search", search.trim());
		if (customerId.trim()) params.set("customer_id", customerId.trim());
		return params.toString();
	}, [fromDate, toDate, search, customerId]);

	const dueQuery = useQuery({
		queryKey: ["admin-due-inspector", queryString],
		queryFn: () => apiFetch<DueInvoiceResponse>(`/invoices/due?${queryString}`),
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Due Inspector</h1>
				<p className="text-muted-foreground text-sm">
					Inspect due-invoice totals and rows with month, customer, and search filters.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Filters</CardTitle>
					<CardDescription>Focused outstanding due inspection</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 md:grid-cols-3">
					<Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
					<Input
						placeholder="Customer ID (optional)"
						value={customerId}
						onChange={(e) => setCustomerId(e.target.value)}
					/>
					<Input
						placeholder="Search customer"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Summary</CardTitle>
					<CardDescription>
						From {fromDate} to {toDate}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{dueQuery.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading due summary...</p>
					) : dueQuery.isError ? (
						<p className="text-destructive text-sm">
							{dueQuery.error instanceof Error ? dueQuery.error.message : "Failed to load due data"}
						</p>
					) : dueQuery.data ? (
						<div className="grid gap-3 md:grid-cols-4">
							<div>
								<p className="text-muted-foreground text-xs">Invoices</p>
								<p className="font-medium">{dueQuery.data.totals.invoice_count}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Sold</p>
								<p className="font-medium">Tk {dueQuery.data.totals.sold_amount.toLocaleString()}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Paid</p>
								<p className="font-medium">Tk {dueQuery.data.totals.paid_amount.toLocaleString()}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Due</p>
								<p className="font-medium text-destructive">Tk {dueQuery.data.totals.due_amount.toLocaleString()}</p>
							</div>
						</div>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Due Invoices</CardTitle>
				</CardHeader>
				<CardContent>
					{!dueQuery.data?.invoices.data.length ? (
						<p className="text-muted-foreground text-sm">No due invoices found for current filters.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Invoice</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Total</TableHead>
									<TableHead>Paid</TableHead>
									<TableHead>Due</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{dueQuery.data.invoices.data.map((row) => (
									<TableRow key={row.id}>
										<TableCell>#{row.id}</TableCell>
										<TableCell>{row.customer_name}</TableCell>
										<TableCell>{row.date}</TableCell>
										<TableCell>Tk {row.total_amount.toLocaleString()}</TableCell>
										<TableCell>Tk {row.paid.toLocaleString()}</TableCell>
										<TableCell className="text-destructive">Tk {row.due.toLocaleString()}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
