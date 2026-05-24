import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Download, Eye } from "lucide-react";
import { Button } from "@heroui/react";

import { getPublicNotesPageData, formatResourceType } from "@/lib/appwrite/marketing-content";

export const metadata: Metadata = {
  title: "Study Notes",
  description:
    "Published study notes from Amar Bhaiya and instructors. Filter, preview, and download from the live notes library.",
};

export const revalidate = 3600;

type SearchParams = Promise<{
  class?: string;
  subject?: string;
  note?: string;
}>;

export default async function NotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const classFilter = typeof params.class === "string" ? params.class : "";
  const subjectFilter = typeof params.subject === "string" ? params.subject : "";
  const selectedNoteId = typeof params.note === "string" ? params.note : "";

  const { notes } = await getPublicNotesPageData();

  const availableClasses = Array.from(
    new Set(notes.map((note) => note.classTag).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "en-IN", { numeric: true }));

  const availableSubjects = Array.from(
    new Set(
      notes
        .filter((note) => !classFilter || note.classTag === classFilter)
        .map((note) => note.subjectTag)
        .filter(Boolean)
    )
  ).sort();

  const filteredNotes = notes.filter((note) => {
    const classMatch = !classFilter || note.classTag === classFilter;
    const subjectMatch = !subjectFilter || note.subjectTag === subjectFilter;
    return classMatch && subjectMatch;
  });

  const selectedNote =
    filteredNotes.find((note) => note.id === selectedNoteId) ?? filteredNotes[0] ?? null;

  return (
    <div className="flex flex-col gap-12 px-4 py-8 md:px-6 md:py-10 max-w-7xl mx-auto">
      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr] xl:items-start">
        <div className="bg-surface border border-border/40 rounded-3xl p-6 md:p-8 flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-[0.05em] bg-accent/10 text-accent outline outline-1 outline-accent/20">Notes library</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-[0.05em] bg-surface-hover text-foreground/60 outline outline-1 outline-border">Published notes only</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-[0.05em] bg-surface-hover text-foreground/60 outline outline-1 outline-border">Preview + download</span>
          </div>

          <div className="flex flex-col gap-5">
            <p className="eyebrow self-start">Study notes</p>
            <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-black leading-[0.94] tracking-[-0.04em] text-balance">
              Notes jo actually revision ke time kaam aayein.
            </h1>
            <p className="max-w-2xl text-sm md:text-base font-medium text-foreground/60 leading-relaxed">
              Yahan sirf wahi notes dikhte hain jo actually publish ho chuke hain. Class aur subject ke hisaab se filter karo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="#notes-library">
              <Button variant="primary" size="lg" className="font-bold">
                <BookOpen className="size-4" />
                Notes library kholo
              </Button>
            </Link>
            <Link href="/courses">
              <Button variant="ghost" size="lg" className="font-bold">
                Courses dekho
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-surface border border-border/40 rounded-3xl p-6 md:p-8 flex flex-col gap-5 xl:translate-y-8">
          <p className="eyebrow self-start">How to use this</p>
          <div className="flex flex-col gap-3">
            {[
              "Class filter tab dikhega jab notes properly class ke saath tagged honge.",
              "Subject filter se revision fast ho jata hai, especially exam ke time.",
              "Free PDF notes ko browser mein preview karo, phir zarurat ho toh download kar lo.",
            ].map((item, index) => (
              <div
                key={item}
                className="bg-surface-hover border border-border/40 rounded-xl p-4"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-foreground/50">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-foreground/80">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="notes-library" className="flex flex-col gap-6 scroll-mt-28">
        <div className="flex flex-col gap-2">
          <p className="eyebrow self-start">Live notes</p>
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-black tracking-[-0.03em]">
            Class aur subject ke hisaab se filter karo, phir note kholo.
          </h2>
          <p className="text-sm font-medium text-foreground/60">
            Filters note ke actual tags se bante hain. Jitna better tagging hogi, library utni easy ho jayegi.
          </p>
        </div>

        <div className="bg-surface border border-border/40 rounded-2xl p-5 flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-foreground/50">Classes</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/notes"
                  className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold transition-colors ${!classFilter ? "bg-accent/10 text-accent" : "bg-surface-hover text-foreground/60 hover:text-foreground"}`}
                >
                  All
                </Link>
                {availableClasses.map((item) => (
                  <Link
                    key={item}
                    href={{ pathname: "/notes", query: { class: item, ...(subjectFilter ? { subject: subjectFilter } : {}) } }}
                    className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold transition-colors ${classFilter === item ? "bg-accent/10 text-accent" : "bg-surface-hover text-foreground/60 hover:text-foreground"}`}
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-foreground/50">Subjects</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={{ pathname: "/notes", query: { ...(classFilter ? { class: classFilter } : {}) } }}
                  className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold transition-colors ${!subjectFilter ? "bg-accent/10 text-accent" : "bg-surface-hover text-foreground/60 hover:text-foreground"}`}
                >
                  All
                </Link>
                {availableSubjects.map((item) => (
                  <Link
                    key={item}
                    href={{ pathname: "/notes", query: { ...(classFilter ? { class: classFilter } : {}), subject: item } }}
                    className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold transition-colors ${subjectFilter === item ? "bg-accent/10 text-accent" : "bg-surface-hover text-foreground/60 hover:text-foreground"}`}
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="bg-surface border border-dashed border-border/60 rounded-2xl p-8 text-center">
            <h2 className="text-xl font-bold tracking-tight">Is filter combo ke liye abhi notes live nahi hain.</h2>
            <p className="text-sm font-medium text-foreground/60 mt-2">Jaise hi publish honge, yahin aa jayenge.</p>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
            <div className="flex flex-col gap-4">
              {filteredNotes.map((note) => (
                <Link
                  key={note.id}
                  href={{ pathname: "/notes", query: { ...(classFilter ? { class: classFilter } : {}), ...(subjectFilter ? { subject: subjectFilter } : {}), note: note.id } }}
                  className={`block bg-surface border transition-all rounded-2xl p-5 ${selectedNote?.id === note.id ? "border-accent/50 bg-accent/[0.02]" : "border-border/40 hover:bg-surface-hover hover:border-border/60"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-accent/10 text-accent">{formatResourceType(note.resourceType)}</span>
                        {note.classTag && <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-surface-hover text-foreground/60">{note.classTag}</span>}
                        {note.subjectTag && <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-surface-hover text-foreground/60">{note.subjectTag}</span>}
                      </div>
                      <h2 className="text-lg font-black tracking-[-0.02em]">{note.title}</h2>
                      <p className="text-xs font-medium text-foreground/50">{note.description || "Clean study material ready for revision."}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-foreground/40">{note.downloadCount.toLocaleString("en-IN")} downloads</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="bg-surface border border-border/40 rounded-2xl p-5 xl:sticky xl:top-28 flex flex-col gap-5">
              {selectedNote ? (
                <>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-accent/10 text-accent">{formatResourceType(selectedNote.resourceType)}</span>
                      {selectedNote.classTag && <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-surface-hover text-foreground/60">{selectedNote.classTag}</span>}
                      {selectedNote.subjectTag && <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-surface-hover text-foreground/60">{selectedNote.subjectTag}</span>}
                      {selectedNote.chapterTag && <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-surface-hover text-foreground/60">{selectedNote.chapterTag}</span>}
                    </div>
                    <h2 className="text-xl font-black tracking-[-0.03em]">{selectedNote.title}</h2>
                    <p className="text-sm font-medium text-foreground/60">{selectedNote.description || "Yeh note live library se selected hai."}</p>
                  </div>

                  {selectedNote.viewUrl ? (
                    <div className="overflow-hidden rounded-xl border border-border/40">
                      <iframe
                        title={selectedNote.title}
                        src={selectedNote.viewUrl}
                        className="h-[60dvh] min-h-[20rem] w-full bg-white"
                      />
                    </div>
                  ) : (
                    <div className="bg-surface-hover border border-dashed border-border/60 rounded-xl p-6 text-center">
                      <p className="text-sm font-bold">Browser preview abhi available nahi hai.</p>
                      <p className="text-xs font-medium text-foreground/50 mt-1">Download option available ho toh wahan se open kar lo.</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {selectedNote.downloadUrl && (
                      <a href={selectedNote.downloadUrl} target="_blank" rel="noreferrer">
                        <Button variant="primary" size="sm" className="font-bold">
                          <Download className="size-4" />
                          Download note
                        </Button>
                      </a>
                    )}
                    <Link href="/courses">
                      <Button variant="ghost" size="sm" className="font-bold">
                        Related courses
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm font-bold">Preview karne ke liye note select karo.</p>
                  <p className="text-xs font-medium text-foreground/50 mt-1">Jab real notes available hote hain, unka browser preview yahin dikhaya jata hai.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
