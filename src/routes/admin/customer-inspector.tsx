import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Button } from "#/components/ui/button";
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

type CustomerDetails = {
	id: number;
	name: string;
	type: string;
	phone: string | null;
	email: string | null;
	address: string | null;
	recent_invoices: {
		id: number;
		date: string;
		total_amount: number;
		status: "active" | "returned" | "void";
		paid: number;
	}[];
};

type CustomerLedger = {
	customer: {
		id: number;
		name: string;
		type: string;
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
			date: string;
			status: "active" | "returned" | "void";
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

export const Route = createFileRoute("/admin/customer-inspector")({
	component: AdminCustomerInspectorPage,
});

function AdminCustomerInspectorPage() {
	const monthDefault = (() => {
		const now = new Date();
		const y = now.getFullYear();
		const m = `${now.getMonth() + 1}`.padStart(2, "0");
		return `${y}-${m}`;
	})();

	const [customerInput, setCustomerInput] = useState("");
	const [customerId, setCustomerId] = useState("");
	const [month, setMonth] = useState(monthDefault);

	const detailsQuery = useQuery({
		queryKey: ["admin-customer-inspector-details", customerId],
		queryFn: () => apiFetch<CustomerDetails>(`/customers/${customerId}`),
		enabled: customerId.trim().length > 0,
	});

	const ledgerQuery = useQuery({
		queryKey: ["admin-customer-inspector-ledger", customerId, month],
		queryFn: () =>
			apiFetch<CustomerLedger>(
				`/customers/${customerId}/ledger?month=${month}&status=active&per_page=10&page=1`,
			),
		enabled: customerId.trim().length > 0,
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Customer Inspector</h1>
				<p className="text-muted-foreground text-sm">
					Inspect a customer profile, recent invoices, and monthly due totals.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lookup</CardTitle>
					<CardDescription>Enter customer id and month to inspect</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap items-center gap-3">
					<Input
						type="number"
						placeholder="Customer ID"
						value={customerInput}
						onChange={(e) => setCustomerInput(e.target.value)}
						className="max-w-xs"
					/>
					<Input
						type="month"
						value={month}
						onChange={(e) => setMonth(e.target.value)}
						className="max-w-xs"
					/>
					<Button onClick={() => setCustomerId(customerInput.trim())} disabled={!customerInput.trim()}>
						Inspect
					</Button>
				</CardContent>
			</Card>

			{customerId ? (
				<>
					<Card>
						<CardHeader>
							<CardTitle>Customer Profile</CardTitle>
						</CardHeader>
						<CardContent>
							{detailsQuery.isLoading ? (
								<p className="text-muted-foreground text-sm">Loading customer profile...</p>
							) : detailsQuery.isError ? (
								<p className="text-destructive text-sm">
									{detailsQuery.error instanceof Error ? detailsQuery.error.message : "Failed to load customer"}
								</p>
							) : detailsQuery.data ? (
								<div className="grid gap-3 md:grid-cols-2">
									<div>
										<p className="text-muted-foreground text-xs">Name</p>
										<p className="font-medium">{detailsQuery.data.name}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Type</p>
										<p className="font-medium capitalize">{detailsQuery.data.type}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Phone</p>
										<p className="font-medium">{detailsQuery.data.phone ?? "-"}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Email</p>
										<p className="font-medium">{detailsQuery.data.email ?? "-"}</p>
									</div>
								</div>
							) : null}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Recent Invoices</CardTitle>
						</CardHeader>
						<CardContent>
							{detailsQuery.data ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>ID</TableHead>
											<TableHead>Date</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Total</TableHead>
											<TableHead>Paid</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{detailsQuery.data.recent_invoices.map((inv) => (
											<TableRow key={inv.id}>
												<TableCell>{inv.id}</TableCell>
												<TableCell>{inv.date}</TableCell>
												<TableCell className="capitalize">{inv.status}</TableCell>
												<TableCell>৳ {inv.total_amount.toLocaleString()}</TableCell>
												<TableCell>৳ {inv.paid.toLocaleString()}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : (
								<p className="text-muted-foreground text-sm">No data loaded.</p>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Monthly Ledger</CardTitle>
							<CardDescription>{month}</CardDescription>
						</CardHeader>
						<CardContent>
							{ledgerQuery.isLoading ? (
								<p className="text-muted-foreground text-sm">Loading monthly ledger...</p>
							) : ledgerQuery.isError ? (
								<p className="text-destructive text-sm">
									{ledgerQuery.error instanceof Error ? ledgerQuery.error.message : "Failed to load ledger"}
								</p>
							) : ledgerQuery.data ? (
								<div className="grid gap-3 md:grid-cols-4">
									<div>
										<p className="text-muted-foreground text-xs">Invoices</p>
										<p className="font-medium">{ledgerQuery.data.totals.invoice_count}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Sold</p>
										<p className="font-medium">৳ {ledgerQuery.data.totals.sold_amount.toLocaleString()}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Paid</p>
										<p className="font-medium">৳ {ledgerQuery.data.totals.paid_amount.toLocaleString()}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Due</p>
										<p className="font-medium text-destructive">৳ {ledgerQuery.data.totals.due_amount.toLocaleString()}</p>
									</div>
								</div>
							) : null}
						</CardContent>
					</Card>
				</>
			) : null}
		</div>
	);
}
