import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { WhopClient } from "@whop/sdk";

import { company } from "#/company.config";
import { accessLevel, currentUser } from "#/lib/session";

/** The platform injects the business key on outbound Whop calls, so no key lives in source. */
function whop() {
	return new WhopClient({
		token: process.env.WHOP_API_KEY ?? "",
		baseUrl: `${process.env.WHOP_API_ORIGIN ?? "https://api.whop.com"}/api/v1`,
	});
}

const accountId = company.whop.accountId;
const PENDING = "pending_estimate";
const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 30 } as const;

/* ------------------------------------------------------------------ */
/* 1. Estimate form -> Whop Leads API                                  */
/* ------------------------------------------------------------------ */

export type EstimateInput = {
	name: string;
	email: string;
	phone: string;
	address: string;
	roofType: string;
	service?: string;
	notes?: string;
};

function clean(value: unknown, max = 300) {
	return String(value ?? "").trim().slice(0, max);
}

function validateEstimate(raw: unknown): EstimateInput {
	const data = (raw ?? {}) as Record<string, unknown>;
	const input: EstimateInput = {
		name: clean(data.name, 120),
		email: clean(data.email, 200),
		phone: clean(data.phone, 40),
		address: clean(data.address, 250),
		roofType: clean(data.roofType, 60),
		service: clean(data.service, 60) || undefined,
		notes: clean(data.notes, 800) || undefined,
	};
	if (!input.name || !input.address || !input.roofType) throw new Error("Please fill in every field.");
	if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email)) throw new Error("Enter a valid email address.");
	if (input.phone.replace(/\D/g, "").length < 10) throw new Error("Enter a valid phone number.");
	return input;
}

async function createLead(userId: string, input: EstimateInput) {
	await whop().leads.create({
		account_id: accountId,
		user_id: userId,
		referrer: "estimate-form",
		metadata: {
			source: company.whop.leadSource,
			name: input.name,
			email: input.email,
			phone: input.phone,
			address: input.address,
			roof_type: input.roofType,
			service: input.service ?? "",
			notes: input.notes ?? "",
		},
	});
}

/**
 * A Whop lead belongs to a Whop user, so a visitor who is not signed in is sent through
 * Whop sign-in once. Their answers wait in a short-lived cookie and the lead is created
 * the moment they come back (see `completeEstimate`).
 */
export const submitEstimate = createServerFn({ method: "POST" })
	.validator((raw: unknown) => validateEstimate(raw))
	.handler(async ({ data }) => {
		const user = await currentUser();
		if (user) {
			await createLead(user.sub, data);
			return { status: "created" as const };
		}
		setCookie(PENDING, JSON.stringify(data), cookieOpts);
		return {
			status: "auth_required" as const,
			loginUrl: `/api/oauth/login?redirect_to=${encodeURIComponent("/estimate/complete")}`,
		};
	});

export const completeEstimate = createServerFn({ method: "GET" }).handler(async () => {
	const raw = getCookie(PENDING);
	if (!raw) return { ok: false as const, reason: "nothing_pending" };
	const user = await currentUser();
	if (!user) return { ok: false as const, reason: "signed_out" };
	try {
		await createLead(user.sub, validateEstimate(JSON.parse(raw)));
	} catch (error) {
		console.error("[estimate] lead failed", error);
		return { ok: false as const, reason: "lead_failed" };
	}
	setCookie(PENDING, "", { ...cookieOpts, maxAge: 0 });
	return { ok: true as const };
});

/* ------------------------------------------------------------------ */
/* 2. Deposit checkout with the card saved for the final balance       */
/* ------------------------------------------------------------------ */

export const createDepositPayment = createServerFn({ method: "POST" })
	.validator((raw: unknown) => {
		const data = (raw ?? {}) as Record<string, unknown>;
		const plan = company.services.find((s) => "checkout" in s && s.checkout === "deposit");
		if (!plan || !("planId" in plan)) throw new Error("Deposit is not configured.");
		const confirmationToken = clean(data.confirmationToken, 200);
		const returnUrl = clean(data.returnUrl, 2000);
		if (!confirmationToken.startsWith("ctok_")) throw new Error("Missing payment details.");
		if (!/^https:\/\//.test(returnUrl)) throw new Error("Invalid return URL.");
		return { confirmationToken, returnUrl, planId: plan.planId as string };
	})
	.handler(async ({ data }) => {
		const payment = await whop().payments.create({
			account_id: accountId,
			plan_id: data.planId,
			confirmation_token: data.confirmationToken,
			return_url: data.returnUrl,
			metadata: { source: "apex-site", kind: "project_deposit" },
		});
		return { id: payment.id, status: payment.status, client_secret: payment.client_secret };
	});

/* ------------------------------------------------------------------ */
/* 3. Final balance invoice, auto-charged to the saved card            */
/* ------------------------------------------------------------------ */

async function requireAdmin() {
	const user = await currentUser();
	if (!user) return { ok: false as const, reason: "signed_out" as const };
	const { access_level } = await accessLevel(user.sub, accountId);
	return access_level === "admin" ? { ok: true as const, user } : { ok: false as const, reason: "not_admin" as const };
}

export const checkAdmin = createServerFn({ method: "GET" }).handler(async () => {
	const guard = await requireAdmin();
	return guard.ok ? { ok: true as const, name: guard.user.name ?? "" } : { ok: false as const, reason: guard.reason };
});

export const createBalanceInvoice = createServerFn({ method: "POST" })
	.validator((raw: unknown) => {
		const data = (raw ?? {}) as Record<string, unknown>;
		const paymentId = clean(data.paymentId, 60);
		const amount = Number(data.amount);
		const description = clean(data.description, 200) || company.whop.balanceProductTitle;
		if (!paymentId.startsWith("pay_")) throw new Error("Enter the deposit payment ID (pay_...).");
		if (!Number.isFinite(amount) || amount < 1) throw new Error("Enter the remaining balance in dollars.");
		return { paymentId, amount: Math.round(amount * 100) / 100, description };
	})
	.handler(async ({ data }) => {
		const guard = await requireAdmin();
		if (!guard.ok) throw new Error("Only the business team can create balance invoices.");

		const client = whop();
		const deposit = await client.payments.retrieve({ id: data.paymentId });
		if (!deposit.member_id) throw new Error("That payment has no member attached.");
		if (!deposit.payment_method_id) {
			throw new Error("No card was saved on that deposit. Collect the balance by sending the invoice instead.");
		}

		const savedMethod = deposit.payment_method_id;
		const invoice = await client.invoices.create({
			account_id: accountId,
			collection_method: "charge_automatically",
			member_id: deposit.member_id,
			// Charge the card saved at deposit checkout.
			payment_token_id: savedMethod.startsWith("payt_") ? savedMethod : undefined,
			payment_method_id: savedMethod.startsWith("payt_") ? undefined : savedMethod,
			due_date: new Date(Date.now() + 60_000).toISOString(),
			product: { title: company.whop.balanceProductTitle },
			plan: { currency: "usd", plan_type: "one_time", initial_price: data.amount },
			line_items: [{ label: data.description, quantity: 1, unit_price: data.amount }],
		});
		return { id: invoice.id, status: invoice.status };
	});
