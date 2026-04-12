import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod/v4";
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

type UserListItem = {
	id: number;
	name: string;
	email: string;
	role: string;
	is_active: boolean;
};

type PaginatedResponse<T> = {
	data: T[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		last_page: number;
	};
};

const updateUserSchema = z.object({
	name: z.string().min(1, "Name required").optional(),
	email: z.email("Invalid email").optional(),
	password: z.string().min(8, "Min 8 characters").optional().or(z.literal("")),
	role: z.enum(["superadmin", "editor", "viewer", "salesman"]).optional(),
	is_active: z.boolean().optional(),
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;

export const Route = createFileRoute("/admin/update-user/")({
	component: UpdateUserPage,
});

/// Update user form
function UpdateUserPage() {
	const queryClient = useQueryClient();
	const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [pageNumber, setPageNumber] = useState(1);

	const users = useQuery({
		queryKey: ["users", pageNumber],
		queryFn: () =>
			apiFetch<PaginatedResponse<UserListItem>>(
				`/users?per_page=20&page=${pageNumber}`,
			),
	});

	const selectedUser = (users.data?.data ?? []).find(
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

	const mutation = useMutation({
		mutationFn: (data: UpdateUserForm) => {
			if (!selectedUserId) throw new Error("No user selected");
			const body = { ...data };
			if (!body.password) delete body.password;
			return apiFetch(`/users/${selectedUserId}`, {
				method: "PUT",
				body: JSON.stringify(body),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["users"] });
			setIsDialogOpen(false);
			setSelectedUserId(null);
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
					) : users.isError ? (
						<p className="text-destructive text-sm">
							{users.error instanceof Error
								? users.error.message
								: "Failed to load users"}
						</p>
					) : (
						<>
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
											<TableCell>{user.name}</TableCell>
											<TableCell>{user.email}</TableCell>
											<TableCell className="capitalize">{user.role}</TableCell>
											<TableCell>{user.is_active ? "Yes" : "No"}</TableCell>
											<TableCell>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setSelectedUserId(user.id);
														reset({
															name: user.name,
															email: user.email,
															password: "",
															role: user.role as UpdateUserForm["role"],
															is_active: user.is_active,
														});
														mutation.reset();
														setIsDialogOpen(true);
													}}
												>
													Edit
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							<div className="mt-4 flex items-center justify-between">
								<p className="text-muted-foreground text-sm">
									Page {users.data?.pagination.page ?? 1} of{" "}
									{users.data?.pagination.last_page ?? 1} ({" "}
									{users.data?.pagination.total ?? 0} total)
								</p>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={(users.data?.pagination.page ?? 1) <= 1}
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
											(users.data?.pagination.page ?? 1) >=
											(users.data?.pagination.last_page ?? 1)
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
						</>
					)}
				</CardContent>
			</Card>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit User</DialogTitle>
						<DialogDescription>
							Update user details and save changes.
						</DialogDescription>
					</DialogHeader>
					{selectedUser && (
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
										<Select value={field.value} onValueChange={field.onChange}>
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
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
