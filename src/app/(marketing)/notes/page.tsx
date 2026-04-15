import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Download,
} from "lucide-react";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicNotesPageData } from "@/lib/appwrite/marketing-content";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Notes",
  description:
    "Chapter-wise study notes for Class 6 to 12 — Science, Maths, English, SST. Download, print, revise. By Amar Bhaiya.",
};

export const revalidate = 3600;

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
  const { notes } = await getPublicNotesPageData();

  return (
    <div className="space-y-16 px-4 py-8 md:px-6 md:py-10">

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl">
        <RetroPanel tone="card" size="lg" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Study Notes</Badge>
            <Badge variant="outline">Class 6–12</Badge>
            <Badge variant="ghost">Amar Bhaiya library</Badge>
          </div>

          <div className="space-y-5">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Resources
            </p>
            <h1 className="font-heading max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.08em] text-balance md:text-7xl">
              Chapter-wise notes that actually help during revision.
            </h1>
            <p className="max-w-2xl text-base font-medium leading-8 text-muted-foreground md:text-lg">
              Clean, focused, and built for revision. These are the kind of notes
              that help on a real study table: chapter-wise, easy to scan, and
              grounded in how Amar Bhaiya teaches. School notes are the first
              layer of the product, not an extra.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="#latest-notes">
                <Download className="size-4" />
                Browse latest notes
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/courses">
                <BookOpen className="size-4" />
                Browse courses
              </Link>
            </Button>
          </div>
        </RetroPanel>
      </section>

      {/* ── Class-wise Directory ────────────────────────────────── */}
      <section className="mx-auto max-w-7xl space-y-8">
        <SectionHeading
          eyebrow="Notes directory"
          title="Find notes by class and subject."
          description="This shows the school-first direction of the library. As more material is published, the live notes shelf below becomes the fastest way to access what is already ready."
        />

        <div className="space-y-6">
          {classGroups.map((group) => (
            <div key={group.label} className="space-y-4">
              <h3 className="font-heading text-lg font-black tracking-[-0.03em] text-muted-foreground">
                {group.label}
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.classes.map((cls) => (
                  <div
                    key={`${group.label}-${cls.grade}`}
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
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="latest-notes" className="mx-auto max-w-7xl space-y-8 scroll-mt-28">
        <SectionHeading
          eyebrow="Latest notes"
          title="Published notes show up here first."
          description="This is the independent notes shelf. Free published notes can be downloaded directly. Premium notes can still be surfaced here, but their access stays controlled."
        />

        {notes.length === 0 ? (
          <RetroPanel tone="muted" className="space-y-3">
            <h3 className="font-heading text-2xl font-black tracking-[-0.04em]">
              The first notes are on the way.
            </h3>
            <p className="text-sm font-medium leading-7 text-foreground/80">
              This shelf becomes the public home for independent notes as soon as Amar Bhaiya or other instructors publish them.
            </p>
          </RetroPanel>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {notes.map((note, index) => (
              <RetroPanel
                key={note.id}
                tone={index % 3 === 1 ? "accent" : index % 3 === 2 ? "secondary" : "card"}
                className="flex h-full flex-col gap-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline">{note.accessModel === "free" ? "Free note" : "Premium note"}</Badge>
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {note.downloadCount.toLocaleString("en-IN")} downloads
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-heading text-2xl font-black tracking-[-0.05em]">
                    {note.title}
                  </h3>
                  <p className="text-sm font-medium leading-7 text-foreground/80">
                    {note.description || "Revision material prepared to be used alongside class learning and self-study."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {note.tags.length > 0 ? (
                    note.tags.map((tag) => (
                      <Badge key={tag} variant="ghost">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="ghost">{note.instructorName}</Badge>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-border pt-4">
                  <div className="space-y-1">
                    <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                      Access
                    </p>
                    <p className="text-sm font-semibold">
                      {note.accessModel === "free" ? "Free download" : `INR ${note.priceInr}`}
                    </p>
                  </div>
                  {note.downloadUrl ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={note.downloadUrl} target="_blank" rel="noreferrer">
                        <Download className="size-4" />
                        Download
                      </a>
                    </Button>
                  ) : (
                    <Button asChild size="sm">
                      <Link href="/contact">Request access</Link>
                    </Button>
                  )}
                </div>
              </RetroPanel>
            ))}
          </div>
        )}
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
