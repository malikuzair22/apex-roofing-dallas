import { useEffect, useMemo, useState } from "react";
import {
	BrandingElement,
	Checkout,
	CheckoutElement,
	EmailElement,
	ExpressCheckoutElement,
	PaymentElement,
	Payments,
	WhopElements,
	usePayments,
	useWhop,
} from "@whop/elements-react";
import { loadWhop } from "@whop/elements";
import { X } from "lucide-react";

import { company, type Service } from "#/company.config";
import { createDepositPayment } from "#/server/whop";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const appearance = {
	theme: { appearance: "light", accentColor: "orange", grayColor: "sand" },
} as const;

export function CheckoutModal({ service, onClose }: { service: Service; onClose: () => void }) {
	const [ready, setReady] = useState(false);
	const elements = useMemo(() => (typeof window === "undefined" ? null : loadWhop()), []);

	useEffect(() => {
		setReady(true);
		const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
		document.addEventListener("keydown", onKey);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = "";
		};
	}, [onClose]);

	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={service.title}>
			<div className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-paper p-5 sm:max-w-lg sm:rounded-card sm:p-8">
				<div className="mb-5 flex items-start justify-between gap-4">
					<div>
						<p className="text-sm font-semibold tracking-wide text-accent uppercase">{service.priceLabel}</p>
						<h2 className="font-display text-3xl font-bold tracking-tight">{service.title}</h2>
					</div>
					<button onClick={onClose} aria-label="Close" className="grid size-11 shrink-0 place-items-center rounded-full border border-line hover:border-ink/40">
						<X className="size-5" aria-hidden />
					</button>
				</div>
				{!ready || !elements || !service.planId ? (
					<div className="h-64 animate-pulse rounded-card bg-card" />
				) : (
					<WhopElements elements={elements}>
						{service.checkout === "deposit" ? (
							<DepositPayments planId={service.planId} />
						) : (
							<StandardCheckout planId={service.planId} />
						)}
					</WhopElements>
				)}
			</div>
		</div>
	);
}

/* Inspection and gutter cleaning: validate the email first, then express wallets above the full checkout. */
function StandardCheckout({ planId }: { planId: string }) {
	const [draft, setDraft] = useState("");
	const [email, setEmail] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const returnUrl = `${window.location.origin}/thanks`;
	const done = () => window.location.assign(`${returnUrl}?status=succeeded`);

	function confirmEmail(event: React.FormEvent) {
		event.preventDefault();
		const value = draft.trim();
		if (!EMAIL_RE.test(value)) {
			setError("Enter a valid email address, like name@example.com.");
			return;
		}
		setError(null);
		setEmail(value);
	}

	if (!email) {
		return (
			<form onSubmit={confirmEmail} className="space-y-3" noValidate>
				<label className="grid gap-1.5 text-sm font-semibold">
					Email for your receipt
					<input
						className="field"
						type="email"
						inputMode="email"
						autoComplete="email"
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onBlur={() => draft && !EMAIL_RE.test(draft.trim()) && setError("Enter a valid email address, like name@example.com.")}
						aria-invalid={!!error}
						aria-describedby="email-error"
						placeholder="you@email.com"
					/>
				</label>
				{error && (
					<p id="email-error" role="alert" className="text-sm font-medium text-red-700">
						{error}
					</p>
				)}
				<button className="inline-flex min-h-12 w-full items-center justify-center rounded-card bg-accent px-7 font-semibold text-accent-ink hover:brightness-110">
					Continue to payment
				</button>
			</form>
		);
	}

	return (
		<div className="space-y-5">
			<p className="flex items-center justify-between text-sm text-muted">
				<span>Receipt to {email}</span>
				<button onClick={() => setEmail(null)} className="font-semibold text-ink underline underline-offset-4">Change</button>
			</p>
			<Checkout plan={planId} returnUrl={returnUrl} appearance={appearance} onComplete={done}>
				<ExpressCheckoutElement />
			</Checkout>
			<div className="flex items-center gap-3 text-xs tracking-wide text-muted uppercase">
				<span className="h-px flex-1 bg-line" />
				or pay with card or bank
				<span className="h-px flex-1 bg-line" />
			</div>
			<Checkout plan={planId} returnUrl={returnUrl} appearance={appearance} onComplete={done}>
				<CheckoutElement buyerEmail={email} lockBuyerEmail />
			</Checkout>
		</div>
	);
}

/* Project deposit: the card is saved (off-session) so the final balance can be auto-charged. */
function DepositPayments({ planId }: { planId: string }) {
	const returnUrl = `${window.location.origin}/thanks?kind=deposit`;
	return (
		<Payments
			accountId={company.whop.accountId}
			plan={planId}
			setupFutureUsage="off_session"
			returnUrl={returnUrl}
			appearance={appearance}
		>
			<DepositForm returnUrl={returnUrl} />
		</Payments>
	);
}

function DepositForm({ returnUrl }: { returnUrl: string }) {
	const payments = usePayments();
	const whop = useWhop();
	const [complete, setComplete] = useState(false);
	const [emailValue, setEmailValue] = useState("");
	const [emailTouched, setEmailTouched] = useState(false);
	const emailOk = EMAIL_RE.test(emailValue.trim());
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function pay() {
		if (!payments || !whop) return;
		if (!emailOk) {
			setEmailTouched(true);
			return;
		}
		setBusy(true);
		setError(null);
		try {
			const { confirmationToken } = await payments.createConfirmationToken({});
			const payment = await createDepositPayment({ data: { confirmationToken, returnUrl } });
			if (payment.status !== "paid") {
				const result = await whop.payments.handleNextAction({ clientSecret: payment.client_secret! });
				if (result.redirected) return;
				if (result.status !== "succeeded" && result.status !== "processing") {
					setError(result.lastPaymentError?.message ?? "The payment step was not completed. Try again.");
					return;
				}
			}
			window.location.assign(`/thanks?kind=deposit&status=succeeded&payment=${payment.id}`);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Something went wrong. You have not been charged.");
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-5">
			<div onBlur={() => setEmailTouched(true)}>
				<EmailElement onChange={(event) => setEmailValue(event.email ?? "")} />
			</div>
			{emailTouched && !emailOk && (
				<p role="alert" className="text-sm font-medium text-red-700">
					Enter a valid email address, like name@example.com.
				</p>
			)}
			<PaymentElement onChange={(event) => setComplete(event.complete)} />
			<p className="text-sm text-muted">
				By paying, you agree that {company.name} may securely save this card and charge the remaining project balance to it when your
				job is complete. You will receive an invoice before each charge.
			</p>
			<BrandingElement />
			<button
				onClick={pay}
				disabled={!complete || !emailOk || busy}
				className="inline-flex min-h-12 w-full items-center justify-center rounded-card bg-accent px-7 font-semibold text-accent-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{busy ? "Processing..." : "Pay $500 deposit"}
			</button>
			{error && (
				<p role="alert" className="text-sm font-medium text-red-700">
					{error}
				</p>
			)}
		</div>
	);
}
