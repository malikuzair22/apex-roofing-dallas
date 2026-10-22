import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, MapPin, Phone, ShieldCheck, Star } from "lucide-react";

import { CheckoutModal } from "#/components/CheckoutModal";
import { EstimateForm } from "#/components/EstimateForm";
import { company, type Service } from "#/company.config";
import { track } from "#/lib/track";

export const Route = createFileRoute("/")({
	validateSearch: (search: Record<string, unknown>): { estimate?: "received"; error?: string } => ({
		...(search.estimate === "received" ? { estimate: "received" as const } : {}),
		...(typeof search.error === "string" ? { error: search.error } : {}),
	}),
	component: Home,
});

function Home() {
	const { estimate, error } = Route.useSearch();
	const [checkout, setCheckout] = useState<Service | null>(null);
	const [quoteFor, setQuoteFor] = useState<string | undefined>();

	function openService(service: Service) {
		track(company.events.serviceViewed, { service: service.id, title: service.title, price: service.priceLabel ?? "quote", via: "cta" });
		if (service.checkout === "deposit") track(company.events.depositStarted, { service: service.id, price: service.priceLabel });
		if (service.planId) setCheckout(service);
		else {
			setQuoteFor(service.title);
			document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
		}
	}

	return (
		<div className="min-h-screen bg-paper text-ink">
			<Header />
			<main>
				<Hero />
				<TrustStrip />
				<Services onAction={openService} />
				<ServiceArea />
				<Financing />
				<Reviews />
				<Contact estimate={estimate} error={error} service={quoteFor} />
			</main>
			<Footer />
			<a
				href={`tel:${company.phoneHref}`}
				className="fixed right-4 bottom-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-5 font-semibold text-paper shadow-lg md:hidden"
			>
				<Phone className="size-4" aria-hidden /> Call
			</a>
			{checkout && <CheckoutModal service={checkout} onClose={() => setCheckout(null)} />}
		</div>
	);
}

function CtaLink({ children, href = "#contact", variant = "solid" }: { children: React.ReactNode; href?: string; variant?: "solid" | "dark" }) {
	return (
		<a
			href={href}
			className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-card px-7 font-semibold transition hover:brightness-110 ${
				variant === "solid" ? "bg-accent text-accent-ink" : "bg-ink text-paper"
			}`}
		>
			{children}
			<ArrowRight className="size-4" aria-hidden />
		</a>
	);
}

function Header() {
	return (
		<header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
				<a href="/" className="flex items-center gap-3 font-display text-2xl font-bold tracking-tight">
					<img src={company.logo} alt="" className="size-9 rounded" />
					{company.name}
				</a>
				<nav className="flex items-center gap-6 text-sm font-medium">
					<a href="#services" className="hidden text-muted hover:text-ink md:block">Services</a>
					<a href="#area" className="hidden text-muted hover:text-ink md:block">Service area</a>
					<a href="#financing" className="hidden text-muted hover:text-ink md:block">Financing</a>
					<a href="#reviews" className="hidden text-muted hover:text-ink md:block">Reviews</a>
					<a href={`tel:${company.phoneHref}`} className="hidden items-center gap-2 font-semibold sm:inline-flex">
						<Phone className="size-4 text-accent" aria-hidden /> {company.phone}
					</a>
					<a href="#contact" className="inline-flex min-h-11 items-center rounded-card bg-accent px-4 font-semibold text-accent-ink hover:brightness-110">
						Free estimate
					</a>
				</nav>
			</div>
		</header>
	);
}

function Hero() {
	return (
		<section className="relative isolate overflow-hidden bg-ink text-white">
			<img src={company.hero.image} alt="A newly installed charcoal shingle roof on a brick home in Texas" className="absolute inset-0 -z-10 size-full object-cover opacity-60" />
			<div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
			<div className="mx-auto max-w-6xl px-5 py-20 md:py-32">
				<p className="text-sm font-semibold tracking-widest text-accent uppercase">{company.hero.eyebrow}</p>
				<h1 className="mt-4 max-w-3xl font-display text-6xl leading-[0.95] font-bold tracking-tight text-balance md:text-8xl">
					{company.hero.headline}
				</h1>
				<p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">{company.hero.body}</p>
				<div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
					<CtaLink>{company.hero.cta}</CtaLink>
					<a href="#services" className="font-semibold underline decoration-white/40 underline-offset-4 hover:decoration-white">
						See services and pricing
					</a>
				</div>
				<p className="mt-8 flex items-center gap-2 text-sm text-white/80">
					<Star className="size-4 fill-accent text-accent" aria-hidden /> {company.trust.rating} rating. Licensed and insured.
				</p>
			</div>
		</section>
	);
}

function TrustStrip() {
	return (
		<section className="border-b border-line bg-card">
			<ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-3 px-5 py-5 md:grid-cols-4">
				{company.trust.badges.map((badge) => (
					<li key={badge} className="flex items-center gap-2 text-sm font-semibold">
						<ShieldCheck className="size-5 shrink-0 text-accent" aria-hidden />
						{badge}
					</li>
				))}
			</ul>
		</section>
	);
}

function Services({ onAction }: { onAction: (service: Service) => void }) {
	const [open, setOpen] = useState<string | null>(null);

	function toggle(service: Service) {
		const next = open === service.id ? null : service.id;
		setOpen(next);
		if (next) track(company.events.serviceViewed, { service: service.id, title: service.title, price: service.priceLabel ?? "quote" });
	}

	return (
		<section id="services" className="mx-auto max-w-6xl scroll-mt-16 px-5 py-20 md:py-28">
			<div className="grid gap-10 md:grid-cols-[1fr_1.8fr]">
				<div>
					<h2 className="font-display text-5xl leading-none font-bold tracking-tight md:text-6xl">Services and pricing</h2>
					<p className="mt-5 max-w-sm text-lg text-muted">Repairs and replacements are quoted after a free estimate. Inspections, deposits and gutter cleaning have set prices you can book online.</p>
				</div>
				<ul className="divide-y divide-line border-y border-line">
					{company.services.map((service) => {
						const expanded = open === service.id;
						return (
							<li key={service.id} className="py-6">
								<div className="flex flex-wrap items-center justify-between gap-4">
									<button
										onClick={() => toggle(service)}
										aria-expanded={expanded}
										className="flex min-h-11 flex-1 items-baseline gap-4 text-left"
									>
										<span className="font-display text-3xl font-bold tracking-tight">{service.title}</span>
										<span className="text-lg font-semibold text-accent">{service.priceLabel ?? "Free estimate"}</span>
									</button>
									<button
										onClick={() => onAction(service)}
										className="inline-flex min-h-11 items-center rounded-card border border-ink/20 px-5 text-sm font-semibold hover:border-ink hover:bg-ink hover:text-paper"
									>
										{service.ctaLabel}
									</button>
								</div>
								<p className="mt-2 max-w-xl text-muted">{service.blurb}</p>
								{expanded && (
									<ul className="mt-4 grid gap-2 sm:grid-cols-2">
										{service.includes.map((item) => (
											<li key={item} className="flex gap-2">
												<Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden />
												{item}
											</li>
										))}
									</ul>
								)}
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
}

function ServiceArea() {
	return (
		<section id="area" className="scroll-mt-16 bg-card">
			<div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1fr_1.8fr] md:py-24">
				<h2 className="font-display text-5xl leading-none font-bold tracking-tight md:text-6xl">Where we work</h2>
				<ul className="grid gap-4 sm:grid-cols-3">
					{company.serviceAreas.map((area) => (
						<li key={area.city} className="rounded-card border border-line bg-paper p-6">
							<MapPin className="size-6 text-accent" aria-hidden />
							<h3 className="mt-3 font-display text-3xl font-bold">{area.city}, TX</h3>
							<p className="mt-1 text-sm text-muted">{area.note}</p>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

function Financing() {
	const f = company.financing;
	return (
		<section id="financing" className="scroll-mt-16 bg-ink text-paper">
			<div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-16 md:flex-row md:items-center md:justify-between">
				<div className="max-w-xl">
					<h2 className="font-display text-5xl leading-none font-bold tracking-tight">{f.headline}</h2>
					<p className="mt-4 text-lg text-paper/80">{f.body}</p>
					<p className="mt-3 text-sm text-paper/60">{f.note}</p>
				</div>
				<ul className="flex flex-wrap gap-3">
					{f.providers.map((p) => (
						<li key={p} className="rounded-full border border-paper/30 px-6 py-3 font-display text-2xl font-bold">
							{p}
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

function Reviews() {
	const t = company.trust;
	return (
		<section id="reviews" className="mx-auto max-w-6xl scroll-mt-16 px-5 py-20 md:py-28">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<h2 className="font-display text-5xl leading-none font-bold tracking-tight md:text-6xl">What homeowners say</h2>
				<p className="flex items-center gap-2 font-semibold">
					<span className="flex" aria-label="5 out of 5 stars">
						{Array.from({ length: 5 }, (_, i) => (
							<Star key={i} className="size-5 fill-accent text-accent" aria-hidden />
						))}
					</span>
					{t.reviewCount ? `${t.rating} from ${t.reviewCount} reviews` : `${t.rating} average rating`}
				</p>
			</div>
			<ul className="mt-10 grid gap-5 md:grid-cols-3">
				{t.reviews.map((r) => (
					<li key={r.author} className="rounded-card border border-line bg-card p-6">
						<blockquote className="text-lg leading-relaxed">“{r.quote}”</blockquote>
						<p className="mt-5 text-sm font-semibold text-muted">{r.author}</p>
					</li>
				))}
			</ul>
		</section>
	);
}

function Contact({ estimate, error, service }: { estimate?: "received"; error?: string; service?: string }) {
	return (
		<section id="contact" className="scroll-mt-16 border-t border-line bg-card">
			<div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1fr_1.2fr] md:py-28">
				<div>
					<h2 className="font-display text-5xl leading-none font-bold tracking-tight md:text-6xl">Get your free estimate</h2>
					<p className="mt-5 max-w-sm text-lg text-muted">Tell us about your roof and we will send a written estimate, usually within one business day.</p>
					<dl className="mt-8 space-y-4">
						<div>
							<dt className="text-sm font-semibold tracking-wide text-accent uppercase">Call</dt>
							<dd><a href={`tel:${company.phoneHref}`} className="text-xl font-semibold">{company.phone}</a></dd>
						</div>
						<div>
							<dt className="text-sm font-semibold tracking-wide text-accent uppercase">Email</dt>
							<dd><a href={`mailto:${company.email}`} className="text-lg">{company.email}</a></dd>
						</div>
						<div>
							<dt className="text-sm font-semibold tracking-wide text-accent uppercase">Hours</dt>
							<dd className="text-lg">{company.hours}</dd>
						</div>
					</dl>
				</div>
				<div className="rounded-card border border-line bg-paper p-6 md:p-8">
					{estimate === "received" ? (
						<div role="status" className="py-8 text-center">
							<Check className="mx-auto size-10 text-accent" aria-hidden />
							<h3 className="mt-4 font-display text-4xl font-bold">Request received</h3>
							<p className="mx-auto mt-2 max-w-sm text-muted">Thanks. A member of our team will contact you within one business day to schedule your estimate.</p>
						</div>
					) : (
						<>
							{error === "auth_failed" && (
								<p role="alert" className="mb-4 rounded-card bg-red-50 p-3 text-sm font-medium text-red-800">Sign-in did not complete. Please submit the form again.</p>
							)}
							<EstimateForm service={service} />
						</>
					)}
				</div>
			</div>
		</section>
	);
}

function Footer() {
	return (
		<footer className="bg-ink text-paper/70">
			<div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm md:flex-row md:justify-between">
				<p>© {new Date().getFullYear()} {company.name}. Dallas, TX.</p>
				<p>{company.license}</p>
			</div>
		</footer>
	);
}
