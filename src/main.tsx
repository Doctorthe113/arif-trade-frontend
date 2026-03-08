import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { getContext } from "./integrations/tanstack-query/root-provider";
import { AuthProvider } from "./lib/auth";
import { getRouter } from "./router";
import "./styles.css";

const { queryClient } = getContext();
const router = getRouter();

const el = document.getElementById("app");
if (!el) throw new Error("Missing #app element");

createRoot(el).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<RouterProvider router={router} />
			</AuthProvider>
		</QueryClientProvider>
	</StrictMode>,
);
