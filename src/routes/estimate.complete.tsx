import { createFileRoute, redirect } from "@tanstack/react-router";

import { completeEstimate } from "#/server/whop";

export const Route = createFileRoute("/estimate/complete")({
	head: () => ({ meta: [{ title: "Saving your estimate request | Apex Roofing Co." }] }),
	beforeLoad: async () => {
		const result = await completeEstimate();
		if (result.ok) throw redirect({ to: "/", search: { estimate: "received" }, hash: "contact" });
		throw redirect({ to: "/", search: { error: "auth_failed" }, hash: "contact" });
	},
	component: () => null,
});
