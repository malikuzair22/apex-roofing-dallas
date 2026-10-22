import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { company } from "#/company.config";

export const Route = createFileRoute("/thanks")({
	validateSearch: (s: Record<string, unknown>): { status?: string; kind?: string; payment?: string } => ({
		...(typeof s.status === "string" ? { status: s.status } : {}),
		...(typeof s.kind === "string" ? { kind: s.kind } : {}),
		...(typeof s.payment === "string" ? { payment: s.payment } : {}),
	}),
	head: () => ({ meta: [{ title: `Payment | ${company.name}` }] }),
	component: Thanks,
});

function Thanks() {
	const { status, kind } = Route.useSearch();
	const ok = status === "succeeded";
	const pending = status === "processing";
	return (
		<main className="grid min-h-screen place-items-center bg-paper px-5 text-ink">
			<div className="max-w-md text-center">
				{ok && <Check className="mx-auto size-12 text-accent" aria-hidden />}
				<h1 className="mt-4 font-display text-5xl font-bold tracking-tight">
					{ok ? "You are booked" : pending ? "Confirming your payment" : "Payment not completed"}
				</h1>
				<p className="mt-3 text-muted">
					{ok
						? kind === "deposit"
							? "Your deposit is received and your card is saved securely. We will invoice the remaining balance after the work is complete."
							: "Thanks. A receipt is on its way to your email and we will be in touch to schedule."
						: pending
							? "Your payment is still processing. We will email you as soon as it is confirmed."
							: "No money was taken. You can go back and try again with another payment method."}
				</p>
				<a href="/" className="mt-8 inline-flex min-h-12 items-center rounded-card bg-accent px-7 font-semibold text-accent-ink">Back to {company.name}</a>
			</div>
		</main>
	);
}
