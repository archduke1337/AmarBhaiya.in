import type { Metadata } from "next";
import { Bricolage_Grotesque, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SkipLink } from "@/components/skip-link";

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
    default: "Amar Bhaiya — Padhai, Skills, aur Zindagi",
    template: "%s | amarbhaiya.in",
  },
  description:
    "Free study notes, video courses, live sessions & career guidance for Class 6 to 12 students. Coding, communication, and life skills for college students. By Amarnath Pandey (Amar Bhaiya).",
  keywords: [
    "Amar Bhaiya",
    "Amarnath Pandey",
    "class 6 to 12 notes",
    "free study notes",
    "CBSE notes",
    "board exam preparation",
    "online courses for students",
    "coding for beginners",
    "career guidance India",
    "learn from bhaiya",
    "Hindi education",
    "Indian students",
    "school courses online",
    "free learning platform",
  ],
  authors: [{ name: "Amarnath Pandey" }],
  creator: "Amarnath Pandey",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "amarbhaiya.in",
    title: "Amar Bhaiya — Padhai, Skills, aur Zindagi",
    description:
      "Free study notes, video courses & career guidance for Class 6 to 12 students. By Amarnath Pandey.",
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
      </body>
    </html>
  );
}
