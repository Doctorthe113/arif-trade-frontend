import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { apiFetch } from "#/lib/api";

const createUserSchema = z.object({
	name: z.string().min(1, "Name required"),
	email: z.email("Invalid email"),
	password: z.string().min(8, "Min 8 characters"),
	role: z.enum(["superadmin", "editor", "viewer", "salesman"]),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export const Route = createFileRoute("/admin/create-user")({
	component: CreateUserPage,
});

/// Create user form
function CreateUserPage() {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<CreateUserForm>({
		resolver: zodResolver(createUserSchema),
		defaultValues: { role: "salesman" },
	});

	const mutation = useMutation({
		mutationFn: (data: CreateUserForm) =>
			apiFetch<{ id: number }>("/users", {
				method: "POST",
				body: JSON.stringify(data),
			}),
		onSuccess: () => reset(),
	});

	function onSubmit(data: CreateUserForm) {
		mutation.mutate(data);
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Create User</h1>
			<Card className="max-w-lg">
				<CardHeader>
					<CardTitle>New User</CardTitle>
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
								Password
							</label>
							<Input id="password" type="password" {...register("password")} />
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
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending ? "Creating..." : "Create User"}
						</Button>
						{mutation.isSuccess && (
							<p className="text-sm text-green-600">
								User created (ID: {mutation.data.id})
							</p>
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
		</div>
	);
}
