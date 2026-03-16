import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

type UserRole = "superadmin" | "editor" | "viewer" | "salesman" | "doctor";

type User = {
	name: string;
	email: string;
	role: UserRole;
};

type AuthContextValue = {
	user: User | null;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	logout: () => void;
	hasRole: (...roles: UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = (import.meta.env.VITE_PUBLIC_API_BASE_URL as string).replace(
	/\/+$/,
	"",
);
const STORAGE_KEY = "ati_auth";

/// Decode JWT payload without library
function decodePayload(token: string): Record<string, unknown> {
	const base64 = token.split(".")[1];
	if (!base64) throw new Error("Invalid token");
	const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
	return JSON.parse(json) as Record<string, unknown>;
}

/// Load persisted auth from localStorage
function loadStoredAuth(): { token: string; user: User } | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as { token: string; user: User };
		const payload = decodePayload(parsed.token);
		const expSeconds = payload.exp as number | undefined;
		if (expSeconds && expSeconds * 1000 < Date.now()) {
			localStorage.removeItem(STORAGE_KEY);
			return null;
		}
		return parsed;
	} catch {
		localStorage.removeItem(STORAGE_KEY);
		return null;
	}
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const stored = loadStoredAuth();
		if (stored) setUser(stored.user);
		setReady(true);
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		const res = await fetch(`${API_BASE}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		if (!res.ok) {
			const body = (await res.json().catch(() => ({}))) as {
				message?: string;
			};
			throw new Error(body.message ?? "Login failed");
		}
		const json = (await res.json()) as {
			data: {
				token: string;
				user: { name: string; email: string; role: UserRole };
			};
		};
		const { token, user: u } = json.data;
		const authUser: User = {
			name: u.name,
			email: u.email,
			role: u.role,
		};
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ token, user: authUser }),
		);
		setUser(authUser);
	}, []);

	const logout = useCallback(() => {
		localStorage.removeItem(STORAGE_KEY);
		setUser(null);
	}, []);

	const hasRole = useCallback(
		(...roles: UserRole[]) => {
			if (!user) return false;
			if (user.role === "superadmin") return true;
			return roles.includes(user.role);
		},
		[user],
	);

	if (!ready) return null;

	return (
		<AuthContext
			value={{ user, isAuthenticated: !!user, login, logout, hasRole }}
		>
			{children}
		</AuthContext>
	);
}

/// Access auth context
export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be inside AuthProvider");
	return ctx;
}

/// Get stored JWT token
export function getToken(): string | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		return (JSON.parse(raw) as { token: string }).token;
	} catch {
		return null;
	}
}
