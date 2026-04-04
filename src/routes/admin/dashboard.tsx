import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
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

export const Route = createFileRoute("/admin/dashboard")({
	component: AdminDashboardPage,
});

function AdminDashboardPage() {
	const month = useMemo(() => {
		const now = new Date();
		const y = now.getFullYear();
		const m = `${now.getMonth() + 1}`.padStart(2, "0");
		return `${y}-${m}`;
	}, []);

	const summary = useQuery({
		queryKey: ["admin-dashboard-summary", month],
		queryFn: () => apiFetch<SummaryResponse>(`/analytics/summary?month=${month}`),
	});

	const topProducts = useQuery({
		queryKey: ["admin-dashboard-top-products", month],
		queryFn: () =>
			apiFetch<TopProductsResponse>(
				`/analytics/top-products?month=${month}&limit=7`,
			),
	});

	const customerSales = useQuery({
		queryKey: ["admin-dashboard-customer-sales", month],
		queryFn: () =>
			apiFetch<CustomerSalesResponse>(
				`/analytics/customer-monthly-sales?month=${month}&limit=12`,
			),
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Admin Dashboard</h1>
				<p className="text-muted-foreground text-sm">Monthly analytics for {month}</p>
			</div>

			{summary.isLoading ? (
				<p className="text-muted-foreground text-sm">Loading dashboard metrics...</p>
			) : summary.isError ? (
				<p className="text-destructive text-sm">
					{summary.error instanceof Error
						? summary.error.message
						: "Failed to load summary"}
				</p>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Total Revenue</CardDescription>
							<CardTitle className="text-3xl">
								৳{summary.data.totals.total_revenue.toLocaleString()}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Total Paid</CardDescription>
							<CardTitle className="text-3xl text-emerald-600">
								৳{summary.data.totals.total_paid.toLocaleString()}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Total Due</CardDescription>
							<CardTitle className="text-3xl text-destructive">
								৳{summary.data.totals.total_due.toLocaleString()}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Invoices This Month</CardDescription>
							<CardTitle className="text-3xl">
								{summary.data.totals.invoice_count}
							</CardTitle>
						</CardHeader>
					</Card>
				</div>
			)}

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Top Products</CardTitle>
						<CardDescription>Best performers by monthly revenue</CardDescription>
					</CardHeader>
					<CardContent>
						{topProducts.isLoading ? (
							<p className="text-muted-foreground text-sm">Loading products...</p>
						) : topProducts.isError ? (
							<p className="text-destructive text-sm">
								{topProducts.error instanceof Error
									? topProducts.error.message
									: "Failed to load products"}
							</p>
						) : !topProducts.data.items.length ? (
							<p className="text-muted-foreground text-sm">No sales data for this month.</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Product</TableHead>
										<TableHead>Sold</TableHead>
										<TableHead>Revenue</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{topProducts.data.items.map((item) => (
										<TableRow key={item.product_id}>
											<TableCell>
												<div className="font-medium">{item.product_name}</div>
												<div className="text-muted-foreground text-xs">
													{item.product_code}
												</div>
											</TableCell>
											<TableCell>{item.quantity_sold.toLocaleString()}</TableCell>
											<TableCell>৳{item.revenue.toLocaleString()}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Lot Status</CardTitle>
						<CardDescription>Live lot availability snapshot</CardDescription>
					</CardHeader>
					<CardContent>
						{summary.isLoading ? (
							<p className="text-muted-foreground text-sm">Loading lot status...</p>
						) : summary.isError ? (
							<p className="text-destructive text-sm">Failed to load lot status.</p>
						) : (
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-muted-foreground text-xs">Total Lots</p>
									<p className="text-2xl font-semibold">{summary.data.lots.total_lots}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Lots With Stock</p>
									<p className="text-2xl font-semibold">
										{summary.data.lots.lots_with_stock}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Low Stock Lots</p>
									<p className="text-2xl font-semibold text-amber-600">
										{summary.data.lots.low_stock_lots}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Quantity Left</p>
									<p className="text-2xl font-semibold">
										{summary.data.lots.lot_quantity_left.toLocaleString()}
									</p>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Customer Monthly Sales</CardTitle>
					<CardDescription>Sold, paid and due by customer</CardDescription>
				</CardHeader>
				<CardContent>
					{customerSales.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading customer sales...</p>
					) : customerSales.isError ? (
						<p className="text-destructive text-sm">
							{customerSales.error instanceof Error
								? customerSales.error.message
								: "Failed to load customer sales"}
						</p>
					) : !customerSales.data.items.length ? (
						<p className="text-muted-foreground text-sm">No customer sales for this month.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Customer</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Invoices</TableHead>
									<TableHead>Sold</TableHead>
									<TableHead>Paid</TableHead>
									<TableHead>Due</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{customerSales.data.items.map((item) => (
									<TableRow key={item.customer_id}>
										<TableCell className="font-medium">{item.customer_name}</TableCell>
										<TableCell className="capitalize">{item.customer_type}</TableCell>
										<TableCell>{item.invoice_count}</TableCell>
										<TableCell>৳{item.sold_amount.toLocaleString()}</TableCell>
										<TableCell className="text-emerald-600">
											৳{item.paid_amount.toLocaleString()}
										</TableCell>
										<TableCell className="text-destructive">
											৳{item.due_amount.toLocaleString()}
										</TableCell>
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
