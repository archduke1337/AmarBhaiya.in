import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SkipLink } from "@/components/skip-link";
import { Analytics } from "@vercel/analytics/next";

// ── Fonts ─────────────────────────────────────────────────────
// Plus Jakarta Sans — modern, expressive, reads beautifully at all sizes
const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  axes: ["wght"],
  weight: ["400", "500", "600", "700", "800"],
});

// ── Metadata ─────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "amarbhaiya.in — Learn from Bhaiya",
    template: "%s | amarbhaiya.in",
  },
  description:
    "School-first learning from Amar Bhaiya — notes, courses, and practical guidance for Class 6 to 12 students, with skills and career growth layered in later.",
  keywords: [
    "Amarnath Pandey",
    "amarbhaiya",
    "Learn from Bhaiya",
    "online courses India",
    "class 6 to 12 notes",
    "board exam preparation",
    "student courses",
    "career guidance",
    "skill courses",
  ],
  authors: [{ name: "Amarnath Pandey" }],
  creator: "Amarnath Pandey",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "amarbhaiya.in",
    title: "amarbhaiya.in — Learn from Bhaiya",
    description:
      "School-first learning from Amar Bhaiya with notes, courses, and practical guidance for Indian students.",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@amarbhaiya",
  },
  robots: { index: true, follow: true },
  // iOS/Android web-app manifest hints
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "amarbhaiya.in",
  },
};

// ── Viewport — mobile-first + iOS safe area ───────────────────
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,   // allow zoom for accessibility
  viewportFit: "cover",  // honours iOS notch / Dynamic Island
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf5eb" },
    { media: "(prefers-color-scheme: dark)",  color: "#0e0e1a" },
  ],
};

// ── Root Layout ───────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      className={`${bodyFont.variable} h-full`}
      suppressHydrationWarning
      // HeroUI v3 theme switching is done via data-theme + class
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground antialiased grain-overlay">
        <SkipLink />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
