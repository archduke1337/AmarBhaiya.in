import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Download,
  FileText,
  GraduationCap,
} from "lucide-react";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Notes",
  description:
    "Chapter-wise study notes for Class 6 to 12 — Science, Maths, English, SST. Download, print, revise. By Amar Bhaiya.",
};

export const revalidate = 3600;

// Notes are resources attached to courses in the backend.
// This page is a structured directory that links into the course system.
// As instructors upload resources, they surface here.

const classGroups = [
  {
    label: "Middle School",
    classes: [
      { grade: "6", subjects: ["Science", "Maths", "English", "SST"] },
      { grade: "7", subjects: ["Science", "Maths", "English", "SST"] },
      { grade: "8", subjects: ["Science", "Maths", "English", "SST"] },
    ],
  },
  {
    label: "Secondary",
    classes: [
      { grade: "9", subjects: ["Science", "Maths", "English", "SST"] },
      { grade: "10", subjects: ["Science", "Maths", "English", "SST"] },
    ],
  },
  {
    label: "Senior Secondary — Science",
    classes: [
      { grade: "11", subjects: ["Physics", "Chemistry", "Maths", "Biology"] },
      { grade: "12", subjects: ["Physics", "Chemistry", "Maths", "Biology"] },
    ],
  },
  {
    label: "Senior Secondary — Commerce",
    classes: [
      { grade: "11", subjects: ["Accountancy", "BST", "Economics"] },
      { grade: "12", subjects: ["Accountancy", "BST", "Economics"] },
    ],
  },
];

export default async function NotesPage() {
  return (
    <div className="space-y-16 px-4 py-8 md:px-6 md:py-10">

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl">
        <RetroPanel tone="card" size="lg" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Study Notes</Badge>
            <Badge variant="outline">Class 6–12</Badge>
          </div>

          <div className="space-y-5">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Resources
            </p>
            <h1 className="font-heading max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.08em] text-balance md:text-7xl">
              Chapter-wise notes that actually help during revision.
            </h1>
            <p className="max-w-2xl text-base font-medium leading-8 text-muted-foreground md:text-lg">
              Clean, focused, and organized by chapter. Made for students who
              want to revise efficiently — not wade through 50 pages of
              filler. Notes are added as courses get built, so this library
              keeps growing.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/courses">
                <BookOpen className="size-4" />
                Browse courses with notes
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">Create free account</Link>
            </Button>
          </div>
        </RetroPanel>
      </section>

      {/* ── Class-wise Directory ────────────────────────────────── */}
      <section className="mx-auto max-w-7xl space-y-8">
        <SectionHeading
          eyebrow="Notes directory"
          title="Find notes by class and subject."
          description="Notes are attached to courses. As Bhaiya builds out each course, the chapter-wise notes become available here."
        />

        <div className="space-y-6">
          {classGroups.map((group) => (
            <div key={group.label} className="space-y-4">
              <h3 className="font-heading text-lg font-black tracking-[-0.03em] text-muted-foreground">
                {group.label}
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.classes.map((cls) => (
                  <Link
                    key={`${group.label}-${cls.grade}`}
                    href={`/courses?class=${cls.grade}`}
                    className="group"
                  >
                    <RetroPanel
                      tone="card"
                      className="flex items-start gap-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-retro-lg"
                    >
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-[calc(var(--radius)+4px)] border-2 border-border bg-primary font-heading text-xl font-black text-primary-foreground shadow-retro-sm">
                        {cls.grade}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="font-heading text-base font-black tracking-[-0.02em]">
                          Class {cls.grade}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {cls.subjects.map((sub) => (
                            <Badge key={sub} variant="outline">
                              {sub}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </RetroPanel>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How notes work ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl">
        <RetroPanel tone="secondary" size="lg" className="space-y-8">
          <SectionHeading
            eyebrow="How it works"
            title="Notes are part of the course system."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Pick a course",
                body: "Each course covers a class + subject combination. Notes sit alongside the video lessons.",
              },
              {
                step: "2",
                title: "Access chapter notes",
                body: "Every module has downloadable notes — PDFs you can print, annotate, and carry to your study table.",
              },
              {
                step: "3",
                title: "Pair with video",
                body: "Watch the lesson, read the note, attempt the quiz. That loop is what makes the material stick.",
              },
            ].map((item) => (
              <div key={item.step} className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-full border-2 border-border bg-card font-heading text-base font-black shadow-retro-sm">
                  {item.step}
                </div>
                <h3 className="font-heading text-lg font-black tracking-[-0.03em]">
                  {item.title}
                </h3>
                <p className="text-sm font-medium leading-7 text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </RetroPanel>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl">
        <RetroPanel tone="brand" size="lg" className="space-y-6 text-center">
          <div className="mx-auto max-w-3xl space-y-5">
            <h2 className="mx-auto font-heading text-3xl font-black leading-[0.92] tracking-[-0.06em] text-primary-foreground md:text-5xl">
              Notes get better when paired with courses.
            </h2>
            <p className="mx-auto max-w-xl text-base font-medium leading-8 text-primary-foreground/80">
              Create a free account to track your progress, access quizzes,
              and join live doubt-clearing sessions alongside the notes.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/courses">
                <BookOpen className="size-4" />
                Browse courses
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
