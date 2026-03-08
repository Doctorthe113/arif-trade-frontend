import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { apiFetch } from "#/lib/api";

type UserListItem = {
	id: number;
	name: string;
	email: string;
	role: string;
	is_active: number;
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
		queryFn: () => apiFetch<{ data: UserListItem[] }>("/users?per_page=100"),
	});

	const selectedUser = (users.data?.data ?? []).find(
		(u) => u.id === selectedUserId,
	);

	const {
		register,
		handleSubmit,
		reset,
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
						<div className="overflow-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left">
										<th className="pb-2 font-medium">ID</th>
										<th className="pb-2 font-medium">Name</th>
										<th className="pb-2 font-medium">Email</th>
										<th className="pb-2 font-medium">Role</th>
										<th className="pb-2 font-medium">Active</th>
										<th className="pb-2 font-medium" />
									</tr>
								</thead>
								<tbody>
									{(users.data?.data ?? []).map((u) => (
										<tr
											key={u.id}
											className={`border-b ${selectedUserId === u.id ? "bg-accent" : ""}`}
										>
											<td className="py-2">{u.id}</td>
											<td className="py-2">{u.name}</td>
											<td className="py-2">{u.email}</td>
											<td className="py-2 capitalize">{u.role}</td>
											<td className="py-2">{u.is_active ? "Yes" : "No"}</td>
											<td className="py-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setSelectedUserId(u.id);
														reset();
														mutation.reset();
													}}
												>
													Edit
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
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
								<select
									id="role"
									{...register("role")}
									className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								>
									<option value="salesman">Salesman</option>
									<option value="viewer">Viewer</option>
									<option value="editor">Editor</option>
									<option value="superadmin">Super Admin</option>
								</select>
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
