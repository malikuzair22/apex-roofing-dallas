import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { company } from "#/company.config";
import { checkAdmin, createBalanceInvoice } from "#/server/whop";

export const Route = createFileRoute("/admin/balance")({
	head: () => ({ meta: [{ title: `Final balance invoice | ${company.name}` }, { name: "robots", content: "noindex" }] }),
	loader: () => checkAdmin(),
	component: BalancePage,
});

function BalancePage() {
	const guard = Route.useLoaderData();
	const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
	const [busy, setBusy] = useState(false);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const f = new FormData(e.currentTarget);
		setBusy(true);
		setMsg(null);
		try {
			const inv = await createBalanceInvoice({
				data: { paymentId: String(f.get("paymentId")), amount: Number(f.get("amount")), description: String(f.get("description") ?? "") },
			});
			setMsg({ ok: true, text: `Invoice ${inv.id} created (${inv.status}). The saved card is charged automatically.` });
		} catch (err) {
			setMsg({ ok: false, text: err instanceof Error ? err.message : "Could not create the invoice." });
		} finally {
			setBusy(false);
		}
	}

	return (
		<main className="mx-auto min-h-screen max-w-lg bg-paper px-5 py-16 text-ink">
			<h1 className="font-display text-5xl font-bold tracking-tight">Final balance invoice</h1>
			{!guard.ok ? (
				<div className="mt-6">
					<p className="text-muted">
						{guard.reason === "signed_out" ? "Sign in with the Whop account that manages this business." : "This account does not manage this business."}
					</p>
					<a href="/api/oauth/login?redirect_to=/admin/balance" className="mt-6 inline-flex min-h-12 items-center rounded-card bg-accent px-7 font-semibold text-accent-ink">Sign in with Whop</a>
				</div>
			) : (
				<form onSubmit={onSubmit} className="mt-6 grid gap-4">
					<p className="text-muted">Creates an invoice for the remaining balance and charges the card the customer saved with their deposit.</p>
					<label className="grid gap-1.5 text-sm font-semibold">Deposit payment ID<input className="field" name="paymentId" required placeholder="pay_..." /></label>
					<label className="grid gap-1.5 text-sm font-semibold">Remaining balance (USD)<input className="field" name="amount" type="number" min="1" step="0.01" required /></label>
					<label className="grid gap-1.5 text-sm font-semibold">Line item description<input className="field" name="description" placeholder="Roof replacement, final balance" /></label>
					<button disabled={busy} className="min-h-12 rounded-card bg-accent px-7 font-semibold text-accent-ink disabled:opacity-60">{busy ? "Creating..." : "Create invoice and charge card"}</button>
					{msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-green-800" : "text-red-700"}`}>{msg.text}</p>}
				</form>
			)}
		</main>
	);
}
