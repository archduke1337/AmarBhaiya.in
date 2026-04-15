import type { Metadata } from "next";
import { Bricolage_Grotesque, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SkipLink } from "@/components/skip-link";
import { Analytics } from "@vercel/analytics/next";

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

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
    "online courses",
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
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased font-sans`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
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
