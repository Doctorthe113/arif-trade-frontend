import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
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
import { sortRowsByDateValue } from "#/lib/sort";

type Invoice = {
	id: number;
	customer_name: string | null;
	date: string;
	total_amount: string;
	status: string;
	paid: string;
	due: string;
};

type PaginatedInvoices = {
	data: Invoice[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

export const Route = createFileRoute("/salesman/invoices")({
	component: InvoicesPage,
});

/// Invoice list table
function InvoicesPage() {
	const { hasRole } = useAuth();
	const canAccessSalesmanDashboard =
		isAuthDisabled || hasRole("superadmin") || hasRole("salesman");

	const [pageNumber, setPageNumber] = useState(1);
	const [dateSortDirection, setDateSortDirection] = useState<"asc" | "desc">(
		"desc",
	);

	const { data, isLoading } = useQuery({
		queryKey: ["invoices", pageNumber],
		queryFn: () =>
			apiFetch<PaginatedInvoices>(`/invoices?per_page=20&page=${pageNumber}`),
	});

	const statusVariant = (s: string) => {
		if (s === "active") return "default" as const;
		if (s === "void") return "destructive" as const;
		return "secondary" as const;
	};

	const invoices = useMemo(() => {
		return sortRowsByDateValue(
			data?.data ?? [],
			(invoice) => invoice.date,
			dateSortDirection,
		);
	}, [data?.data, dateSortDirection]);

	const pagination = data?.pagination;

	if (!canAccessSalesmanDashboard) return <Navigate to="/salesman/inventory" />;

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Invoices</h1>
			<Card>
				<CardHeader>
					<CardTitle>All Invoices</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<p className="text-muted-foreground text-sm">Loading...</p>
					) : !invoices.length ? (
						<p className="text-muted-foreground text-sm">No invoices found.</p>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>ID</TableHead>
										<TableHead>Customer</TableHead>
										<TableHead>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													setDateSortDirection((currentSortDirection) =>
														currentSortDirection === "asc" ? "desc" : "asc",
													)
												}
											>
												Date (
												{dateSortDirection === "asc" ? "Oldest" : "Newest"})
											</Button>
										</TableHead>
										<TableHead>Amount</TableHead>
										<TableHead>Paid</TableHead>
										<TableHead>Due</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{invoices.map((inv) => {
										const statusText = inv.status || "unknown";
										return (
											<TableRow key={inv.id}>
												<TableCell>{inv.id}</TableCell>
												<TableCell>{inv.customer_name || "-"}</TableCell>
												<TableCell>{inv.date}</TableCell>
												<TableCell>
													৳
													{Number.parseFloat(inv.total_amount).toLocaleString()}
												</TableCell>
												<TableCell>
													৳{Number.parseFloat(inv.paid).toLocaleString()}
												</TableCell>
												<TableCell className="text-destructive">
													৳{Number.parseFloat(inv.due).toLocaleString()}
												</TableCell>
												<TableCell>
													<Badge variant={statusVariant(statusText)}>
														{statusText}
													</Badge>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
							<div className="mt-4 flex items-center justify-between">
								<p className="text-muted-foreground text-sm">
									Page {pagination?.page ?? 1} of {pagination?.last_page ?? 1} (
									{pagination?.total ?? 0} total)
								</p>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={(pagination?.page ?? 1) <= 1}
										onClick={() =>
											setPageNumber((currentPageNumber) =>
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
											(pagination?.page ?? 1) >= (pagination?.last_page ?? 1)
										}
										onClick={() =>
											setPageNumber(
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
