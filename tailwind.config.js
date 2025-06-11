import { fontFamily } from "tailwindcss/defaultTheme";
/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: "class",
	content: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			colors: {
				background: "hsl(222.2 84% 4.9%)",
				foreground: "hsl(210 40% 98%)",
				card: "hsl(222.2 84% 4.9%)",
				"card-foreground": "hsl(210 40% 98%)",
				popover: "hsl(222.2 84% 4.9%)",
				"popover-foreground": "hsl(210 40% 98%)",
				primary: "hsl(217.2 91.2% 59.8%)",
				"primary-foreground": "hsl(222.2 47.4% 11.2%)",
				secondary: "hsl(217.2 32.6% 17.5%)",
				"secondary-foreground": "hsl(210 40% 98%)",
				muted: "hsl(217.2 32.6% 17.5%)",
				"muted-foreground": "hsl(215 20.2% 65.1%)",
				accent: "hsl(217.2 32.6% 17.5%)",
				"accent-foreground": "hsl(210 40% 98%)",
				destructive: "hsl(0 62.8% 30.6%)",
				"destructive-foreground": "hsl(210 40% 98%)",
				border: "hsl(217.2 32.6% 17.5%)",
				input: "hsl(217.2 32.6% 17.5%)",
				ring: "hsl(224.3 76.3% 48%)",
				"chart-1": "hsl(220 70% 50%)",
				"chart-2": "hsl(160 60% 45%)",
				"chart-3": "hsl(30 80% 55%)",
				"chart-4": "hsl(280 65% 60%)",
				"chart-5": "hsl(340 75% 55%)",
			},
			fontFamily: {
				title: ["'Poppins'", ...fontFamily.sans],
			},
		},
	},
};
