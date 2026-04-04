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
	lots: {
		total_lots: number;
		lots_with_stock: number;
		low_stock_lots: number;
		lot_quantity_left: number;
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
		customer_type: string;
		invoice_count: number;
		sold_amount: number;
		paid_amount: number;
		due_amount: number;
	}[];
};

export const Route = createFileRoute("/admin/analytics-inspector")({
	component: AdminAnalyticsInspectorPage,
});

function AdminAnalyticsInspectorPage() {
	const monthDefault = useMemo(() => {
		const now = new Date();
		const y = now.getFullYear();
		const m = `${now.getMonth() + 1}`.padStart(2, "0");
		return `${y}-${m}`;
	}, []);

	const [month, setMonth] = useState(monthDefault);
	const [topLimit, setTopLimit] = useState("10");
	const [customerLimit, setCustomerLimit] = useState("10");

	const safeTopLimit = Math.min(Math.max(Number(topLimit) || 10, 1), 50);
	const safeCustomerLimit = Math.min(Math.max(Number(customerLimit) || 10, 1), 200);

	const summaryQuery = useQuery({
		queryKey: ["admin-analytics-inspector-summary", month],
		queryFn: () => apiFetch<SummaryResponse>(`/analytics/summary?month=${month}`),
	});

	const topProductsQuery = useQuery({
		queryKey: ["admin-analytics-inspector-top-products", month, safeTopLimit],
		queryFn: () =>
			apiFetch<TopProductsResponse>(`/analytics/top-products?month=${month}&limit=${safeTopLimit}`),
	});

	const customerSalesQuery = useQuery({
		queryKey: [
			"admin-analytics-inspector-customer-sales",
			month,
			safeCustomerLimit,
		],
		queryFn: () =>
			apiFetch<CustomerSalesResponse>(
				`/analytics/customer-monthly-sales?month=${month}&limit=${safeCustomerLimit}`,
			),
	});

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">Analytics Inspector</h1>
					<p className="text-muted-foreground text-sm">
						Inspect monthly analytics snapshots with adjustable list limits.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Input
						type="month"
						value={month}
						onChange={(e) => setMonth(e.target.value)}
						className="w-44"
					/>
					<Input
						type="number"
						min={1}
						max={50}
						placeholder="Top products limit"
						value={topLimit}
						onChange={(e) => setTopLimit(e.target.value)}
						className="w-40"
					/>
					<Input
						type="number"
						min={1}
						max={200}
						placeholder="Customers limit"
						value={customerLimit}
						onChange={(e) => setCustomerLimit(e.target.value)}
						className="w-40"
					/>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Summary</CardTitle>
					<CardDescription>Month: {month}</CardDescription>
				</CardHeader>
				<CardContent>
					{summaryQuery.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading summary...</p>
					) : summaryQuery.isError ? (
						<p className="text-destructive text-sm">
							{summaryQuery.error instanceof Error ? summaryQuery.error.message : "Failed to load summary"}
						</p>
					) : summaryQuery.data ? (
						<div className="grid gap-3 md:grid-cols-4">
							<div>
								<p className="text-muted-foreground text-xs">Revenue</p>
								<p className="font-medium">Tk {summaryQuery.data.totals.total_revenue.toLocaleString()}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Paid</p>
								<p className="font-medium">Tk {summaryQuery.data.totals.total_paid.toLocaleString()}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Due</p>
								<p className="font-medium text-destructive">Tk {summaryQuery.data.totals.total_due.toLocaleString()}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Invoices</p>
								<p className="font-medium">{summaryQuery.data.totals.invoice_count}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Customers Served</p>
								<p className="font-medium">{summaryQuery.data.totals.customers_served}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Total Lots</p>
								<p className="font-medium">{summaryQuery.data.lots.total_lots}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Lots With Stock</p>
								<p className="font-medium">{summaryQuery.data.lots.lots_with_stock}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Low Stock Lots</p>
								<p className="font-medium">{summaryQuery.data.lots.low_stock_lots}</p>
							</div>
						</div>
					) : null}
				</CardContent>
			</Card>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Top Products</CardTitle>
						<CardDescription>Limit: {safeTopLimit}</CardDescription>
					</CardHeader>
					<CardContent>
						{topProductsQuery.isLoading ? (
							<p className="text-muted-foreground text-sm">Loading top products...</p>
						) : topProductsQuery.isError ? (
							<p className="text-destructive text-sm">
								{topProductsQuery.error instanceof Error
									? topProductsQuery.error.message
									: "Failed to load top products"}
							</p>
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
											<TableCell>{item.quantity_sold.toLocaleString()}</TableCell>
											<TableCell>Tk {item.revenue.toLocaleString()}</TableCell>
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
						<CardDescription>Limit: {safeCustomerLimit}</CardDescription>
					</CardHeader>
					<CardContent>
						{customerSalesQuery.isLoading ? (
							<p className="text-muted-foreground text-sm">Loading customer sales...</p>
						) : customerSalesQuery.isError ? (
							<p className="text-destructive text-sm">
								{customerSalesQuery.error instanceof Error
									? customerSalesQuery.error.message
									: "Failed to load customer sales"}
							</p>
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
											<TableCell>Tk {item.due_amount.toLocaleString()}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
