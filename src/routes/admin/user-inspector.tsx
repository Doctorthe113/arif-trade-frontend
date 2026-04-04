import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Badge } from "#/components/ui/badge";
import { apiFetch } from "#/lib/api";

type UserDetails = {
	id: number;
	name: string;
	email: string;
	role: "superadmin" | "editor" | "viewer" | "salesman";
	is_active: boolean;
	created_at: string;
	updated_at: string;
};

export const Route = createFileRoute("/admin/user-inspector")({
	component: AdminUserInspectorPage,
});

function AdminUserInspectorPage() {
	const [userInput, setUserInput] = useState("");
	const [userId, setUserId] = useState("");

	const userQuery = useQuery({
		queryKey: ["admin-user-inspector", userId],
		queryFn: () => apiFetch<UserDetails>(`/users/${userId}`),
		enabled: userId.trim().length > 0,
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">User Inspector</h1>
				<p className="text-muted-foreground text-sm">
					Inspect one user account record with role and status details.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lookup</CardTitle>
					<CardDescription>Enter user id to inspect</CardDescription>
				</CardHeader>
				<CardContent className="flex gap-3">
					<Input
						type="number"
						placeholder="User ID"
						value={userInput}
						onChange={(e) => setUserInput(e.target.value)}
						className="max-w-xs"
					/>
					<Button onClick={() => setUserId(userInput.trim())} disabled={!userInput.trim()}>
						Inspect
					</Button>
				</CardContent>
			</Card>

			{userId ? (
				userQuery.isLoading ? (
					<p className="text-muted-foreground text-sm">Loading user...</p>
				) : userQuery.isError ? (
					<p className="text-destructive text-sm">
						{userQuery.error instanceof Error ? userQuery.error.message : "Failed to load user"}
					</p>
				) : userQuery.data ? (
					<Card>
						<CardHeader>
							<CardTitle>User #{userQuery.data.id}</CardTitle>
							<CardDescription>{userQuery.data.email}</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-3 md:grid-cols-3">
							<div>
								<p className="text-muted-foreground text-xs">Name</p>
								<p className="font-medium">{userQuery.data.name}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Role</p>
								<p className="font-medium capitalize">{userQuery.data.role}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Status</p>
								<Badge variant={userQuery.data.is_active ? "default" : "secondary"}>
									{userQuery.data.is_active ? "active" : "inactive"}
								</Badge>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Created At</p>
								<p className="font-medium">{userQuery.data.created_at}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Updated At</p>
								<p className="font-medium">{userQuery.data.updated_at}</p>
							</div>
						</CardContent>
					</Card>
				) : null
			) : null}
		</div>
	);
}
