import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod/v4";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
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

type Quotation = {
	id: number;
	salesman_id: number;
	salesman_name: string;
	customer_id: number | null;
	customer_name: string | null;
	status: string;
	note: string | null;
	requested_at: string;
};

type PaginatedQuotations = {
	data: Quotation[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

type CustomerSummary = {
	id: number;
	name: string;
	type: string;
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

async function fetchCustomersByType(type: string): Promise<CustomerSummary[]> {
	const perPage = 200;
	let pageNumber = 1;
	let lastPageNumber = 1;
	const rows: CustomerSummary[] = [];

	do {
		const response = await apiFetch<PaginatedCustomers>(
			`/customers?type=${type}&per_page=${perPage}&page=${pageNumber}`,
		);
		rows.push(...(response.data ?? []));
		lastPageNumber = response.pagination?.last_page ?? pageNumber;
		pageNumber += 1;
	} while (pageNumber <= lastPageNumber);

	return rows;
}

type ProductSummary = {
	id: number;
	name: string;
	product_code: string;
};

type PaginatedProducts = {
	data: ProductSummary[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

type ProductVariantUnit = {
	id: number;
	unit_name: string;
	stock_quantity: number;
	unit_price: number;
};

type ProductVariant = {
	id: number;
	attributes: Record<string, unknown>;
	sku: string;
	units: ProductVariantUnit[];
};

type ProductDetail = {
	id: number;
	name: string;
	product_code: string;
	variants: ProductVariant[];
};

type SelectOption = {
	value: string;
	label: string;
};

const createQuotationSchema = z.object({
	customerId: z.string().optional(),
	note: z.string().max(300).optional(),
	items: z
		.array(
			z.object({
				productId: z.string().min(1, "Product required"),
				variantUnitId: z.string().min(1, "Variant-unit required"),
				quantity: z.coerce.number().int().positive("Quantity must be positive"),
			}),
		)
		.min(1),
});

type CreateQuotationForm = z.infer<typeof createQuotationSchema>;
type CreateQuotationFormInput = z.input<typeof createQuotationSchema>;

const acceptQuotationSchema = z.object({
	customerId: z.string().min(1, "Doctor required"),
});

type AcceptQuotationForm = z.infer<typeof acceptQuotationSchema>;

export const Route = createFileRoute("/salesman/quote")({
	component: QuotePage,
});

/// Quotation creation + list
function QuotePage() {
	const { hasRole, user } = useAuth();
	const roleName = user?.role as string | undefined;
	const isAdminUser =
		isAuthDisabled || hasRole("superadmin", "editor") || roleName === "admin";

	const queryClient = useQueryClient();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
	const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(
		null,
	);
	const [pageNumber, setPageNumber] = useState(1);
	const [dateSortDirection, setDateSortDirection] = useState<"asc" | "desc">(
		"desc",
	);

	const createForm = useForm<
		CreateQuotationFormInput,
		unknown,
		CreateQuotationForm
	>({
		resolver: zodResolver(createQuotationSchema),
		defaultValues: {
			customerId: "",
			note: "",
			items: [{ productId: "", variantUnitId: "", quantity: 1 }],
		},
	});
	const itemFieldArray = useFieldArray({
		control: createForm.control,
		name: "items",
	});
	const watchedItems = useWatch({
		control: createForm.control,
		name: "items",
	});

	const acceptForm = useForm<AcceptQuotationForm>({
		resolver: zodResolver(acceptQuotationSchema),
		defaultValues: { customerId: "" },
	});

	const {
		data,
		isLoading,
		isError,
		error: quotationsError,
	} = useQuery({
		queryKey: ["quotations", pageNumber],
		queryFn: () =>
			apiFetch<PaginatedQuotations>(
				`/quotations?per_page=20&page=${pageNumber}`,
			),
	});

	const careCustomersQuery = useQuery({
		queryKey: ["customers-for-quote"],
		queryFn: async () => {
			const [doctors, hospitals] = await Promise.all([
				fetchCustomersByType("doctor"),
				fetchCustomersByType("hospital"),
			]);
			return [...doctors, ...hospitals].sort((leftCustomer, rightCustomer) =>
				leftCustomer.name.localeCompare(rightCustomer.name),
			);
		},
	});

	const productsQuery = useQuery({
		queryKey: ["products-for-quote"],
		queryFn: () => apiFetch<PaginatedProducts>("/products?per_page=200"),
	});

	const productDetailsQuery = useQuery({
		queryKey: ["products-details-for-quote", productsQuery.data?.data?.length],
		queryFn: async () => {
			const products = productsQuery.data?.data ?? [];
			const details = await Promise.all(
				products.map((product) =>
					apiFetch<ProductDetail>(`/products/${product.id}`).catch(() => null),
				),
			);
			return details.filter(Boolean) as ProductDetail[];
		},
		enabled: (productsQuery.data?.data?.length ?? 0) > 0,
	});

	const productOptions = useMemo<SelectOption[]>(() => {
		return (productsQuery.data?.data ?? []).map((product) => ({
			value: String(product.id),
			label: `${product.name} (${product.product_code})`,
		}));
	}, [productsQuery.data?.data]);

	const doctorOptions = useMemo<SelectOption[]>(() => {
		return (careCustomersQuery.data ?? []).map((customer) => ({
			value: String(customer.id),
			label: `${customer.name} (${customer.type})`,
		}));
	}, [careCustomersQuery.data]);

	const variantUnitOptionsByProductId = useMemo(() => {
		const map: Record<string, SelectOption[]> = {};

		for (const product of productDetailsQuery.data ?? []) {
			const options: SelectOption[] = [];
			for (const variant of product.variants ?? []) {
				for (const unit of variant.units ?? []) {
					const attributeLabel = Object.entries(variant.attributes ?? {})
						.map(([key, value]) => `${key}: ${String(value)}`)
						.join(", ");
					options.push({
						value: String(unit.id),
						label: `${attributeLabel || variant.sku || "Variant"} | ${unit.unit_name} | Stock: ${unit.stock_quantity}`,
					});
				}
			}
			map[String(product.id)] = options;
		}

		return map;
	}, [productDetailsQuery.data]);

	const createMutation = useMutation({
		mutationFn: (body: {
			items: { variant_unit_id: number; quantity: number }[];
			customer_id?: number;
			note?: string;
		}) =>
			apiFetch<{ id: number }>("/quotations", {
				method: "POST",
				body: JSON.stringify(body),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["quotations"] });
			setIsCreateDialogOpen(false);
			createForm.reset({
				customerId: "",
				note: "",
				items: [{ productId: "", variantUnitId: "", quantity: 1 }],
			});
		},
	});

	const statusMutation = useMutation({
		mutationFn: (payload: {
			quotationId: number;
			status: "accepted" | "rejected" | "returned";
			customerId?: number;
		}) =>
			apiFetch(`/quotations/${payload.quotationId}/status`, {
				method: "PUT",
				body: JSON.stringify({
					status: payload.status,
					...(payload.customerId ? { customer_id: payload.customerId } : {}),
				}),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["quotations"] });
			setIsAcceptDialogOpen(false);
			setSelectedQuotationId(null);
			acceptForm.reset({ customerId: "" });
		},
	});

	function handleCreateSubmit(values: CreateQuotationForm) {
		const parsedItems = values.items.map((item) => ({
			variant_unit_id: Number.parseInt(item.variantUnitId, 10),
			quantity: item.quantity,
		}));

		createMutation.mutate({
			items: parsedItems,
			...(values.customerId
				? { customer_id: Number.parseInt(values.customerId, 10) }
				: {}),
			...(values.note ? { note: values.note } : {}),
		});
	}

	function openAcceptDialog(quotation: Quotation) {
		setSelectedQuotationId(quotation.id);
		acceptForm.reset({
			customerId: quotation.customer_id ? String(quotation.customer_id) : "",
		});
		setIsAcceptDialogOpen(true);
	}

	function handleAcceptSubmit(values: AcceptQuotationForm) {
		if (!selectedQuotationId) return;
		statusMutation.mutate({
			quotationId: selectedQuotationId,
			status: "accepted",
			customerId: Number.parseInt(values.customerId, 10),
		});
	}

	function handleReject(quotationId: number) {
		statusMutation.mutate({ quotationId, status: "rejected" });
	}

	function handleReturn(quotationId: number) {
		statusMutation.mutate({ quotationId, status: "returned" });
	}

	const statusVariant = (s: string) => {
		if (s === "accepted") return "default" as const;
		if (s === "rejected") return "destructive" as const;
		if (s === "pending") return "secondary" as const;
		return "outline" as const;
	};

	const quotations = useMemo(() => {
		const rows = [...(data?.data ?? [])];
		rows.sort((leftQuotation, rightQuotation) => {
			const leftTimeMs = new Date(leftQuotation.requested_at).getTime();
			const rightTimeMs = new Date(rightQuotation.requested_at).getTime();
			return dateSortDirection === "asc"
				? leftTimeMs - rightTimeMs
				: rightTimeMs - leftTimeMs;
		});
		return rows;
	}, [data?.data, dateSortDirection]);

	const pagination = data?.pagination;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Quotations</h1>
				<Button onClick={() => setIsCreateDialogOpen(true)}>
					New Quotation
				</Button>
			</div>

			<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
				<DialogContent className="max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Create Quotation</DialogTitle>
						<DialogDescription>
							Select doctor, product variant-unit, and quantity for each item.
						</DialogDescription>
					</DialogHeader>
					<form
						onSubmit={createForm.handleSubmit(handleCreateSubmit)}
						className="flex flex-col gap-4"
					>
						<div className="flex flex-col gap-2">
							<label htmlFor="quotation-doctor" className="text-sm font-medium">
								Doctor / Hospital
							</label>
							<Controller
								control={createForm.control}
								name="customerId"
								render={({ field }) => (
									<Select
										value={field.value ?? ""}
										onValueChange={field.onChange}
									>
										<SelectTrigger id="quotation-doctor" className="w-full">
											<SelectValue placeholder="Select doctor or hospital (optional)" />
										</SelectTrigger>
										<SelectContent>
											{doctorOptions.map((doctor) => (
												<SelectItem key={doctor.value} value={doctor.value}>
													{doctor.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
						</div>

						{itemFieldArray.fields.map((field, itemIndex) => {
							const productId = watchedItems?.[itemIndex]?.productId ?? "";
							const variantUnitOptions =
								variantUnitOptionsByProductId[productId] ?? [];

							return (
								<div key={field.id} className="rounded-md border p-3">
									<div className="grid gap-3 md:grid-cols-3">
										<div className="flex flex-col gap-2">
											<label
												htmlFor={`quotation-item-product-${field.id}`}
												className="text-sm font-medium"
											>
												Product
											</label>
											<Controller
												control={createForm.control}
												name={`items.${itemIndex}.productId`}
												render={({ field: productField }) => (
													<Select
														value={productField.value}
														onValueChange={(value) => {
															productField.onChange(value);
															createForm.setValue(
																`items.${itemIndex}.variantUnitId`,
																"",
															);
														}}
													>
														<SelectTrigger
															id={`quotation-item-product-${field.id}`}
															className="w-full"
														>
															<SelectValue placeholder="Select product" />
														</SelectTrigger>
														<SelectContent>
															{productOptions.map((product) => (
																<SelectItem
																	key={product.value}
																	value={product.value}
																>
																	{product.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												)}
											/>
										</div>

										<div className="flex flex-col gap-2">
											<label
												htmlFor={`quotation-item-unit-${field.id}`}
												className="text-sm font-medium"
											>
												Variant / Unit
											</label>
											<Controller
												control={createForm.control}
												name={`items.${itemIndex}.variantUnitId`}
												render={({ field: unitField }) => (
													<Select
														value={unitField.value}
														onValueChange={unitField.onChange}
													>
														<SelectTrigger
															id={`quotation-item-unit-${field.id}`}
															className="w-full"
														>
															<SelectValue placeholder="Select variant unit" />
														</SelectTrigger>
														<SelectContent>
															{variantUnitOptions.map((option) => (
																<SelectItem
																	key={option.value}
																	value={option.value}
																>
																	{option.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												)}
											/>
										</div>

										<div className="flex flex-col gap-2">
											<label
												htmlFor={`quotation-item-qty-${field.id}`}
												className="text-sm font-medium"
											>
												Quantity
											</label>
											<Input
												id={`quotation-item-qty-${field.id}`}
												type="number"
												min={1}
												{...createForm.register(`items.${itemIndex}.quantity`)}
											/>
										</div>
									</div>
									<div className="mt-3 flex justify-end">
										{itemFieldArray.fields.length > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => itemFieldArray.remove(itemIndex)}
											>
												Remove Item
											</Button>
										)}
									</div>
								</div>
							);
						})}

						<Button
							type="button"
							variant="outline"
							onClick={() =>
								itemFieldArray.append({
									productId: "",
									variantUnitId: "",
									quantity: 1,
								})
							}
						>
							Add Item
						</Button>

						<div className="flex flex-col gap-2">
							<label htmlFor="quotation-note" className="text-sm font-medium">
								Note
							</label>
							<Input
								id="quotation-note"
								placeholder="Optional note"
								{...createForm.register("note")}
							/>
						</div>

						{createForm.formState.errors.items && (
							<p className="text-destructive text-sm">
								Invalid quotation items.
							</p>
						)}

						<Button type="submit" disabled={createMutation.isPending}>
							{createMutation.isPending ? "Creating..." : "Submit Quotation"}
						</Button>
						{createMutation.isError && (
							<p className="text-destructive text-sm">
								{createMutation.error instanceof Error
									? createMutation.error.message
									: "Failed"}
							</p>
						)}
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
				<DialogContent className="max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Accept Quotation</DialogTitle>
						<DialogDescription>
							Select doctor or hospital before accepting this quotation.
						</DialogDescription>
					</DialogHeader>
					<form
						onSubmit={acceptForm.handleSubmit(handleAcceptSubmit)}
						className="flex flex-col gap-4"
					>
						<div className="flex flex-col gap-2">
							<label
								htmlFor="accept-quotation-doctor"
								className="text-sm font-medium"
							>
								Doctor / Hospital
							</label>
							<Controller
								control={acceptForm.control}
								name="customerId"
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger
											id="accept-quotation-doctor"
											className="w-full"
										>
											<SelectValue placeholder="Select doctor or hospital" />
										</SelectTrigger>
										<SelectContent>
											{doctorOptions.map((doctor) => (
												<SelectItem key={doctor.value} value={doctor.value}>
													{doctor.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
							{acceptForm.formState.errors.customerId && (
								<p className="text-destructive text-sm">
									{acceptForm.formState.errors.customerId.message}
								</p>
							)}
						</div>

						<Button type="submit" disabled={statusMutation.isPending}>
							{statusMutation.isPending ? "Updating..." : "Accept Quotation"}
						</Button>
					</form>
				</DialogContent>
			</Dialog>

			<Card>
				<CardHeader>
					<CardTitle>All Quotations</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<p className="text-muted-foreground text-sm">Loading...</p>
					) : isError ? (
						<p className="text-destructive text-sm">
							{quotationsError instanceof Error
								? quotationsError.message
								: "Failed to load quotations"}
						</p>
					) : !quotations.length ? (
						<p className="text-muted-foreground text-sm">
							No quotations found.
						</p>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>ID</TableHead>
										<TableHead>Salesman</TableHead>
										<TableHead>Customer</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Note</TableHead>
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
										{isAdminUser && <TableHead>Actions</TableHead>}
									</TableRow>
								</TableHeader>
								<TableBody>
									{quotations.map((q) => (
										<TableRow key={q.id}>
											<TableCell>{q.id}</TableCell>
											<TableCell>{q.salesman_name}</TableCell>
											<TableCell>{q.customer_name ?? "—"}</TableCell>
											<TableCell>
												<Badge variant={statusVariant(q.status)}>
													{q.status}
												</Badge>
											</TableCell>
											<TableCell>{q.note ?? "—"}</TableCell>
											<TableCell>
												{new Date(q.requested_at).toLocaleDateString()}
											</TableCell>
											{isAdminUser && (
												<TableCell>
													<div className="flex items-center gap-2">
														{q.status === "pending" && (
															<>
																<Button
																	size="sm"
																	onClick={() => openAcceptDialog(q)}
																	disabled={statusMutation.isPending}
																>
																	Accept
																</Button>
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() => handleReject(q.id)}
																	disabled={statusMutation.isPending}
																>
																	Reject
																</Button>
															</>
														)}
														{q.status === "accepted" && (
															<Button
																size="sm"
																variant="outline"
																onClick={() => handleReturn(q.id)}
																disabled={statusMutation.isPending}
															>
																Return
															</Button>
														)}
														{q.status !== "accepted" && (
															<Button size="sm" variant="outline" disabled>
																Return
															</Button>
														)}
													</div>
												</TableCell>
											)}
										</TableRow>
									))}
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
							{statusMutation.isError && (
								<p className="mt-3 text-destructive text-sm">
									{statusMutation.error instanceof Error
										? statusMutation.error.message
										: "Failed to update quotation status"}
								</p>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
