import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { company } from "#/company.config";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: `${company.name} | Roof repair, replacement and inspection in Dallas, TX` },
			{
				name: "description",
				content:
					"Licensed and insured roofing in Dallas, Plano and Frisco. Free estimates, $149 inspections, and financing with Klarna, Afterpay and Splitit.",
			},
			{ property: "og:title", content: `${company.name} | Dallas roofing` },
			{ property: "og:description", content: company.hero.body },
			{ property: "og:image", content: company.hero.image },
			{ name: "color-scheme", content: "light" },
		],
		links: [
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{ rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600;700&display=swap",
			},
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: company.logo },
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const { accent, ink, paper } = company.theme;
	return (
		<html lang="en">
			<head>
				<HeadContent />
				<style>{`:root{--color-accent:${accent};--color-ink:${ink};--color-paper:${paper}}`}</style>
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
