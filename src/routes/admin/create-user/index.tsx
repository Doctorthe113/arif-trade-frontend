import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { apiFetch } from "#/lib/api";

const createUserSchema = z.object({
	name: z.string().min(1, "Name required"),
	email: z.email("Invalid email"),
	password: z.string().min(8, "Min 8 characters"),
	role: z.enum(["superadmin", "editor", "viewer", "salesman"]),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export const Route = createFileRoute("/admin/create-user/")({
	component: CreateUserPage,
});

/// Create user form
function CreateUserPage() {
	const {
		register,
		handleSubmit,
		reset,
		control,
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
