import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Download, Eye } from "lucide-react";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicNotesPageData } from "@/lib/appwrite/marketing-content";

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
    <div className="space-y-16 px-4 py-8 md:px-6 md:py-10">
      <section className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.02fr_0.98fr] xl:items-start">
        <RetroPanel tone="card" size="lg" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Notes library</Badge>
            <Badge variant="outline">Published notes only</Badge>
            <Badge variant="ghost">Preview + download</Badge>
          </div>

          <div className="space-y-5">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Study notes
            </p>
            <h1 className="font-heading max-w-4xl text-4xl font-black leading-[0.94] tracking-[-0.08em] text-balance sm:text-5xl md:text-6xl">
              Notes jo actually revision ke time kaam aayein.
            </h1>
            <p className="max-w-2xl text-sm font-medium leading-8 text-muted-foreground sm:text-base md:text-lg">
              Yahan sirf wahi notes dikhte hain jo actually publish ho chuke
              hain. Agar class, subject, ya chapter tags missing hain, page
              guess nahi karta. Jo clear hai, wahi saamne rakhta hai.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="#notes-library">
                <BookOpen className="size-4" />
                Notes library kholo
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/courses">
                Courses dekho
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </RetroPanel>

        <RetroPanel tone="secondary" size="lg" className="space-y-5 xl:translate-y-8">
          <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
            How to use this
          </p>
          <div className="grid gap-3">
            {[
              "Class filter tab dikhega jab notes properly class ke saath tagged honge.",
              "Subject filter se revision fast ho jata hai, especially exam ke time.",
              "Free PDF notes ko browser mein preview karo, phir zarurat ho toh download kar lo.",
            ].map((item, index) => (
              <div
                key={item}
                className="rounded-[calc(var(--radius)+4px)] border-2 border-border bg-[color:var(--surface-card)] px-4 py-4 shadow-retro-sm"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-sm font-medium leading-7 text-foreground/80">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </RetroPanel>
      </section>

      <section id="notes-library" className="mx-auto max-w-7xl space-y-6 scroll-mt-28">
        <SectionHeading
          eyebrow="Live notes"
          title="Class aur subject ke hisaab se filter karo, phir note kholo."
          description="Filters note ke actual tags se bante hain. Jitna better tagging hogi, library utni easy ho jayegi."
        />

        <RetroPanel tone="accent" className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Classes
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge asChild variant={!classFilter ? "secondary" : "outline"}>
                  <Link href="/notes">All</Link>
                </Badge>
                {availableClasses.map((item) => (
                  <Badge
                    key={item}
                    asChild
                    variant={classFilter === item ? "secondary" : "outline"}
                  >
                    <Link
                      href={{
                        pathname: "/notes",
                        query: { class: item, ...(subjectFilter ? { subject: subjectFilter } : {}) },
                      }}
                    >
                      {item}
                    </Link>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Subjects
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  asChild
                  variant={!subjectFilter ? "ghost" : "outline"}
                >
                  <Link
                    href={{
                      pathname: "/notes",
                      query: { ...(classFilter ? { class: classFilter } : {}) },
                    }}
                  >
                    All
                  </Link>
                </Badge>
                {availableSubjects.map((item) => (
                  <Badge
                    key={item}
                    asChild
                    variant={subjectFilter === item ? "ghost" : "outline"}
                  >
                    <Link
                      href={{
                        pathname: "/notes",
                        query: {
                          ...(classFilter ? { class: classFilter } : {}),
                          subject: item,
                        },
                      }}
                    >
                      {item}
                    </Link>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </RetroPanel>

        {filteredNotes.length === 0 ? (
          <RetroPanel tone="muted" size="lg" className="space-y-3">
            <h2 className="font-heading text-2xl font-black tracking-[-0.04em]">
              Is filter combo ke liye abhi notes live nahi hain.
            </h2>
            <p className="max-w-3xl text-sm font-medium leading-7 text-foreground/80">
              Iska matlab bas itna hai ki is class-subject combo ke liye notes
              abhi live nahi hue. Jaise hi publish honge, woh yahin aa jayenge.
            </p>
          </RetroPanel>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <RetroPanel
                  key={note.id}
                  tone={selectedNote?.id === note.id ? "secondary" : "card"}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      {note.classTag ? <Badge variant="outline">{note.classTag}</Badge> : null}
                      {note.subjectTag ? <Badge variant="ghost">{note.subjectTag}</Badge> : null}
                    </div>
                    <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {note.downloadCount.toLocaleString("en-IN")} downloads
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">
                      {note.title}
                    </h2>
                    <p className="text-sm font-medium leading-7 text-foreground/80">
                      {note.description || "Clean study material ready for revision."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[note.chapterTag, ...note.tags].filter(Boolean).slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={{
                          pathname: "/notes",
                          query: {
                            ...(classFilter ? { class: classFilter } : {}),
                            ...(subjectFilter ? { subject: subjectFilter } : {}),
                            note: note.id,
                          },
                        }}
                      >
                        <Eye className="size-4" />
                        Preview
                      </Link>
                    </Button>
                    {note.downloadUrl ? (
                      <Button asChild size="sm">
                        <a href={note.downloadUrl} target="_blank" rel="noreferrer">
                          <Download className="size-4" />
                          Download
                        </a>
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="secondary">
                        <Link href="/contact">Request access</Link>
                      </Button>
                    )}
                  </div>
                </RetroPanel>
              ))}
            </div>

            <RetroPanel tone="card" size="lg" className="space-y-4 xl:sticky xl:top-28">
              {selectedNote ? (
                <>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {selectedNote.classTag ? (
                        <Badge variant="outline">{selectedNote.classTag}</Badge>
                      ) : null}
                      {selectedNote.subjectTag ? (
                        <Badge variant="ghost">{selectedNote.subjectTag}</Badge>
                      ) : null}
                      {selectedNote.chapterTag ? (
                        <Badge variant="outline">{selectedNote.chapterTag}</Badge>
                      ) : null}
                    </div>
                    <h2 className="font-heading text-3xl font-black tracking-[-0.05em]">
                      {selectedNote.title}
                    </h2>
                    <p className="text-sm font-medium leading-7 text-muted-foreground">
                      {selectedNote.description || "Yeh note live library se selected hai."}
                    </p>
                  </div>

                  {selectedNote.viewUrl ? (
                    <div className="overflow-hidden rounded-[calc(var(--radius)+4px)] border-2 border-border bg-[color:var(--surface-ink)] shadow-retro-sm">
                      <iframe
                        title={selectedNote.title}
                        src={selectedNote.viewUrl}
                        className="h-[70dvh] min-h-[28rem] w-full bg-white"
                      />
                    </div>
                  ) : (
                    <RetroPanel tone="muted" className="space-y-3">
                      <h3 className="font-heading text-xl font-black tracking-[-0.04em]">
                        Browser preview abhi available nahi hai.
                      </h3>
                      <p className="text-sm font-medium leading-7 text-foreground/80">
                        Yeh usually paid access ya non-PDF file ki wajah se hota hai. Download option available ho toh wahan se open kar lo.
                      </p>
                    </RetroPanel>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {selectedNote.downloadUrl ? (
                      <Button asChild>
                        <a href={selectedNote.downloadUrl} target="_blank" rel="noreferrer">
                          <Download className="size-4" />
                          Download note
                        </a>
                      </Button>
                    ) : (
                      <Button asChild variant="secondary">
                        <Link href="/contact">Access request bhejo</Link>
                      </Button>
                    )}
                    <Button asChild variant="outline">
                      <Link href="/courses">Related courses dekho</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <RetroPanel tone="muted" className="space-y-3">
                  <h2 className="font-heading text-2xl font-black tracking-[-0.04em]">
                    Preview karne ke liye note select karo.
                  </h2>
                  <p className="text-sm font-medium leading-7 text-foreground/80">
                    Jab real notes available hote hain, unka browser preview yahin dikhaya jata hai.
                  </p>
                </RetroPanel>
              )}
            </RetroPanel>
          </div>
        )}
      </section>
    </div>
  );
}
