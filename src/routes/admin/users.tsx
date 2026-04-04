import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod/v4";
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

type UserRole = "superadmin" | "editor" | "viewer" | "salesman";

type UserRow = {
	id: number;
	name: string;
	email: string;
	role: UserRole;
	is_active: boolean;
};

type PaginatedUsers = {
	data: UserRow[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

const createUserSchema = z.object({
	name: z.string().min(1, "Name required"),
	email: z.email("Invalid email"),
	password: z.string().min(8, "Min 8 characters"),
	role: z.enum(["superadmin", "editor", "viewer", "salesman"]),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

const updateUserSchema = z.object({
	name: z.string().min(1, "Name required"),
	email: z.email("Invalid email"),
	password: z.string().min(8, "Min 8 characters").optional().or(z.literal("")),
	role: z.enum(["superadmin", "editor", "viewer", "salesman"]),
	is_active: z.boolean(),
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;

export const Route = createFileRoute("/admin/users")({
	component: AdminUsersPage,
});

function AdminUsersPage() {
	const queryClient = useQueryClient();
	const [pageNumber, setPageNumber] = useState(1);
	const [roleFilter, setRoleFilter] = useState("");
	const [editingUserId, setEditingUserId] = useState<number | null>(null);

	const users = useQuery({
		queryKey: ["admin-users", pageNumber, roleFilter],
		queryFn: () =>
			apiFetch<PaginatedUsers>(
				`/users?per_page=15&page=${pageNumber}${roleFilter ? `&role=${encodeURIComponent(roleFilter)}` : ""}`,
			),
	});

	const createForm = useForm<CreateUserForm>({
		resolver: zodResolver(createUserSchema),
		defaultValues: { role: "salesman" },
	});

	const updateForm = useForm<UpdateUserForm>({
		resolver: zodResolver(updateUserSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			role: "salesman",
			is_active: true,
		},
	});

	const createUser = useMutation({
		mutationFn: (payload: CreateUserForm) =>
			apiFetch<{ id: number }>("/users", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		onSuccess: () => {
			createForm.reset({ role: "salesman", name: "", email: "", password: "" });
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
		},
	});

	const updateUser = useMutation({
		mutationFn: (payload: UpdateUserForm) => {
			if (!editingUserId) {
				throw new Error("No user selected");
			}
			const body: Record<string, unknown> = {
				name: payload.name,
				email: payload.email,
				role: payload.role,
				is_active: payload.is_active,
			};
			if (payload.password) {
				body.password = payload.password;
			}
			return apiFetch(`/users/${editingUserId}`, {
				method: "PUT",
				body: JSON.stringify(body),
			});
		},
		onSuccess: () => {
			setEditingUserId(null);
			updateForm.reset({
				name: "",
				email: "",
				password: "",
				role: "salesman",
				is_active: true,
			});
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
		},
	});

	const deleteUser = useMutation({
		mutationFn: (id: number) => apiFetch(`/users/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			if (editingUserId !== null) {
				setEditingUserId(null);
			}
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
		},
	});

	const selectedUser = (users.data?.data ?? []).find((u) => u.id === editingUserId);
	const pagination = users.data?.pagination;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Users Management</h1>
				<p className="text-muted-foreground text-sm">
					Create, update, filter, and delete users.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Create User</CardTitle>
					<CardDescription>Add a new user account</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={createForm.handleSubmit((payload) => createUser.mutate(payload))}
						className="grid gap-3 md:grid-cols-4"
					>
						<Input placeholder="Name" {...createForm.register("name")} />
						<Input placeholder="Email" type="email" {...createForm.register("email")} />
						<Input placeholder="Password" type="password" {...createForm.register("password")} />
						<Controller
							control={createForm.control}
							name="role"
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger>
										<SelectValue placeholder="Role" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="salesman">Salesman</SelectItem>
										<SelectItem value="viewer">Viewer</SelectItem>
										<SelectItem value="editor">Editor</SelectItem>
										<SelectItem value="superadmin">Super Admin</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
						<Button type="submit" disabled={createUser.isPending}>
							{createUser.isPending ? "Creating..." : "Create"}
						</Button>
						{createUser.isError ? (
							<p className="text-destructive text-sm md:col-span-4">
								{createUser.error instanceof Error ? createUser.error.message : "Failed"}
							</p>
						) : null}
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Users List</CardTitle>
					<CardDescription>Filter users by role and manage accounts</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-3 md:grid-cols-3">
						<select
							className="rounded-md border bg-background px-3 py-2 text-sm"
							value={roleFilter}
							onChange={(e) => {
								setRoleFilter(e.target.value);
								setPageNumber(1);
							}}
						>
							<option value="">All roles</option>
							<option value="salesman">salesman</option>
							<option value="viewer">viewer</option>
							<option value="editor">editor</option>
							<option value="superadmin">superadmin</option>
						</select>
					</div>

					{users.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading users...</p>
					) : users.isError ? (
						<p className="text-destructive text-sm">
							{users.error instanceof Error ? users.error.message : "Failed to load users"}
						</p>
					) : !(users.data?.data ?? []).length ? (
						<p className="text-muted-foreground text-sm">No users found.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Active</TableHead>
									<TableHead>Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(users.data?.data ?? []).map((user) => (
									<TableRow key={user.id}>
										<TableCell>{user.id}</TableCell>
										<TableCell className="font-medium">{user.name}</TableCell>
										<TableCell>{user.email}</TableCell>
										<TableCell>{user.role}</TableCell>
										<TableCell>{user.is_active ? "yes" : "no"}</TableCell>
										<TableCell className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setEditingUserId(user.id);
													updateForm.reset({
														name: user.name,
														email: user.email,
														password: "",
														role: user.role,
														is_active: user.is_active,
													});
													updateUser.reset();
												}}
											>
												Edit
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => deleteUser.mutate(user.id)}
												disabled={deleteUser.isPending}
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

			{editingUserId !== null && selectedUser ? (
				<Card>
					<CardHeader>
						<CardTitle>Edit User</CardTitle>
						<CardDescription>Update selected user account</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={updateForm.handleSubmit((payload) => updateUser.mutate(payload))}
							className="grid gap-3 md:grid-cols-3"
						>
							<Input placeholder="Name" {...updateForm.register("name")} />
							<Input placeholder="Email" type="email" {...updateForm.register("email")} />
							<Input
								placeholder="New password (optional)"
								type="password"
								{...updateForm.register("password")}
							/>
							<Controller
								control={updateForm.control}
								name="role"
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue placeholder="Role" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="salesman">Salesman</SelectItem>
											<SelectItem value="viewer">Viewer</SelectItem>
											<SelectItem value="editor">Editor</SelectItem>
											<SelectItem value="superadmin">Super Admin</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
							<div className="flex items-center gap-2 rounded-md border px-3 py-2">
								<input
									type="checkbox"
									id="edit-active"
									checked={updateForm.watch("is_active")}
									onChange={(e) => updateForm.setValue("is_active", e.target.checked)}
								/>
								<label htmlFor="edit-active" className="text-sm">
									Active user
								</label>
							</div>
							<div className="flex gap-2 md:col-span-3">
								<Button type="submit" disabled={updateUser.isPending}>
									{updateUser.isPending ? "Saving..." : "Save"}
								</Button>
								<Button
									variant="outline"
									type="button"
									onClick={() => {
										setEditingUserId(null);
										updateForm.reset({
											name: "",
											email: "",
											password: "",
											role: "salesman",
											is_active: true,
										});
									}}
								>
									Cancel
								</Button>
							</div>
							{updateUser.isError ? (
								<p className="text-destructive text-sm md:col-span-3">
									{updateUser.error instanceof Error ? updateUser.error.message : "Failed"}
								</p>
							) : null}
						</form>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}
