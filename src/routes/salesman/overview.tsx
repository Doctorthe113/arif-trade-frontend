import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calendar } from "#/components/ui/calendar";
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
import { useAuth } from "#/lib/auth";
import { isAuthDisabled } from "#/lib/auth-flags";

type CustomerSummary = {
	id: number;
	name: string;
	type: string;
	phone: string | null;
	email: string | null;
};

type InvoiceSummary = {
	id: number;
	customer_id: number;
	total_amount: string;
	status: string;
	due: string;
};

type PaginatedCustomers = {
	data: CustomerSummary[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

type PaginatedInvoices = {
	data: InvoiceSummary[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

async function fetchAllCustomers(): Promise<CustomerSummary[]> {
	const perPage = 200;
	let pageNumber = 1;
	let lastPageNumber = 1;
	const rows: CustomerSummary[] = [];

	do {
		const response = await apiFetch<PaginatedCustomers>(
			`/customers?per_page=${perPage}&page=${pageNumber}`,
		);
		rows.push(...(response.data ?? []));
		lastPageNumber = response.pagination?.last_page ?? pageNumber;
		pageNumber += 1;
	} while (pageNumber <= lastPageNumber);

	return rows;
}

async function fetchAllInvoices(): Promise<InvoiceSummary[]> {
	const perPage = 200;
	let pageNumber = 1;
	let lastPageNumber = 1;
	const rows: InvoiceSummary[] = [];

	do {
		const response = await apiFetch<PaginatedInvoices>(
			`/invoices?per_page=${perPage}&page=${pageNumber}`,
		);
		rows.push(...(response.data ?? []));
		lastPageNumber = response.pagination?.last_page ?? pageNumber;
		pageNumber += 1;
	} while (pageNumber <= lastPageNumber);

	return rows;
}

export const Route = createFileRoute("/salesman/overview")({
	component: OverviewPage,
});

/// Salesman overview / customer ledger
function OverviewPage() {
	const { hasRole } = useAuth();
	const canAccessSalesmanDashboard =
		isAuthDisabled || hasRole("superadmin") || hasRole("salesman");

	const customers = useQuery({
		queryKey: ["overview-ledger-customers"],
		queryFn: fetchAllCustomers,
		enabled: canAccessSalesmanDashboard,
	});

	const invoices = useQuery({
		queryKey: ["overview-ledger-invoices"],
		queryFn: fetchAllInvoices,
		enabled: canAccessSalesmanDashboard,
	});

	const customerRows = customers.data ?? [];
	const invoiceData = invoices.data ?? [];

	const customerMetricsById = useMemo(() => {
		const map: Record<
			number,
			{ soldAmountTaka: number; dueAmountTaka: number }
		> = {};

		for (const invoice of invoiceData) {
			if (!map[invoice.customer_id]) {
				map[invoice.customer_id] = { soldAmountTaka: 0, dueAmountTaka: 0 };
			}

			const soldAmount = Number.parseFloat(invoice.total_amount || "0");
			const dueAmount = Number.parseFloat(invoice.due || "0");
			if (invoice.status !== "returned" && invoice.status !== "void") {
				map[invoice.customer_id].soldAmountTaka += soldAmount;
			}
			map[invoice.customer_id].dueAmountTaka += dueAmount;
		}

		return map;
	}, [invoiceData]);

	const totalCustomers = customerRows.length;
	const totalRevenueTaka = Object.values(customerMetricsById).reduce(
		(sum, metric) => sum + metric.soldAmountTaka,
		0,
	);
	const totalDueTaka = Object.values(customerMetricsById).reduce(
		(sum, metric) => sum + metric.dueAmountTaka,
		0,
	);
	const activeInvoices = invoiceData.filter(
		(inv) => inv.status === "active",
	).length;

	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		new Date(),
	);

	if (!canAccessSalesmanDashboard) return <Navigate to="/salesman/inventory" />;

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Overview</h1>

			<div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle>Total Customers</CardTitle>
						<CardDescription className="text-3xl">
							{totalCustomers}
						</CardDescription>
					</CardHeader>
					<CardHeader className="mt-4">
						<CardTitle>Active Invoices</CardTitle>
						<CardDescription className="text-3xl">
							{activeInvoices}
						</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle>Total Revenue</CardTitle>
						<CardDescription className="text-3xl">
							৳{totalRevenueTaka.toLocaleString()}
						</CardDescription>
					</CardHeader>
					<CardHeader className="mt-4">
						<CardTitle>Total Due</CardTitle>
						<CardDescription className="text-3xl text-destructive">
							৳{totalDueTaka.toLocaleString()}
						</CardDescription>
					</CardHeader>
				</Card>
				<Card className="min-w-md">
					<CardContent className="p-0 flex justify-center">
						<Calendar
							mode="single"
							captionLayout="dropdown"
							selected={selectedDate}
							onSelect={setSelectedDate}
							className="h-full w-full max-w-sm rounded-lg border-0"
						/>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Customer Ledger</CardTitle>
					<CardDescription>Sold and due amount per customer</CardDescription>
				</CardHeader>
				<CardContent>
					{customers.isLoading || invoices.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading...</p>
					) : customers.isError ? (
						<p className="text-destructive text-sm">
							{customers.error instanceof Error
								? customers.error.message
								: "Failed to load customers"}
						</p>
					) : invoices.isError ? (
						<p className="text-destructive text-sm">
							{invoices.error instanceof Error
								? invoices.error.message
								: "Failed to load invoices"}
						</p>
					) : !customerRows.length ? (
						<p className="text-muted-foreground text-sm">No customers found.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Phone</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Sold</TableHead>
									<TableHead>Due</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{customerRows.map((customer) => {
									const metric = customerMetricsById[customer.id] ?? {
										soldAmountTaka: 0,
										dueAmountTaka: 0,
									};

									return (
										<TableRow key={customer.id}>
											<TableCell>{customer.name}</TableCell>
											<TableCell className="capitalize">
												{customer.type}
											</TableCell>
											<TableCell>{customer.phone ?? "—"}</TableCell>
											<TableCell>{customer.email ?? "—"}</TableCell>
											<TableCell>
												৳{metric.soldAmountTaka.toLocaleString()}
											</TableCell>
											<TableCell className="text-destructive">
												৳{metric.dueAmountTaka.toLocaleString()}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
