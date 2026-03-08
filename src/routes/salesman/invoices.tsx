import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { apiFetch } from "#/lib/api";

type Invoice = {
	id: number;
	customer_name: string;
	date: string;
	total_amount: string;
	status: string;
	paid: string;
	due: string;
};

type PaginatedInvoices = {
	data: Invoice[];
	total: number;
};

export const Route = createFileRoute("/salesman/invoices")({
	component: InvoicesPage,
});

/// Invoice list table
function InvoicesPage() {
	const { data, isLoading } = useQuery({
		queryKey: ["invoices"],
		queryFn: () => apiFetch<PaginatedInvoices>("/invoices?per_page=100"),
	});

	const statusVariant = (s: string) => {
		if (s === "active") return "default" as const;
		if (s === "void") return "destructive" as const;
		return "secondary" as const;
	};

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
					) : (
						<div className="overflow-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left">
										<th className="pb-2 font-medium">ID</th>
										<th className="pb-2 font-medium">Customer</th>
										<th className="pb-2 font-medium">Date</th>
										<th className="pb-2 font-medium">Amount</th>
										<th className="pb-2 font-medium">Paid</th>
										<th className="pb-2 font-medium">Due</th>
										<th className="pb-2 font-medium">Status</th>
									</tr>
								</thead>
								<tbody>
									{(data?.data ?? []).map((inv) => (
										<tr key={inv.id} className="border-b">
											<td className="py-2">{inv.id}</td>
											<td className="py-2">{inv.customer_name}</td>
											<td className="py-2">{inv.date}</td>
											<td className="py-2">
												৳{Number.parseFloat(inv.total_amount).toLocaleString()}
											</td>
											<td className="py-2">
												৳{Number.parseFloat(inv.paid).toLocaleString()}
											</td>
											<td className="py-2 text-destructive">
												৳{Number.parseFloat(inv.due).toLocaleString()}
											</td>
											<td className="py-2">
												<Badge variant={statusVariant(inv.status)}>
													{inv.status}
												</Badge>
											</td>
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
