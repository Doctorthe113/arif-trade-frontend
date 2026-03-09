const disableAuthRaw = import.meta.env.VITE_DISABLE_AUTH;

/// Parse auth bypass flag
export const isAuthDisabled =
	disableAuthRaw === "true" || disableAuthRaw === "1";
