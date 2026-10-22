/**
 * company.config.ts
 *
 * Everything that makes this site "Apex Roofing Co." lives in this file.
 * To reuse the template for another roofer, edit the values below. Nothing
 * else in the codebase hard-codes a name, price, city or Whop ID.
 */

export type Service = {
	id: string;
	title: string;
	blurb: string;
	/** Display price. Leave undefined for quote-based work. */
	priceLabel?: string;
	/** Whop plan to sell through checkout. Leave undefined for quote-based work. */
	planId?: string;
	/** Which checkout to open when `planId` is set. */
	checkout?: "standard" | "deposit";
	ctaLabel: string;
	includes: string[];
};

export const company = {
	name: "Apex Roofing Co.",
	tagline: "Roofs built to outlast Texas weather",
	phone: "(214) 555-0142",
	phoneHref: "+12145550142",
	email: "hello@apexroofing.example",
	license: "TX Roofing Contractor Lic. [confirm: license number]",
	hours: "Mon to Sat, 7am to 6pm",

	whop: {
		/** The Whop business that owns products, leads and invoices. */
		accountId: "biz_kr4ZLGQMNFSJUB",
		/** Whop product used for the final-balance invoice. */
		balanceProductTitle: "Roofing Project Final Balance",
		/** Where leads from the estimate form are tagged. */
		leadSource: "apex-roofing-estimate-form",
	},

	/** Custom `whop.track` event names. */
	events: {
		estimateRequested: "estimate_requested",
		serviceViewed: "service_viewed",
		depositStarted: "deposit_started",
	},

	hero: {
		eyebrow: "Dallas, Plano and Frisco",
		headline: "A roof you never have to think about again",
		body: "Local crews, written estimates and straight answers. We repair, replace and inspect roofs across the Dallas area, and we stand behind every shingle.",
		image:
			"https://assets-2-prod.whop.com/public/uploads/2026-10-22/81645a2c-9aba-4f95-a30d-abbc32c30a1f/image.png",
		cta: "Request Free Estimate",
	},

	logo: "https://assets-2-prod.whop.com/public/uploads/2026-10-22/8e4a0321-1f1e-482b-850b-b4e4e64f0d3a/image.png",

	services: [
		{
			id: "repair",
			title: "Roof Repair",
			blurb: "Leaks, missing shingles, flashing and storm damage fixed fast, usually within two business days.",
			ctaLabel: "Get a repair quote",
			includes: ["Leak tracing", "Shingle and flashing repair", "Photo report before and after"],
		},
		{
			id: "replacement",
			title: "Roof Replacement",
			blurb: "Full tear-off and replacement with manufacturer-backed materials and a written workmanship warranty.",
			ctaLabel: "Get a replacement quote",
			includes: ["Full tear-off and disposal", "New underlayment and flashing", "Workmanship warranty"],
		},
		{
			id: "inspection",
			title: "Roof Inspection",
			blurb: "A licensed inspector walks your roof and sends a written condition report with photos.",
			priceLabel: "$149",
			planId: "plan_G1UVKf1y7FIBC",
			checkout: "standard",
			ctaLabel: "Book inspection",
			includes: ["Full roof walk", "Photo condition report", "Insurance-ready documentation"],
		},
		{
			id: "deposit",
			title: "Project Deposit",
			blurb: "Lock in your install date. Your card is saved securely and the final balance is invoiced after the work is done.",
			priceLabel: "$500",
			planId: "plan_0NKHxdOBu8e6P",
			checkout: "deposit",
			ctaLabel: "Pay deposit",
			includes: ["Reserves your crew and date", "Card saved for the final balance", "Applied to your project total"],
		},
		{
			id: "gutters",
			title: "Gutter Cleaning",
			blurb: "Flat-rate gutter and downspout cleaning for a standard home. No surprises on the invoice.",
			priceLabel: "$299 flat",
			planId: "plan_43oKpc7Jo4iqF",
			checkout: "standard",
			ctaLabel: "Book gutter cleaning",
			includes: ["Debris removal", "Downspout flush", "Photo of the finished job"],
		},
	] satisfies Service[],

	serviceAreas: [
		{ city: "Dallas", note: "All ZIP codes inside Dallas County" },
		{ city: "Plano", note: "Plano, Collin County" },
		{ city: "Frisco", note: "Frisco, Collin and Denton County" },
	],

	financing: {
		headline: "Roof now, pay over time",
		body: "Split your project into smaller payments at checkout. Approval takes a couple of minutes and does not affect your estimate.",
		providers: ["Klarna", "Afterpay", "Splitit"],
		note: "Availability and limits depend on the provider and your order total.",
	},

	trust: {
		badges: ["Licensed & Insured", "5-Star Rated", "Written Warranty", "Free Estimates"],
		rating: "5.0",
		/** Set to e.g. "48" once you have a real count. Empty hides it. */
		reviewCount: "",
		reviews: [
			{
				quote: "They found the leak two other roofers missed and had it fixed the next day. Clear price, no upsell.",
				author: "Dana W., Plano",
			},
			{
				quote: "Full replacement in two days. The crew cleaned up so well I could not tell they had been here.",
				author: "Marcus T., Frisco",
			},
			{
				quote: "The inspection report had photos of everything, and it was exactly what my insurance adjuster needed.",
				author: "Priya R., Dallas",
			},
		],
	},

	roofTypes: ["Asphalt shingle", "Metal", "Tile", "Flat / low slope", "Wood shake", "Not sure"],

	theme: {
		// Applied as CSS variables in src/styles.css via the root route.
		accent: "#e8590c",
		ink: "#17181a",
		paper: "#f6f3ee",
	},
} as const;

export type Company = typeof company;
