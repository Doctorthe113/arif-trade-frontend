import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
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

type CustomerRow = {
	id: number;
	name: string;
	type: string;
	phone: string | null;
	email: string | null;
};

type CustomerListResponse = {
	data: CustomerRow[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

type CustomerLedgerResponse = {
	customer: {
		id: number;
		name: string;
		type: string;
		phone: string | null;
		email: string | null;
		address: string | null;
	};
	filters: {
		month: string | null;
		status: "active" | "returned" | "void" | null;
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

export const Route = createFileRoute("/admin/customer-ledger")({
	component: CustomerLedgerPage,
});

function CustomerLedgerPage() {
	const [customerPage, setCustomerPage] = useState(1);
	const [searchValue, setSearchValue] = useState("");
	const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
	const [monthValue, setMonthValue] = useState(() => {
		const now = new Date();
		return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}`;
	});

	const customers = useQuery({
		queryKey: ["customer-ledger-customers", customerPage, searchValue],
		queryFn: () =>
			apiFetch<CustomerListResponse>(
				`/customers?per_page=15&page=${customerPage}&search=${encodeURIComponent(searchValue)}`,
			),
	});

	const selectedCustomer = useMemo(
		() =>
			(customers.data?.data ?? []).find(
				(c: CustomerRow) => c.id === selectedCustomerId,
			),
		[customers.data, selectedCustomerId],
	);

	const ledger = useQuery({
		queryKey: ["customer-ledger-details", selectedCustomerId, monthValue],
		queryFn: () =>
			apiFetch<CustomerLedgerResponse>(
				`/customers/${selectedCustomerId}/ledger?month=${monthValue}&status=active&per_page=20&page=1`,
			),
		enabled: selectedCustomerId !== null,
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Customer Ledger</h1>
				<p className="text-muted-foreground text-sm">
					Open a customer profile and review sold, paid, and due details.
				</p>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Customers</CardTitle>
						<CardDescription>Select a customer to view full ledger.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Input
							placeholder="Search by name, email, or phone"
							value={searchValue}
							onChange={(event) => {
								setSearchValue(event.target.value);
								setCustomerPage(1);
							}}
						/>

						{customers.isLoading ? (
							<p className="text-muted-foreground text-sm">Loading customers...</p>
						) : customers.isError ? (
							<p className="text-destructive text-sm">
								{customers.error instanceof Error
									? customers.error.message
									: "Failed to load customers"}
							</p>
						) : !customers.data?.data.length ? (
							<p className="text-muted-foreground text-sm">No customers found.</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{customers.data.data.map((customer: CustomerRow) => (
										<TableRow
											key={customer.id}
											className={
												customer.id === selectedCustomerId ? "bg-muted/40" : undefined
											}
										>
											<TableCell className="font-medium">{customer.name}</TableCell>
											<TableCell className="capitalize">{customer.type}</TableCell>
											<TableCell>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setSelectedCustomerId(customer.id)}
												>
													View Ledger
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}

						<div className="flex items-center justify-between">
							<p className="text-muted-foreground text-xs">
								Page {customers.data?.pagination.page ?? 1} of{" "}
								{customers.data?.pagination.last_page ?? 1}
							</p>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={(customers.data?.pagination.page ?? 1) <= 1}
									onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
								>
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={
										(customers.data?.pagination.page ?? 1) >=
										(customers.data?.pagination.last_page ?? 1)
									}
									onClick={() => setCustomerPage((p) => p + 1)}
								>
									Next
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Ledger Details</CardTitle>
						<CardDescription>
							{selectedCustomer
								? `Selected: ${selectedCustomer.name}`
								: "Select a customer from the left panel"}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="max-w-[220px] space-y-2">
							<label htmlFor="month-filter" className="text-sm font-medium">
								Month
							</label>
							<Input
								id="month-filter"
								type="month"
								value={monthValue}
								onChange={(event) => setMonthValue(event.target.value)}
							/>
						</div>

						{selectedCustomerId === null ? (
							<p className="text-muted-foreground text-sm">
								Select a customer to load ledger totals.
							</p>
						) : ledger.isLoading ? (
							<p className="text-muted-foreground text-sm">Loading ledger...</p>
						) : ledger.isError ? (
							<p className="text-destructive text-sm">
								{ledger.error instanceof Error
									? ledger.error.message
									: "Failed to load ledger"}
							</p>
						) : (
							<>
								<div className="grid gap-3 sm:grid-cols-2">
									<Card>
										<CardHeader className="pb-2">
											<CardDescription>Sold</CardDescription>
											<CardTitle>৳{ledger.data.totals.sold_amount.toLocaleString()}</CardTitle>
										</CardHeader>
									</Card>
									<Card>
										<CardHeader className="pb-2">
											<CardDescription>Paid</CardDescription>
											<CardTitle className="text-emerald-600">
												৳{ledger.data.totals.paid_amount.toLocaleString()}
											</CardTitle>
										</CardHeader>
									</Card>
									<Card>
										<CardHeader className="pb-2">
											<CardDescription>Due</CardDescription>
											<CardTitle className="text-destructive">
												৳{ledger.data.totals.due_amount.toLocaleString()}
											</CardTitle>
										</CardHeader>
									</Card>
									<Card>
										<CardHeader className="pb-2">
											<CardDescription>Invoices</CardDescription>
											<CardTitle>{ledger.data.totals.invoice_count}</CardTitle>
										</CardHeader>
									</Card>
								</div>

								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Date</TableHead>
											<TableHead>Invoice</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Sold</TableHead>
											<TableHead>Paid</TableHead>
											<TableHead>Due</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{ledger.data.invoices.data.map((inv: CustomerLedgerResponse['invoices']['data'][number]) => (
											<TableRow key={inv.id}>
												<TableCell>{inv.date}</TableCell>
												<TableCell>#{inv.id}</TableCell>
												<TableCell className="capitalize">{inv.status}</TableCell>
												<TableCell>৳{inv.total_amount.toLocaleString()}</TableCell>
												<TableCell className="text-emerald-600">
													৳{inv.paid.toLocaleString()}
												</TableCell>
												<TableCell className="text-destructive">
													৳{inv.due.toLocaleString()}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
