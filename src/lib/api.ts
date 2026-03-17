import { getToken } from "./auth";

type ApiEnvelope<T> = {
	success: boolean;
	message?: string;
	data: T;
};

const API_BASE = (import.meta.env.VITE_PUBLIC_API_BASE_URL as string).replace(
	/\/+$/,
	"",
);

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
	if (!value || typeof value !== "object") return false;
	const maybe = value as Record<string, unknown>;
	return typeof maybe.success === "boolean" && Object.hasOwn(maybe, "data");
}

/// Authenticated fetch wrapper
export async function apiFetch<T>(
	path: string,
	options?: RequestInit,
): Promise<T> {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const token = getToken();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...(options?.headers as Record<string, string>),
	};
	const res = await fetch(`${API_BASE}${normalizedPath}`, {
		...options,
		headers,
	});
	if (!res.ok) {
		const body = (await res.json().catch(() => ({}))) as {
			message?: string;
		};
		throw new Error(body.message ?? `Request failed: ${res.status}`);
	}
	const body = (await res.json()) as T | ApiEnvelope<T>;
	return isApiEnvelope<T>(body) ? body.data : body;
}
