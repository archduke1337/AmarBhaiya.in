import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "amarbhaiya.in — Learn from Bhaiya",
    template: "%s | amarbhaiya.in",
  },
  description:
    "Amarnath Pandey's unified platform — Education, Fitness, Career Guidance, Entrepreneurship & Personal Development. Learn from Bhaiya.",
  keywords: [
    "Amarnath Pandey",
    "amarbhaiya",
    "Learn from Bhaiya",
    "online courses",
    "tech education",
    "fitness training",
    "career coaching",
    "entrepreneurship",
    "personal development",
    "LMS",
  ],
  authors: [{ name: "Amarnath Pandey" }],
  creator: "Amarnath Pandey",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "amarbhaiya.in",
    title: "amarbhaiya.in — Learn from Bhaiya",
    description:
      "Amarnath Pandey's unified platform for education, fitness, career guidance, and personal growth.",
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
      lang="en"
      className={cn("h-full antialiased font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
