import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { useAuth } from "#/lib/auth";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

/// Render login form
function LoginPage() {
	const navigate = useNavigate();
	const { isAuthenticated, login } = useAuth();
	const [emailValue, setEmailValue] = useState("");
	const [passwordValue, setPasswordValue] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (isAuthenticated) {
		void navigate({ to: "/" });
		return null;
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage(null);
		setIsSubmitting(true);
		try {
			await login(emailValue, passwordValue);
			await navigate({ to: "/" });
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "Unable to sign in",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-2 text-center">
					<CardTitle className="font-serif text-3xl">
						ATI Control Center
					</CardTitle>
					<CardDescription>
						Sign in to access inventory management
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={handleSubmit}>
						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="email">
								Email
							</label>
							<Input
								autoComplete="email"
								id="email"
								onChange={(event) => setEmailValue(event.target.value)}
								placeholder="name@example.com"
								required
								type="email"
								value={emailValue}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="password">
								Password
							</label>
							<Input
								autoComplete="current-password"
								id="password"
								onChange={(event) => setPasswordValue(event.target.value)}
								placeholder="Enter password"
								required
								type="password"
								value={passwordValue}
							/>
						</div>
						{errorMessage ? (
							<p className="text-destructive text-sm">{errorMessage}</p>
						) : null}
						<Button className="w-full" disabled={isSubmitting} type="submit">
							{isSubmitting ? "Signing in..." : "Sign In"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
