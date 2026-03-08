import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
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
	total: number;
	page: number;
	per_page: number;
};

export const Route = createFileRoute("/salesman/overview")({
	component: OverviewPage,
});

/// Salesman overview / customer ledger
function OverviewPage() {
	const customers = useQuery({
		queryKey: ["customers"],
		queryFn: () => apiFetch<PaginatedCustomers>("/customers?per_page=100"),
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

	const totalCustomers = customers.data?.total ?? 0;
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
					) : (
						<div className="overflow-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left">
										<th className="pb-2 font-medium">Name</th>
										<th className="pb-2 font-medium">Type</th>
										<th className="pb-2 font-medium">Phone</th>
										<th className="pb-2 font-medium">Email</th>
									</tr>
								</thead>
								<tbody>
									{(customers.data?.data ?? []).map((c) => (
										<tr key={c.id} className="border-b">
											<td className="py-2">{c.name}</td>
											<td className="py-2 capitalize">{c.type}</td>
											<td className="py-2">{c.phone ?? "—"}</td>
											<td className="py-2">{c.email ?? "—"}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
