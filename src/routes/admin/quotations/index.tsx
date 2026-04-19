import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
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

type QuotationStatus = "pending" | "accepted" | "rejected" | "returned";

type QuotationRow = {
	id: number;
	salesman_id: number;
	salesman_name: string;
	customer_id: number | null;
	customer_name: string | null;
	status: QuotationStatus;
	note: string | null;
	requested_at: string;
	processed_at: string | null;
};

type PaginatedQuotations = {
	data: QuotationRow[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

export const Route = createFileRoute("/admin/quotations/")({
	component: AdminQuotationsPage,
});

function AdminQuotationsPage() {
	const queryClient = useQueryClient();
	const [pageNumber, setPageNumber] = useState(1);
	const [statusFilter, setStatusFilter] = useState("");
	const [noteDraftByQuoteId, setNoteDraftByQuoteId] = useState<Record<number, string>>({});

	const quotations = useQuery({
		queryKey: ["admin-quotations", pageNumber, statusFilter],
		queryFn: () =>
			apiFetch<PaginatedQuotations>(
				`/quotations?per_page=15&page=${pageNumber}${statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : ""}`,
			),
	});

	const statusMutation = useMutation({
		mutationFn: ({ quotationId, status, customerId }: { quotationId: number; status: "accepted" | "rejected" | "returned"; customerId?: number }) =>
			apiFetch(`/quotations/${quotationId}/status`, {
				method: "PUT",
				body: JSON.stringify({
					status,
					...(customerId ? { customer_id: customerId } : {}),
				}),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-quotations"] });
		},
	});

	const noteMutation = useMutation({
		mutationFn: ({ quotationId, note }: { quotationId: number; note: string }) =>
			apiFetch(`/quotations/${quotationId}`, {
				method: "PUT",
				body: JSON.stringify({ note }),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-quotations"] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (quotationId: number) => apiFetch(`/quotations/${quotationId}`, { method: "DELETE" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-quotations"] });
		},
	});

	const rows = quotations.data?.data ?? [];
	const pagination = quotations.data?.pagination;

	const badgeVariant = (status: QuotationStatus) => {
		if (status === "accepted") return "default" as const;
		if (status === "rejected") return "destructive" as const;
		if (status === "returned") return "outline" as const;
		return "secondary" as const;
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Quotations Management</h1>
				<p className="text-muted-foreground text-sm">
					Review quotation statuses, accept/reject/return requests, and maintain pending notes.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Quotations</CardTitle>
					<CardDescription>Filter by status and manage quotation lifecycle</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-3 md:grid-cols-4">
						<select
							className="rounded-md border bg-background px-3 py-2 text-sm"
							value={statusFilter}
							onChange={(e) => {
								setStatusFilter(e.target.value);
								setPageNumber(1);
							}}
						>
							<option value="">All statuses</option>
							<option value="pending">pending</option>
							<option value="accepted">accepted</option>
							<option value="rejected">rejected</option>
							<option value="returned">returned</option>
						</select>
						<Button
							variant="outline"
							onClick={() => {
								setStatusFilter("");
								setPageNumber(1);
							}}
						>
							Reset
						</Button>
					</div>

					{quotations.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading quotations...</p>
					) : quotations.isError ? (
						<p className="text-destructive text-sm">
							{quotations.error instanceof Error ? quotations.error.message : "Failed to load quotations"}
						</p>
					) : !rows.length ? (
						<p className="text-muted-foreground text-sm">No quotations found.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Requested At</TableHead>
									<TableHead>Salesman</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Note</TableHead>
									<TableHead>Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((row) => {
									const isPending = row.status === "pending";
									const noteValue = noteDraftByQuoteId[row.id] ?? row.note ?? "";
									return (
										<TableRow key={row.id}>
											<TableCell>{row.id}</TableCell>
											<TableCell>{row.requested_at}</TableCell>
											<TableCell>{row.salesman_name}</TableCell>
											<TableCell>{row.customer_name ?? "-"}</TableCell>
											<TableCell>
												<Badge variant={badgeVariant(row.status)}>{row.status}</Badge>
											</TableCell>
											<TableCell>
												{isPending ? (
													<div className="flex w-62.5 gap-2">
														<Input
															value={noteValue}
															onChange={(event) =>
																setNoteDraftByQuoteId((prev) => ({
																	...prev,
																	[row.id]: event.target.value,
																}))
															}
														/>
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																noteMutation.mutate({ quotationId: row.id, note: noteValue })
															}
															disabled={noteMutation.isPending}
														>
															Save
														</Button>
													</div>
												) : (
													<span>{row.note ?? "-"}</span>
												)}
											</TableCell>
											<TableCell className="space-y-2">
												{isPending ? (
													<>
														<div className="flex flex-wrap gap-2">
															<Button
																variant="outline"
																size="sm"
																onClick={() =>
																	statusMutation.mutate({
																		quotationId: row.id,
																		status: "accepted",
																		...(row.customer_id ? { customerId: row.customer_id } : {}),
																	})
																}
																disabled={statusMutation.isPending || !row.customer_id}
															>
																Accept
															</Button>
															<Button
																variant="outline"
																size="sm"
																onClick={() =>
																	statusMutation.mutate({ quotationId: row.id, status: "rejected" })
																}
																disabled={statusMutation.isPending}
															>
																Reject
															</Button>
															<Button
																variant="outline"
																size="sm"
																onClick={() => deleteMutation.mutate(row.id)}
																disabled={deleteMutation.isPending}
															>
																Delete
															</Button>
														</div>
														{!row.customer_id ? (
															<p className="text-muted-foreground text-xs">
																Accept disabled: quotation has no customer.
															</p>
														) : null}
													</>
												) : row.status === "accepted" ? (
													<Button
														variant="outline"
														size="sm"
														onClick={() => statusMutation.mutate({ quotationId: row.id, status: "returned" })}
														disabled={statusMutation.isPending}
													>
														Mark Returned
													</Button>
												) : (
													<span className="text-muted-foreground text-xs">No action</span>
												)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}

					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-xs">
							Page {pagination?.page ?? 1} of {pagination?.last_page ?? 1}
						</p>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={(pagination?.page ?? 1) <= 1}
								onClick={() => setPageNumber((currentPage) => Math.max(1, currentPage - 1))}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={(pagination?.page ?? 1) >= (pagination?.last_page ?? 1)}
								onClick={() => setPageNumber((currentPage) => currentPage + 1)}
							>
								Next
							</Button>
						</div>
					</div>
					{(statusMutation.isError || noteMutation.isError || deleteMutation.isError) ? (
						<p className="text-destructive text-sm">
							{statusMutation.error instanceof Error
								? statusMutation.error.message
								: noteMutation.error instanceof Error
									? noteMutation.error.message
									: deleteMutation.error instanceof Error
										? deleteMutation.error.message
										: "Action failed"}
						</p>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}
