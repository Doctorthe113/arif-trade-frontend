import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

type CustomerType = "general" | "doctor" | "pharmacy" | "hospital";

type CustomerRow = {
	id: number;
	name: string;
	type: string;
	phone: string | null;
	email: string | null;
	address: string | null;
};

type PaginatedCustomers = {
	data: CustomerRow[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

export const Route = createFileRoute("/admin/customers/")({
	component: AdminCustomersPage,
});

function AdminCustomersPage() {
	const queryClient = useQueryClient();
	const [pageNumber, setPageNumber] = useState(1);
	const [searchValue, setSearchValue] = useState("");
	const [filterType, setFilterType] = useState("");

	const [nameValue, setNameValue] = useState("");
	const [typeValue, setTypeValue] = useState<CustomerType>("general");
	const [phoneValue, setPhoneValue] = useState("");
	const [emailValue, setEmailValue] = useState("");
	const [addressValue, setAddressValue] = useState("");

	const [editId, setEditId] = useState<number | null>(null);
	const [editName, setEditName] = useState("");
	const [editType, setEditType] = useState<CustomerType>("general");
	const [editPhone, setEditPhone] = useState("");
	const [editEmail, setEditEmail] = useState("");
	const [editAddress, setEditAddress] = useState("");

	const customers = useQuery({
		queryKey: ["admin-customers", pageNumber, searchValue, filterType],
		queryFn: () =>
			apiFetch<PaginatedCustomers>(
				`/customers?per_page=15&page=${pageNumber}&search=${encodeURIComponent(searchValue)}${filterType ? `&type=${encodeURIComponent(filterType)}` : ""}`,
			),
	});

	const createCustomer = useMutation({
		mutationFn: () => {
			if (!nameValue.trim()) {
				throw new Error("Customer name is required");
			}
			return apiFetch("/customers", {
				method: "POST",
				body: JSON.stringify({
					name: nameValue.trim(),
					type: typeValue,
					...(phoneValue.trim() ? { phone: phoneValue.trim() } : {}),
					...(emailValue.trim() ? { email: emailValue.trim() } : {}),
					...(addressValue.trim() ? { address: addressValue.trim() } : {}),
				}),
			});
		},
		onSuccess: () => {
			setNameValue("");
			setTypeValue("general");
			setPhoneValue("");
			setEmailValue("");
			setAddressValue("");
			queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
		},
	});

	const updateCustomer = useMutation({
		mutationFn: () => {
			if (!editId) {
				throw new Error("No customer selected");
			}
			if (!editName.trim()) {
				throw new Error("Customer name is required");
			}
			return apiFetch(`/customers/${editId}`, {
				method: "PUT",
				body: JSON.stringify({
					name: editName.trim(),
					type: editType,
					phone: editPhone.trim() || null,
					email: editEmail.trim() || null,
					address: editAddress.trim() || null,
				}),
			});
		},
		onSuccess: () => {
			setEditId(null);
			setEditName("");
			setEditType("general");
			setEditPhone("");
			setEditEmail("");
			setEditAddress("");
			queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
		},
	});

	const deleteCustomer = useMutation({
		mutationFn: (id: number) => apiFetch(`/customers/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			if (editId !== null) {
				setEditId(null);
			}
			queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
		},
	});

	const rows = customers.data?.data ?? [];
	const pagination = customers.data?.pagination;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Customers Management</h1>
				<p className="text-muted-foreground text-sm">
					Create, filter, update, and remove customers.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Create Customer</CardTitle>
					<CardDescription>Add a new customer profile</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 md:grid-cols-3">
					<Input
						placeholder="Customer name"
						value={nameValue}
						onChange={(e) => setNameValue(e.target.value)}
					/>
					<select
						className="rounded-md border bg-background px-3 py-2 text-sm"
						value={typeValue}
						onChange={(e) => setTypeValue(e.target.value as CustomerType)}
					>
						<option value="general">general</option>
						<option value="doctor">doctor</option>
						<option value="pharmacy">pharmacy</option>
						<option value="hospital">hospital</option>
					</select>
					<Input
						placeholder="Phone (optional)"
						value={phoneValue}
						onChange={(e) => setPhoneValue(e.target.value)}
					/>
					<Input
						placeholder="Email (optional)"
						value={emailValue}
						onChange={(e) => setEmailValue(e.target.value)}
					/>
					<Input
						placeholder="Address (optional)"
						value={addressValue}
						onChange={(e) => setAddressValue(e.target.value)}
					/>
					<Button onClick={() => createCustomer.mutate()} disabled={createCustomer.isPending}>
						{createCustomer.isPending ? "Creating..." : "Create"}
					</Button>
					{createCustomer.isError ? (
						<p className="text-destructive text-sm md:col-span-3">
							{createCustomer.error instanceof Error ? createCustomer.error.message : "Failed"}
						</p>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Customers List</CardTitle>
					<CardDescription>Filter and maintain customers</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-3 md:grid-cols-3">
						<Input
							placeholder="Search by name, phone, or email"
							value={searchValue}
							onChange={(e) => {
								setSearchValue(e.target.value);
								setPageNumber(1);
							}}
						/>
						<select
							className="rounded-md border bg-background px-3 py-2 text-sm"
							value={filterType}
							onChange={(e) => {
								setFilterType(e.target.value);
								setPageNumber(1);
							}}
						>
							<option value="">All customer types</option>
							<option value="general">general</option>
							<option value="doctor">doctor</option>
							<option value="pharmacy">pharmacy</option>
							<option value="hospital">hospital</option>
						</select>
					</div>

					{customers.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading customers...</p>
					) : customers.isError ? (
						<p className="text-destructive text-sm">
							{customers.error instanceof Error ? customers.error.message : "Failed to load customers"}
						</p>
					) : !rows.length ? (
						<p className="text-muted-foreground text-sm">No customers found.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Phone</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((customer) => (
									<TableRow key={customer.id}>
										<TableCell className="font-medium">{customer.name}</TableCell>
										<TableCell>{customer.type}</TableCell>
										<TableCell>{customer.phone || "-"}</TableCell>
										<TableCell>{customer.email || "-"}</TableCell>
										<TableCell className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setEditId(customer.id);
													setEditName(customer.name);
													setEditType((customer.type as CustomerType) || "general");
													setEditPhone(customer.phone || "");
													setEditEmail(customer.email || "");
													setEditAddress(customer.address || "");
												}}
											>
												Edit
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => deleteCustomer.mutate(customer.id)}
												disabled={deleteCustomer.isPending}
											>
												Delete
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}

					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-xs">
							Page {pagination?.page ?? 1} of {pagination?.last_page ?? 1}
						</p>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={(pagination?.page ?? 1) <= 1}
								onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={(pagination?.page ?? 1) >= (pagination?.last_page ?? 1)}
								onClick={() => setPageNumber((p) => p + 1)}
							>
								Next
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{editId !== null ? (
				<Card>
					<CardHeader>
						<CardTitle>Edit Customer</CardTitle>
						<CardDescription>Update selected customer</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-3 md:grid-cols-3">
						<Input
							placeholder="Customer name"
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
						/>
						<select
							className="rounded-md border bg-background px-3 py-2 text-sm"
							value={editType}
							onChange={(e) => setEditType(e.target.value as CustomerType)}
						>
							<option value="general">general</option>
							<option value="doctor">doctor</option>
							<option value="pharmacy">pharmacy</option>
							<option value="hospital">hospital</option>
						</select>
						<Input
							placeholder="Phone"
							value={editPhone}
							onChange={(e) => setEditPhone(e.target.value)}
						/>
						<Input
							placeholder="Email"
							value={editEmail}
							onChange={(e) => setEditEmail(e.target.value)}
						/>
						<Input
							placeholder="Address"
							value={editAddress}
							onChange={(e) => setEditAddress(e.target.value)}
						/>
						<div className="flex gap-2">
							<Button onClick={() => updateCustomer.mutate()} disabled={updateCustomer.isPending}>
								{updateCustomer.isPending ? "Saving..." : "Save"}
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									setEditId(null);
									setEditName("");
									setEditType("general");
									setEditPhone("");
									setEditEmail("");
									setEditAddress("");
								}}
							>
								Cancel
							</Button>
						</div>
						{updateCustomer.isError ? (
							<p className="text-destructive text-sm md:col-span-3">
								{updateCustomer.error instanceof Error ? updateCustomer.error.message : "Failed"}
							</p>
						) : null}
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}
