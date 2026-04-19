import { type MouseEvent, useEffect, useRef, useState } from "react";

import { Button } from "#/components/ui/button";

type ThemeMode = "light" | "dark" | "auto";
type ResolvedThemeMode = "light" | "dark";
type TransitionDocument = Document & {
	startViewTransition?: Document["startViewTransition"];
};

function prefersDarkMode(): boolean {
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getStoredMode(): ThemeMode {
	if (typeof window === "undefined") {
		return "auto";
	}

	const stored = window.localStorage.getItem("theme");
	if (stored === "light" || stored === "dark" || stored === "auto") {
		return stored;
	}

	return "auto";
}

function applyThemeMode(mode: ThemeMode) {
	const resolved =
		mode === "auto" ? (prefersDarkMode() ? "dark" : "light") : mode;

	document.documentElement.classList.remove("light", "dark");
	document.documentElement.classList.add(resolved);

	if (mode === "auto") {
		document.documentElement.removeAttribute("data-theme");
	} else {
		document.documentElement.setAttribute("data-theme", mode);
	}

	document.documentElement.style.colorScheme = resolved;
}

function resolveThemeMode(mode: ThemeMode): ResolvedThemeMode {
	if (mode === "auto") {
		return prefersDarkMode() ? "dark" : "light";
	}

	return mode;
}

function getNextMode(mode: ThemeMode): ThemeMode {
	if (mode === "light") {
		return "dark";
	}

	if (mode === "dark") {
		return "auto";
	}

	return "light";
}

function getTransitionOrigin(event: MouseEvent<HTMLButtonElement>): {
	x: number;
	y: number;
	radius: number;
} {
	const rect = event.currentTarget.getBoundingClientRect();
	const x = event.clientX || rect.left + rect.width / 2;
	const y = event.clientY || rect.top + rect.height / 2;
	const radius = Math.ceil(
		Math.hypot(
			Math.max(x, window.innerWidth - x),
			Math.max(y, window.innerHeight - y),
		),
	);

	return { x, y, radius };
}

function canUseViewTransition(documentRef: TransitionDocument): boolean {
	if (typeof documentRef.startViewTransition !== "function") {
		return false;
	}

	return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ThemeToggle() {
	const [mode, setMode] = useState<ThemeMode>(() => getStoredMode());
	const isTransitioningRef = useRef(false);

	useEffect(() => {
		applyThemeMode(mode);
		window.localStorage.setItem("theme", mode);
	}, [mode]);

	useEffect(() => {
		if (mode !== "auto") {
			return;
		}

		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => applyThemeMode("auto");

		media.addEventListener("change", onChange);
		return () => {
			media.removeEventListener("change", onChange);
		};
	}, [mode]);

	function toggleMode(event: MouseEvent<HTMLButtonElement>) {
		if (isTransitioningRef.current) {
			return;
		}

		const nextMode = getNextMode(mode);
		const transitionDocument = document as TransitionDocument;
		const hasVisualThemeChange =
			resolveThemeMode(mode) !== resolveThemeMode(nextMode);

		if (!canUseViewTransition(transitionDocument) || !hasVisualThemeChange) {
			setMode(nextMode);
			return;
		}

		const root = document.documentElement;
		const { x, y, radius } = getTransitionOrigin(event);

		root.style.setProperty("--x", `${x}px`);
		root.style.setProperty("--y", `${y}px`);
		root.style.setProperty("--theme-transition-radius", `${radius}px`);

		isTransitioningRef.current = true;
		try {
			const transition = transitionDocument.startViewTransition?.(() => {
				setMode(nextMode);
				applyThemeMode(nextMode);
			});

			if (!transition) {
				setMode(nextMode);
				isTransitioningRef.current = false;
				return;
			}

			void transition.finished.finally(() => {
				isTransitioningRef.current = false;
			});
		} catch {
			isTransitioningRef.current = false;
			setMode(nextMode);
		}
	}

	const label =
		mode === "auto"
			? "Theme mode: auto (system). Click to switch to light mode."
			: `Theme mode: ${mode}. Click to switch mode.`;

	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			onClick={toggleMode}
			aria-label={label}
			title={label}
		>
			{mode === "auto" ? "Auto" : mode === "dark" ? "Dark" : "Light"}
		</Button>
	);
}
