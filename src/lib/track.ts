import { company } from "#/company.config";

type EventName = (typeof company.events)[keyof typeof company.events];

declare global {
	interface Window {
		whop?: { track: (name: string, props?: Record<string, unknown>) => void };
	}
}

/** Fires a custom Whop pixel event. Safe to call where the pixel is absent (preview, SSR). */
export function track(name: EventName, props?: Record<string, unknown>) {
	if (typeof window === "undefined") return;
	try {
		window.whop?.track(name, props);
	} catch {
		// Analytics must never break the page.
	}
}
