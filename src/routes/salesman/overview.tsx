import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
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

type CustomerSummary = {
	id: number;
	name: string;
	type: string;
	phone: string | null;
	email: string | null;
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

export const Route = createFileRoute("/salesman/overview")({
	component: OverviewPage,
});

/// Salesman overview / customer ledger
function OverviewPage() {
	const [customerPageNumber, setCustomerPageNumber] = useState(1);

	const customers = useQuery({
		queryKey: ["customers", customerPageNumber],
		queryFn: () =>
			apiFetch<PaginatedCustomers>(
				`/customers?per_page=20&page=${customerPageNumber}`,
			),
	});

	const invoices = useQuery({
		queryKey: ["invoices-summary"],
		queryFn: () =>
			apiFetch<{
				data: {
					id: number;
					total_amount: string;
					status: string;
					due: string;
				}[];
			}>("/invoices?per_page=100"),
	});

	const totalCustomers = customers.data?.pagination.total ?? 0;
	const invoiceData = invoices.data?.data ?? [];
	const totalRevenueTaka = invoiceData.reduce(
		(sum, inv) => sum + Number.parseFloat(inv.total_amount || "0"),
		0,
	);
	const totalDueTaka = invoiceData.reduce(
		(sum, inv) => sum + Number.parseFloat(inv.due || "0"),
		0,
	);
	const activeInvoices = invoiceData.filter(
		(inv) => inv.status === "active",
	).length;
	const customerPagination = customers.data?.pagination;

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Overview</h1>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Total Customers</CardDescription>
						<CardTitle className="text-3xl">{totalCustomers}</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Total Revenue</CardDescription>
						<CardTitle className="text-3xl">
							৳{totalRevenueTaka.toLocaleString()}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Total Due</CardDescription>
						<CardTitle className="text-3xl text-destructive">
							৳{totalDueTaka.toLocaleString()}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Active Invoices</CardDescription>
						<CardTitle className="text-3xl">{activeInvoices}</CardTitle>
					</CardHeader>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Customer Ledger</CardTitle>
					<CardDescription>All registered customers</CardDescription>
				</CardHeader>
				<CardContent>
					{customers.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading...</p>
					) : !(customers.data?.data ?? []).length ? (
						<p className="text-muted-foreground text-sm">No customers found.</p>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Phone</TableHead>
										<TableHead>Email</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{(customers.data?.data ?? []).map((customer) => (
										<TableRow key={customer.id}>
											<TableCell>{customer.name}</TableCell>
											<TableCell className="capitalize">
												{customer.type}
											</TableCell>
											<TableCell>{customer.phone ?? "—"}</TableCell>
											<TableCell>{customer.email ?? "—"}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							<div className="mt-4 flex items-center justify-between">
								<p className="text-muted-foreground text-sm">
									Page {customerPagination?.page ?? 1} of{" "}
									{customerPagination?.last_page ?? 1} (
									{customerPagination?.total ?? 0} total)
								</p>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={(customerPagination?.page ?? 1) <= 1}
										onClick={() =>
											setCustomerPageNumber((currentPageNumber) =>
												Math.max(1, currentPageNumber - 1),
											)
										}
									>
										Previous
									</Button>
									<Button
										variant="outline"
										size="sm"
										disabled={
											(customerPagination?.page ?? 1) >=
											(customerPagination?.last_page ?? 1)
										}
										onClick={() =>
											setCustomerPageNumber(
												(currentPageNumber) => currentPageNumber + 1,
											)
										}
									>
										Next
									</Button>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
