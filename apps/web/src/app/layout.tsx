import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SkipLink } from "@/components/layout/skip-link";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";

// ── Fonts ─────────────────────────────────────────────────────
// Plus Jakarta Sans — modern, expressive, reads beautifully at all sizes
const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: "variable",
});

// DM Serif Display — editorial luxury serif for headings
const headingFont = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: "400",
});

// ── Metadata ─────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://amarbhaiya.in"
  ),
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
      className={`${bodyFont.variable} ${headingFont.variable} h-full`}
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
          <Toaster />
        </ThemeProvider>
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://amarbhaiya.in/#website",
                  url: "https://amarbhaiya.in",
                  name: "amarbhaiya.in",
                  description:
                    "School-first learning platform by Amar Bhaiya — notes, courses, and practical guidance for Class 6 to 12 students.",
                  inLanguage: "en-IN",
                },
                {
                  "@type": "Organization",
                  "@id": "https://amarbhaiya.in/#organization",
                  name: "amarbhaiya.in",
                  url: "https://amarbhaiya.in",
                  logo: "https://amarbhaiya.in/opengraph-image.png",
                  founder: { "@type": "Person", name: "Amarnath Pandey" },
                  sameAs: [
                    "https://youtube.com/@amarbhaiya",
                    "https://instagram.com/amarbhaiya",
                    "https://twitter.com/amarbhaiya",
                    "https://linkedin.com/in/amarnathpandey",
                  ],
                },
              ],
            }).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
