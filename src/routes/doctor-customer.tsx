import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import ThemeToggle from "#/components/ThemeToggle";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { apiFetch } from "#/lib/api";
import { useAuth } from "#/lib/auth";
import { isAuthDisabled } from "#/lib/auth-flags";

export const Route = createFileRoute("/doctor-customer")({
	component: DoctorCustomerPage,
});

/// Doctor-facing dashboard
function DoctorCustomerPage() {
	const { user, hasRole, logout } = useAuth();

	const invoices = useQuery({
		queryKey: ["doctor-invoices"],
		queryFn: () =>
			apiFetch<{
				data: {
					total_amount: string;
					status: string;
					paid: string;
					due: string;
					date: string;
				}[];
			}>("/invoices?per_page=100"),
	});

	const data = invoices.data?.data ?? [];
	const totalSpentTaka = data.reduce(
		(sum, inv) => sum + Number.parseFloat(inv.paid || "0"),
		0,
	);
	const totalDueTaka = data.reduce(
		(sum, inv) => sum + Number.parseFloat(inv.due || "0"),
		0,
	);
	const totalBilledTaka = data.reduce(
		(sum, inv) => sum + Number.parseFloat(inv.total_amount || "0"),
		0,
	);

	const now = new Date();
	const monthlyData = data.filter((inv) => {
		const d = new Date(inv.date);
		return (
			d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
		);
	});
	const monthlyBillingTaka = monthlyData.reduce(
		(sum, inv) => sum + Number.parseFloat(inv.total_amount || "0"),
		0,
	);

	if (!isAuthDisabled && !hasRole("doctor")) return <Navigate to="/" />;

	return (
		<div className="min-h-screen p-6">
			<div className="mx-auto max-w-3xl space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">
							Welcome, {user?.name ?? "Doctor"}
						</h1>
						<p className="text-muted-foreground text-sm">
							Your billing overview
						</p>
					</div>
					<div className="flex items-center gap-2">
						<ThemeToggle />
						<Button variant="outline" onClick={logout}>
							Sign Out
						</Button>
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<Card>
						<CardHeader>
							<CardDescription>Total Spent</CardDescription>
							<CardTitle className="text-3xl">
								৳{totalSpentTaka.toLocaleString()}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader>
							<CardDescription>Total Due</CardDescription>
							<CardTitle className="text-3xl text-destructive">
								৳{totalDueTaka.toLocaleString()}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader>
							<CardDescription>Total Billed</CardDescription>
							<CardTitle className="text-3xl">
								৳{totalBilledTaka.toLocaleString()}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader>
							<CardDescription>This Month</CardDescription>
							<CardTitle className="text-3xl">
								৳{monthlyBillingTaka.toLocaleString()}
							</CardTitle>
						</CardHeader>
					</Card>
				</div>
			</div>
		</div>
	);
}
