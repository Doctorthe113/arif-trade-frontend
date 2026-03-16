import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { DataTable } from "#/components/ui/data-table";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { apiFetch } from "#/lib/api";

type UserListItem = {
	id: number;
	name: string;
	email: string;
	role: string;
	is_active: number;
};

type ApiResponse<T> = {
	success: boolean;
	message: string;
	data: T;
};

type PaginatedResponse<T> = {
	data: T[];
	total: number;
	current_page: number;
	per_page: number;
};

const updateUserSchema = z.object({
	name: z.string().min(1, "Name required").optional(),
	email: z.email("Invalid email").optional(),
	password: z.string().min(8, "Min 8 characters").optional().or(z.literal("")),
	role: z.enum(["superadmin", "editor", "viewer", "salesman"]).optional(),
	is_active: z.number().min(0).max(1).optional(),
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;

export const Route = createFileRoute("/admin/update-user")({
	component: UpdateUserPage,
});

/// Update user form
function UpdateUserPage() {
	const queryClient = useQueryClient();
	const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

	const users = useQuery({
		queryKey: ["users"],
		queryFn: () =>
			apiFetch<ApiResponse<PaginatedResponse<UserListItem>>>(
				"/users?per_page=100",
			),
	});

	const selectedUser = (users.data?.data?.data ?? []).find(
		(u) => u.id === selectedUserId,
	);

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<UpdateUserForm>({
		resolver: zodResolver(updateUserSchema),
		values: selectedUser
			? {
					name: selectedUser.name,
					email: selectedUser.email,
					role: selectedUser.role as UpdateUserForm["role"],
					password: "",
					is_active: selectedUser.is_active,
				}
			: undefined,
	});

	const columns: ColumnDef<UserListItem>[] = [
		{ accessorKey: "id", header: "ID" },
		{ accessorKey: "name", header: "Name" },
		{ accessorKey: "email", header: "Email" },
		{
			accessorKey: "role",
			header: "Role",
			cell: ({ row }) => <span className="capitalize">{row.original.role}</span>,
		},
		{
			accessorKey: "is_active",
			header: "Active",
			cell: ({ row }) => (row.original.is_active ? "Yes" : "No"),
		},
		{
			id: "actions",
			cell: ({ row }) => (
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						setSelectedUserId(row.original.id);
						reset();
						mutation.reset();
					}}
				>
					Edit
				</Button>
			),
		},
	];

	const mutation = useMutation({
		mutationFn: (data: UpdateUserForm) => {
			const body = { ...data };
			if (!body.password) delete body.password;
			return apiFetch(`/users/${selectedUserId}`, {
				method: "PUT",
				body: JSON.stringify(body),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
	});

	function onSubmit(data: UpdateUserForm) {
		mutation.mutate(data);
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Update User</h1>

			<Card>
				<CardHeader>
					<CardTitle>Select User</CardTitle>
				</CardHeader>
				<CardContent>
					{users.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading...</p>
					) : (
						<DataTable columns={columns} data={users.data?.data?.data ?? []} />
					)}
				</CardContent>
			</Card>

			{selectedUser && (
				<Card className="max-w-lg">
					<CardHeader>
						<CardTitle>Edit: {selectedUser.name}</CardTitle>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={handleSubmit(onSubmit)}
							className="flex flex-col gap-4"
						>
							<div className="flex flex-col gap-2">
								<label htmlFor="name" className="text-sm font-medium">
									Name
								</label>
								<Input id="name" {...register("name")} />
								{errors.name && (
									<p className="text-destructive text-xs">
										{errors.name.message}
									</p>
								)}
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="email" className="text-sm font-medium">
									Email
								</label>
								<Input id="email" type="email" {...register("email")} />
								{errors.email && (
									<p className="text-destructive text-xs">
										{errors.email.message}
									</p>
								)}
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="password" className="text-sm font-medium">
									New Password (leave empty to keep)
								</label>
								<Input
									id="password"
									type="password"
									{...register("password")}
								/>
								{errors.password && (
									<p className="text-destructive text-xs">
										{errors.password.message}
									</p>
								)}
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="role" className="text-sm font-medium">
									Role
								</label>
								<Controller
									control={control}
									name="role"
									render={({ field }) => (
										<Select
											value={field.value}
											onValueChange={field.onChange}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select role" />
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
								{errors.role && (
									<p className="text-destructive text-xs">
										{errors.role.message}
									</p>
								)}
							</div>
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									id="is_active"
									{...register("is_active")}
									className="rounded"
								/>
								<label htmlFor="is_active" className="text-sm font-medium">
									Active
								</label>
							</div>
							<Button type="submit" disabled={mutation.isPending}>
								{mutation.isPending ? "Updating..." : "Update User"}
							</Button>
							{mutation.isSuccess && (
								<p className="text-sm text-green-600">User updated</p>
							)}
							{mutation.isError && (
								<p className="text-destructive text-sm">
									{mutation.error instanceof Error
										? mutation.error.message
										: "Failed"}
								</p>
							)}
						</form>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
