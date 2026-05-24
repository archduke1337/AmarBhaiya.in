import Link from "next/link";
import { ArrowRight, BookOpen, Download, Eye } from "lucide-react";
import { Button } from "@heroui/react";

import { getPublicNotesPageData } from "@/lib/appwrite/marketing-content";
import { requireAuth } from "@/lib/appwrite/auth";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  class?: string;
  subject?: string;
  note?: string;
}>;

export default async function StudentNotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAuth();
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
    <div className="flex flex-col gap-8 pb-[10vh]">
      <div className="flex flex-col gap-2">
        <p className="eyebrow self-start">Study Notes</p>
        <h1 className="text-[clamp(1.75rem,3vw,2.5rem)] font-black tracking-[-0.03em] leading-none">
          Notes jo actually revision ke time kaam aayein.
        </h1>
        <p className="max-w-2xl text-sm font-medium text-foreground/60 leading-relaxed mt-2">
          Yahan sirf wahi notes dikhte hain jo publish ho chuke hain. Class aur subject ke hisaab se filter karo.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-surface border border-border/40 rounded-2xl p-5 flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-foreground/50">Classes</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/app/notes"
                  className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold transition-colors ${!classFilter ? "bg-accent/10 text-accent" : "bg-surface-hover text-foreground/60 hover:text-foreground"}`}
                >
                  All
                </Link>
                {availableClasses.map((item) => (
                  <Link
                    key={item}
                    href={{ pathname: "/app/notes", query: { class: item, ...(subjectFilter ? { subject: subjectFilter } : {}) } }}
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
                  href={{ pathname: "/app/notes", query: { ...(classFilter ? { class: classFilter } : {}) } }}
                  className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold transition-colors ${!subjectFilter ? "bg-accent/10 text-accent" : "bg-surface-hover text-foreground/60 hover:text-foreground"}`}
                >
                  All
                </Link>
                {availableSubjects.map((item) => (
                  <Link
                    key={item}
                    href={{ pathname: "/app/notes", query: { ...(classFilter ? { class: classFilter } : {}), subject: item } }}
                    className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold transition-colors ${subjectFilter === item ? "bg-accent/10 text-accent" : "bg-surface-hover text-foreground/60 hover:text-foreground"}`}
                  >
                    {item}
                  </Link>
                ))}
              </div>
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
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-4">
            {filteredNotes.map((note) => (
              <Link
                key={note.id}
                href={{ pathname: "/app/notes", query: { ...(classFilter ? { class: classFilter } : {}), ...(subjectFilter ? { subject: subjectFilter } : {}), note: note.id } }}
                className={`block bg-surface border transition-all rounded-2xl p-5 ${selectedNote?.id === note.id ? "border-accent/50 bg-accent/[0.02]" : "border-border/40 hover:bg-surface-hover hover:border-border/60"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex flex-wrap gap-2">
                      {note.classTag && <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-surface-hover text-foreground/60">{note.classTag}</span>}
                      {note.subjectTag && <span className="text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-surface-hover text-foreground/60">{note.subjectTag}</span>}
                    </div>
                    <h2 className="text-lg font-black tracking-[-0.02em] group-hover:text-accent transition-colors">{note.title}</h2>
                    <p className="text-xs font-medium text-foreground/50">{note.description || "Clean study material ready for revision."}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-foreground/40">{note.downloadCount.toLocaleString("en-IN")} downloads</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="bg-surface border border-border/40 rounded-2xl p-5 xl:sticky xl:top-24 flex flex-col gap-5">
            {selectedNote ? (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
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
    </div>
  );
}
