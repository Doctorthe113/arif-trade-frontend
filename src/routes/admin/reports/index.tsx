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

type SummaryResponse = {
	month: string;
	totals: {
		invoice_count: number;
		customers_served: number;
		total_revenue: number;
		total_paid: number;
		total_due: number;
	};
};

type TopProductsResponse = {
	month: string;
	items: {
		product_id: number;
		product_name: string;
		product_code: string;
		quantity_sold: number;
		revenue: number;
	}[];
};

type CustomerSalesResponse = {
	month: string;
	items: {
		customer_id: number;
		customer_name: string;
		invoice_count: number;
		sold_amount: number;
		paid_amount: number;
		due_amount: number;
	}[];
};

type DueInvoicesResponse = {
	totals: {
		invoice_count: number;
		sold_amount: number;
		paid_amount: number;
		due_amount: number;
	};
	invoices: {
		data: {
			id: number;
			customer_name: string;
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

export const Route = createFileRoute("/admin/reports/")({
	component: AdminReportsPage,
});

function AdminReportsPage() {
	const monthDefault = useMemo(() => {
		const now = new Date();
		const y = now.getFullYear();
		const m = `${now.getMonth() + 1}`.padStart(2, "0");
		return `${y}-${m}`;
	}, []);

	const [month, setMonth] = useState(monthDefault);

	const [year, monthPart] = month.split("-");
	const fromDate = `${year}-${monthPart}-01`;
	const toDate = new Date(Number(year), Number(monthPart), 0)
		.toISOString()
		.slice(0, 10);

	const summaryQuery = useQuery({
		queryKey: ["admin-reports-summary", month],
		queryFn: () => apiFetch<SummaryResponse>(`/analytics/summary?month=${month}`),
	});

	const topProductsQuery = useQuery({
		queryKey: ["admin-reports-top-products", month],
		queryFn: () =>
			apiFetch<TopProductsResponse>(
				`/analytics/top-products?month=${month}&limit=10`,
			),
	});

	const customerSalesQuery = useQuery({
		queryKey: ["admin-reports-customer-sales", month],
		queryFn: () =>
			apiFetch<CustomerSalesResponse>(
				`/analytics/customer-monthly-sales?month=${month}&limit=10`,
			),
	});

	const dueQuery = useQuery({
		queryKey: ["admin-reports-due", fromDate, toDate],
		queryFn: () =>
			apiFetch<DueInvoicesResponse>(
				`/invoices/due?from=${fromDate}&to=${toDate}&per_page=10&page=1`,
			),
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Reports</h1>
					<p className="text-muted-foreground text-sm">Monthly analytics and due drilldown</p>
				</div>
				<div className="w-44">
					<Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Revenue</CardDescription>
						<CardTitle>
							৳ {Number(summaryQuery.data?.totals.total_revenue ?? 0).toLocaleString()}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Paid</CardDescription>
						<CardTitle>
							৳ {Number(summaryQuery.data?.totals.total_paid ?? 0).toLocaleString()}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Due</CardDescription>
						<CardTitle className="text-destructive">
							৳ {Number(summaryQuery.data?.totals.total_due ?? 0).toLocaleString()}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Invoices</CardDescription>
						<CardTitle>{summaryQuery.data?.totals.invoice_count ?? 0}</CardTitle>
					</CardHeader>
				</Card>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Top Products</CardTitle>
					</CardHeader>
					<CardContent>
						{topProductsQuery.isLoading ? (
							<p className="text-muted-foreground text-sm">Loading top products...</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Product</TableHead>
										<TableHead>Qty</TableHead>
										<TableHead>Revenue</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{(topProductsQuery.data?.items ?? []).map((item) => (
										<TableRow key={item.product_id}>
											<TableCell>{item.product_name}</TableCell>
											<TableCell>{item.quantity_sold}</TableCell>
											<TableCell>৳ {item.revenue.toLocaleString()}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Customer Sales</CardTitle>
					</CardHeader>
					<CardContent>
						{customerSalesQuery.isLoading ? (
							<p className="text-muted-foreground text-sm">Loading customer sales...</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Customer</TableHead>
										<TableHead>Invoices</TableHead>
										<TableHead>Due</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{(customerSalesQuery.data?.items ?? []).map((item) => (
										<TableRow key={item.customer_id}>
											<TableCell>{item.customer_name}</TableCell>
											<TableCell>{item.invoice_count}</TableCell>
											<TableCell>৳ {item.due_amount.toLocaleString()}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Due Invoices In Selected Month</CardTitle>
					<CardDescription>
						From {fromDate} to {toDate}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{dueQuery.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading due invoices...</p>
					) : dueQuery.isError ? (
						<p className="text-destructive text-sm">
							{dueQuery.error instanceof Error ? dueQuery.error.message : "Failed to load due invoices"}
						</p>
					) : (
						<>
							<p className="text-muted-foreground mb-3 text-xs">
								Due total: ৳ {Number(dueQuery.data?.totals.due_amount ?? 0).toLocaleString()} | Invoices: {dueQuery.data?.totals.invoice_count ?? 0}
							</p>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>ID</TableHead>
										<TableHead>Customer</TableHead>
										<TableHead>Date</TableHead>
										<TableHead>Due</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{(dueQuery.data?.invoices.data ?? []).map((inv) => (
										<TableRow key={inv.id}>
											<TableCell>{inv.id}</TableCell>
											<TableCell>{inv.customer_name}</TableCell>
											<TableCell>{inv.date}</TableCell>
											<TableCell className="text-destructive">৳ {Number(inv.due).toLocaleString()}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
