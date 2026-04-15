import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Download,
  FileText,
  GraduationCap,
  Search,
} from "lucide-react";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicCoursesPageData } from "@/lib/appwrite/marketing-content";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Study Notes — Class 6 to 12 | amarbhaiya.in",
  description:
    "Download free chapter-wise study notes for Class 6 to 12. Science, Maths, English, SST — clean, exam-focused notes by Amar Bhaiya. No login needed for previews.",
};

export const revalidate = 3600;

// Notes are a curated view of resources attached to courses.
// For now, we display a structured notes directory organized by class.
// When instructors upload resources to courses, they appear here automatically.

const notesDirectory = [
  {
    grade: "Class 6",
    subjects: [
      { name: "Science", chapters: 16, status: "coming" as const },
      { name: "Maths", chapters: 15, status: "coming" as const },
      { name: "English", chapters: 10, status: "coming" as const },
      { name: "SST", chapters: 20, status: "coming" as const },
    ],
  },
  {
    grade: "Class 7",
    subjects: [
      { name: "Science", chapters: 18, status: "coming" as const },
      { name: "Maths", chapters: 15, status: "coming" as const },
      { name: "English", chapters: 10, status: "coming" as const },
      { name: "SST", chapters: 22, status: "coming" as const },
    ],
  },
  {
    grade: "Class 8",
    subjects: [
      { name: "Science", chapters: 18, status: "coming" as const },
      { name: "Maths", chapters: 16, status: "coming" as const },
      { name: "English", chapters: 12, status: "coming" as const },
      { name: "SST", chapters: 24, status: "coming" as const },
    ],
  },
  {
    grade: "Class 9",
    subjects: [
      { name: "Science", chapters: 15, status: "coming" as const },
      { name: "Maths", chapters: 15, status: "coming" as const },
      { name: "English", chapters: 12, status: "coming" as const },
      { name: "SST", chapters: 20, status: "coming" as const },
    ],
  },
  {
    grade: "Class 10",
    subjects: [
      { name: "Science", chapters: 16, status: "coming" as const },
      { name: "Maths", chapters: 15, status: "coming" as const },
      { name: "English", chapters: 12, status: "coming" as const },
      { name: "SST", chapters: 20, status: "coming" as const },
    ],
  },
  {
    grade: "Class 11 (Science)",
    subjects: [
      { name: "Physics", chapters: 15, status: "coming" as const },
      { name: "Chemistry", chapters: 14, status: "coming" as const },
      { name: "Maths", chapters: 16, status: "coming" as const },
      { name: "Biology", chapters: 22, status: "coming" as const },
    ],
  },
  {
    grade: "Class 11 (Commerce)",
    subjects: [
      { name: "Accountancy", chapters: 14, status: "coming" as const },
      { name: "Business Studies", chapters: 12, status: "coming" as const },
      { name: "Economics", chapters: 10, status: "coming" as const },
    ],
  },
  {
    grade: "Class 12 (Science)",
    subjects: [
      { name: "Physics", chapters: 15, status: "coming" as const },
      { name: "Chemistry", chapters: 16, status: "coming" as const },
      { name: "Maths", chapters: 13, status: "coming" as const },
      { name: "Biology", chapters: 16, status: "coming" as const },
    ],
  },
  {
    grade: "Class 12 (Commerce)",
    subjects: [
      { name: "Accountancy", chapters: 12, status: "coming" as const },
      { name: "Business Studies", chapters: 12, status: "coming" as const },
      { name: "Economics", chapters: 10, status: "coming" as const },
    ],
  },
];

export default async function NotesPage() {
  return (
    <div className="space-y-16 px-4 pb-12 pt-6 md:px-6 md:pt-8">
      {/* Hero */}
      <section className="mx-auto max-w-4xl text-center space-y-6">
        <Badge variant="secondary">100% Free</Badge>
        <h1 className="text-4xl font-black leading-tight tracking-tight text-balance sm:text-5xl md:text-6xl">
          Study notes jo{" "}
          <span className="text-primary">exam ke din</span> kaam aayein.
        </h1>
        <p className="mx-auto max-w-xl text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
          Chapter-wise, topic-wise, clean and focused. Board exam ke liye bane hain —
          download karo, print karo, revise karo. Sign up karne ki zaroorat nahi.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="#notes-directory">
              <Search className="size-4" />
              Find your class
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">
              Get notified for new notes
            </Link>
          </Button>
        </div>
      </section>

      {/* Notes Directory */}
      <section id="notes-directory" className="mx-auto max-w-6xl space-y-6 scroll-mt-20">
        <SectionHeading
          eyebrow="Notes Directory"
          title="Apni class choose karo, subject choose karo."
          description="Notes jaise jaise ready hote jayenge, yahan pe available ho jayenge. Abhi hum actively upload kar rahe hain."
          titleAs="h2"
        />

        <div className="space-y-4">
          {notesDirectory.map((classItem) => (
            <RetroPanel key={classItem.grade} tone="card" className="space-y-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="size-5 text-primary" />
                <h3 className="text-lg font-black tracking-tight">{classItem.grade}</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {classItem.subjects.map((subject) => (
                  <div
                    key={`${classItem.grade}-${subject.name}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {subject.chapters} chapters
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      Coming soon
                    </Badge>
                  </div>
                ))}
              </div>
            </RetroPanel>
          ))}
        </div>
      </section>

      {/* How notes work */}
      <section className="mx-auto max-w-4xl">
        <RetroPanel tone="accent" size="lg" className="space-y-5">
          <SectionHeading
            eyebrow="How it works"
            title="Notes kaise use karein?"
            titleAs="h2"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 font-heading text-base font-black text-primary">
                1
              </div>
              <h3 className="text-sm font-black">Choose your class & subject</h3>
              <p className="text-xs text-muted-foreground">Select the chapter you want to revise</p>
            </div>
            <div className="space-y-2 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 font-heading text-base font-black text-primary">
                2
              </div>
              <h3 className="text-sm font-black">Read online or download PDF</h3>
              <p className="text-xs text-muted-foreground">Free — no signup needed for preview</p>
            </div>
            <div className="space-y-2 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 font-heading text-base font-black text-primary">
                3
              </div>
              <h3 className="text-sm font-black">Pair with video lessons</h3>
              <p className="text-xs text-muted-foreground">Notes + course together = best results</p>
            </div>
          </div>
        </RetroPanel>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl">
        <RetroPanel tone="brand" size="lg" className="text-center space-y-5">
          <h2 className="text-2xl font-black leading-tight tracking-tight text-primary-foreground sm:text-3xl">
            Notes ke saath courses bhi try karo — revision aur samajh dono improve hogi.
          </h2>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/courses">
                <BookOpen className="size-4" />
                Explore courses
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20">
              <Link href="/register">
                Create free account
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </RetroPanel>
      </section>
    </div>
  );
}
