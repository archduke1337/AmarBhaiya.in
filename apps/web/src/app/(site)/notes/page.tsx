import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

import { NoteDownloadButton } from "@/components/notes/note-download-button";

import { getPublicNotesPageData, formatResourceType } from "@/server/appwrite/marketing-content";
import { getLoggedInUser } from "@/server/appwrite/auth";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Free Study Notes — Class 6 to 12",
  description:
    "Free chapter-wise study notes for Class 6 to 12 students. Filter by class, subject, and type — sign in to download.",
  alternates: { canonical: "/notes" },
};

export const revalidate = 600;

type SearchParams = Promise<{
  class?: string;
  subject?: string;
  type?: string;
  note?: string;
}>;

function buildNotesHref(
  pathname: string,
  params: {
    type?: string;
    classTag?: string;
    subject?: string;
    note?: string;
  }
): string {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.classTag) query.set("class", params.classTag);
  if (params.subject) query.set("subject", params.subject);
  if (params.note) query.set("note", params.note);
  const qs = query.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export default async function PublicNotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getLoggedInUser();
  const params = await searchParams;
  const classFilter = typeof params.class === "string" ? params.class : "";
  const subjectFilter = typeof params.subject === "string" ? params.subject : "";
  const typeFilter = typeof params.type === "string" ? params.type : "";
  const selectedNoteId = typeof params.note === "string" ? params.note : "";

  const { notes } = await getPublicNotesPageData();

  const availableResourceTypes = Array.from(
    new Set(notes.map((note) => note.resourceType).filter(Boolean))
  ).sort();

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
    const typeMatch = !typeFilter || note.resourceType === typeFilter;
    return classMatch && subjectMatch && typeMatch;
  });

  const selectedNote =
    selectedNoteId ? filteredNotes.find((note) => note.id === selectedNoteId) ?? null : null;

  const currentHref = buildNotesHref("/notes", {
    type: typeFilter || undefined,
    classTag: classFilter || undefined,
    subject: subjectFilter || undefined,
    note: selectedNoteId || undefined,
  });

  return (
    <div className="site-container space-y-12 py-12 sm:py-16 xl:space-y-16 xl:py-20">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Study Notes"
          title="Free notes, organised by class"
          description="Chapter-wise notes for Class 6 to 12 students. Browse freely — create a free account to download and keep your place."
          titleAs="h1"
        />

        {!user && (
          <RetroPanel tone="secondary" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <p className="text-sm font-medium leading-7 text-foreground/80">
                Browsing is free for everyone. A free account is all you need to download notes.
              </p>
            </div>
            <Link
              href={`/login?redirect=${encodeURIComponent(currentHref)}`}
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground"
            >
              Sign in to download
            </Link>
          </RetroPanel>
        )}

        <div className="flex flex-col gap-5 rounded-2xl border border-border/40 bg-surface p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-3">
              <p className="site-kicker font-sans">Category</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildNotesHref("/notes", { type: undefined, classTag: classFilter || undefined, subject: subjectFilter || undefined })}
                  className={`inline-flex min-h-10 items-center rounded-xl px-3 py-1 text-xs font-bold transition-colors ${!typeFilter ? "bg-accent/10 text-accent" : "bg-surface-hover text-foreground/60 hover:text-foreground"}`}
                >
                  All
                </Link>
                {availableResourceTypes.map((item) => (
                  <Link
                    key={item}
                    href={buildNotesHref("/notes", { type: item, classTag: classFilter || undefined, subject: subjectFilter || undefined })}
                    className={`inline-flex min-h-10 items-center rounded-xl px-3 py-1 text-xs font-bold transition-colors ${typeFilter === item ? "bg-accent/10 text-accent" : "bg-surface-hover text-foreground/60 hover:text-foreground"}`}
                  >
                    {formatResourceType(item)}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="site-kicker font-sans">Classes</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildNotesHref("/notes", { type: typeFilter || undefined, classTag: undefined, subject: subjectFilter || undefined })}
                  className={`inline-flex min-h-10 items-center rounded-xl px-3 py-1 text-xs font-bold transition-colors ${!classFilter ? "bg-accent/10 text-accent" : "bg-surface-hover text-foreground/60 hover:text-foreground"}`}
                >
                  All
                </Link>
                {availableClasses.map((item) => (
                  <Link
                    key={item}
                    href={buildNotesHref("/notes", { type: typeFilter || undefined, classTag: item, subject: subjectFilter || undefined })}
                    className={`inline-flex min-h-10 items-center rounded-xl px-3 py-1 text-xs font-bold transition-colors ${classFilter === item ? "bg-accent/10 text-accent" : "bg-surface-hover text-foreground/60 hover:text-foreground"}`}
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="site-kicker font-sans">Subjects</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildNotesHref("/notes", { type: typeFilter || undefined, classTag: classFilter || undefined, subject: undefined })}
                  className={`inline-flex min-h-10 items-center rounded-xl px-3 py-1 text-xs font-bold transition-colors ${!subjectFilter ? "bg-accent/10 text-accent" : "bg-surface-hover text-foreground/60 hover:text-foreground"}`}
                >
                  All
                </Link>
                {availableSubjects.map((item) => (
                  <Link
                    key={item}
                    href={buildNotesHref("/notes", { type: typeFilter || undefined, classTag: classFilter || undefined, subject: item })}
                    className={`inline-flex min-h-10 items-center rounded-xl px-3 py-1 text-xs font-bold transition-colors ${subjectFilter === item ? "bg-accent/10 text-accent" : "bg-surface-hover text-foreground/60 hover:text-foreground"}`}
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl">
        {filteredNotes.length === 0 ? (
          <RetroPanel tone="muted" className="p-8 text-center">
            <h2 className="text-xl font-bold tracking-tight">No notes match these filters yet.</h2>
            <p className="text-sm font-medium text-foreground/60 mt-2">
              New notes are published regularly — check back soon or clear a filter.
            </p>
          </RetroPanel>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="flex flex-col gap-4">
              {filteredNotes.map((note) => (
                <Link
                  key={note.id}
                  href={buildNotesHref("/notes", {
                    type: typeFilter || undefined,
                    classTag: classFilter || undefined,
                    subject: subjectFilter || undefined,
                    note: note.id,
                  })}
                  className={`group block rounded-2xl border bg-surface p-4 transition-all sm:p-5 ${selectedNote?.id === note.id ? "border-accent/50 bg-accent/[0.02]" : "border-border/40 hover:bg-surface-hover hover:border-border/60"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-accent/10 text-accent">{formatResourceType(note.resourceType)}</span>
                        {note.classTag && <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-surface-hover text-foreground/60">{note.classTag}</span>}
                        {note.subjectTag && <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-surface-hover text-foreground/60">{note.subjectTag}</span>}
                      </div>
                      <h2 className="text-lg font-normal tracking-[-0.01em] group-hover:text-accent transition-colors">{note.title}</h2>
                      <p className="text-xs font-medium text-foreground/60">{note.description || "Clean study material ready for revision."}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-foreground/55">{note.downloadCount.toLocaleString("en-IN")} downloads</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="bg-surface border border-border/40 rounded-2xl p-5 xl:sticky xl:top-24 flex flex-col gap-5">
              {selectedNote ? (
                <>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-accent/10 text-accent">{formatResourceType(selectedNote.resourceType)}</span>
                      {selectedNote.classTag && <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-surface-hover text-foreground/60">{selectedNote.classTag}</span>}
                      {selectedNote.subjectTag && <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-surface-hover text-foreground/60">{selectedNote.subjectTag}</span>}
                      {selectedNote.chapterTag && <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-surface-hover text-foreground/60">{selectedNote.chapterTag}</span>}
                    </div>
                    <h2 className="text-xl font-normal tracking-[-0.02em]">{selectedNote.title}</h2>
                    <p className="text-sm font-medium text-foreground/60">{selectedNote.description || "Selected from the live notes library."}</p>
                  </div>

                  {selectedNote.accessModel === "paid" ? (
                    <div className="bg-surface-hover border border-dashed border-border/60 rounded-xl p-6 text-center flex flex-col items-center gap-3">
                      <Lock className="size-5 text-accent" aria-hidden="true" />
                      <p className="text-sm font-bold">Premium note</p>
                      <p className="text-sm font-medium text-foreground/60">
                        This note is paid (₹{selectedNote.priceInr.toLocaleString("en-IN")}) and is not
                        available for direct download yet.
                      </p>
                    </div>
                  ) : selectedNote.downloadUrl ? (
                    <div className="bg-surface-hover border border-dashed border-border/60 rounded-xl p-6 text-center flex flex-col items-center gap-4">
                      <p className="text-sm font-medium text-foreground/60">
                        Browser preview is not available — download the file and open it on your device.
                      </p>
                      {user ? (
                        <NoteDownloadButton
                          resourceId={selectedNote.id}
                          className="w-full rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground hover:bg-accent"
                        />
                      ) : (
                        <>
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground/60">
                            Free to download — sign in first
                          </p>
                          <Link
                            href={`/login?redirect=${encodeURIComponent(buildNotesHref("/notes", {
                              type: typeFilter || undefined,
                              classTag: classFilter || undefined,
                              subject: subjectFilter || undefined,
                              note: selectedNote.id,
                            }))}`}
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground"
                          >
                            <Lock className="size-4" aria-hidden="true" />
                            Sign in to download
                          </Link>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="bg-surface-hover border border-dashed border-border/60 rounded-xl p-6 text-center">
                      <p className="text-sm font-bold">This resource has no file attached yet.</p>
                      <p className="text-xs font-medium text-foreground/60 mt-1">The download will appear here once the file is uploaded.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm font-bold">Select a note to see its download panel.</p>
                  <p className="text-xs font-medium text-foreground/60 mt-1">Filter by class, subject, or type to find your chapter.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}