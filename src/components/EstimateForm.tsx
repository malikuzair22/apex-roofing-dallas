import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { company } from "#/company.config";
import { track } from "#/lib/track";
import { submitEstimate } from "#/server/whop";

export function EstimateForm({ service }: { service?: string }) {
	const navigate = useNavigate();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		setBusy(true);
		setError(null);
		track(company.events.estimateRequested, { source: company.whop.leadSource, service: service ?? "general" });
		try {
			const result = await submitEstimate({
				data: {
					name: String(form.get("name") ?? ""),
					email: String(form.get("email") ?? ""),
					phone: String(form.get("phone") ?? ""),
					address: String(form.get("address") ?? ""),
					roofType: String(form.get("roofType") ?? ""),
					service: service ?? "",
					notes: String(form.get("notes") ?? ""),
				},
			});
			if (result.status === "auth_required") {
				window.location.assign(result.loginUrl);
				return;
			}
			await navigate({ to: "/", search: { estimate: "received" }, hash: "contact" });
		} catch (e) {
			setError(e instanceof Error ? e.message : "We could not send your request. Please call us instead.");
		} finally {
			setBusy(false);
		}
	}

	return (
		<form onSubmit={onSubmit} className="grid gap-4" noValidate>
			<label className="grid gap-1.5 text-sm font-semibold">
				Name
				<input className="field" name="name" autoComplete="name" required placeholder="Your full name" />
			</label>
			<div className="grid gap-4 sm:grid-cols-2">
				<label className="grid gap-1.5 text-sm font-semibold">
					Email
					<input className="field" type="email" name="email" autoComplete="email" required placeholder="you@email.com" />
				</label>
				<label className="grid gap-1.5 text-sm font-semibold">
					Phone
					<input className="field" type="tel" name="phone" autoComplete="tel" required placeholder="(214) 555-0100" />
				</label>
			</div>
			<label className="grid gap-1.5 text-sm font-semibold">
				Property address
				<input className="field" name="address" autoComplete="street-address" required placeholder="Street, city, ZIP" />
			</label>
			<label className="grid gap-1.5 text-sm font-semibold">
				Roof type
				<select className="field" name="roofType" required defaultValue="">
					<option value="" disabled>
						Select your roof type
					</option>
					{company.roofTypes.map((type) => (
						<option key={type}>{type}</option>
					))}
				</select>
			</label>
			<label className="grid gap-1.5 text-sm font-semibold">
				Anything we should know? <span className="font-normal text-muted">(optional)</span>
				<textarea className="field min-h-24" name="notes" placeholder="Active leak, storm damage, insurance claim..." />
			</label>
			{service && <p className="text-sm text-muted">Requesting: {service}</p>}
			<button
				type="submit"
				disabled={busy}
				className="inline-flex min-h-12 items-center justify-center gap-2 rounded-card bg-accent px-7 font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-60"
			>
				{busy ? "Sending..." : company.hero.cta}
				<ArrowRight className="size-4" aria-hidden />
			</button>
			{error && (
				<p role="alert" className="text-sm font-medium text-red-700">
					{error}
				</p>
			)}
			<p className="text-xs text-muted">
				We will contact you within one business day. If you are not signed in, you will be asked to confirm with a quick Whop sign-in so
				we can save your request.
			</p>
		</form>
	);
}
