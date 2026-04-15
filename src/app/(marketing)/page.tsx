import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Download,
  Sparkles,
  Video,
} from "lucide-react";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getHomePageContent,
  getPublicCoursesPageData,
  getPublicNotesPageData,
  type PublicCourseListItem,
} from "@/lib/appwrite/marketing-content";

export const revalidate = 3600;

function MetricTile({
  value,
  label,
  suffix,
}: {
  value: number;
  label: string;
  suffix: string;
}) {
  return (
    <RetroPanel tone="card" className="space-y-2">
      <p className="font-heading text-4xl font-black tracking-[-0.08em] md:text-5xl">
        {value.toLocaleString("en-IN")}
        {suffix}
      </p>
      <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
    </RetroPanel>
  );
}

function inferTrack(course: PublicCourseListItem): "school" | "skills" | "general" {
  const values = [course.title, course.category, ...course.tags].map((item) =>
    item.toLowerCase()
  );

  if (
    values.some((value) => /\b(?:class|grade|std)\s*(6|7|8|9|10|11|12)\b/.test(value))
  ) {
    return "school";
  }

  if (
    values.some((value) =>
      [
        "board",
        "cbse",
        "science",
        "maths",
        "english",
        "sst",
        "physics",
        "chemistry",
        "biology",
        "accountancy",
        "economics",
      ].some((token) => value.includes(token))
    )
  ) {
    return "school";
  }

  if (
    values.some((value) =>
      [
        "skill",
        "coding",
        "career",
        "interview",
        "programming",
        "communication",
        "finance",
        "development",
        "professional",
      ].some((token) => value.includes(token))
    )
  ) {
    return "skills";
  }

  return "general";
}

function CourseShelf({
  title,
  description,
  courses,
}: {
  title: string;
  description: string;
  courses: PublicCourseListItem[];
}) {
  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <SectionHeading
        eyebrow="Course shelf"
        title={title}
        description={description}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Link key={course.id} href={`/courses/${course.slug}`} className="group">
            <RetroPanel
              tone={course.accessModel === "free" ? "secondary" : "card"}
              size="lg"
              className="flex h-full flex-col gap-5 transition-transform duration-200 group-hover:-translate-y-1"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="outline">{course.category}</Badge>
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {course.enrolledStudents.toLocaleString("en-IN")} learners
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="font-heading text-2xl font-black leading-[0.95] tracking-[-0.05em]">
                  {course.title}
                </h3>
                <p className="line-clamp-3 text-sm font-medium leading-7 text-foreground/80">
                  {course.shortDescription}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-card)] px-3 py-3 shadow-retro-sm">
                  <p className="mb-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    Lessons
                  </p>
                  <p className="font-bold">{course.totalLessons}</p>
                </div>
                <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-card)] px-3 py-3 shadow-retro-sm">
                  <p className="mb-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    Hours
                  </p>
                  <p className="font-bold">{course.totalDurationHours}</p>
                </div>
                <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-card)] px-3 py-3 shadow-retro-sm">
                  <p className="mb-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    Price
                  </p>
                  <p className="font-bold">
                    {course.priceInr === 0 ? "Free" : `INR ${course.priceInr}`}
                  </p>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between border-t-2 border-border pt-4">
                <span className="text-sm font-semibold text-muted-foreground">
                  {course.accessModel === "free" ? "Start freely" : "Structured path"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-black uppercase tracking-[0.1em]">
                  Explore
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </RetroPanel>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function LandingPage() {
  const [homeContent, notesContent, coursesData] = await Promise.all([
    getHomePageContent(),
    getPublicNotesPageData({ limit: 4 }),
    getPublicCoursesPageData({ sort: "popular" }),
  ]);

  const schoolCourses = coursesData.courses
    .filter((course) => inferTrack(course) === "school")
    .slice(0, 6);
  const skillCourses = coursesData.courses
    .filter((course) => inferTrack(course) === "skills")
    .slice(0, 3);

  return (
    <div className="space-y-16 px-4 py-8 md:px-6 md:py-10">
      <section className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
        <RetroPanel tone="card" size="lg" className="space-y-8">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Padhai Karo Apne Tareeke Se</Badge>
            <Badge variant="secondary">School-first</Badge>
            <Badge variant="ghost">Notes, courses, live help</Badge>
          </div>

          <div className="space-y-5">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Learn from Amar Bhaiya
            </p>
            <h1 className="font-heading max-w-4xl text-4xl font-black leading-[0.94] tracking-[-0.08em] text-balance sm:text-5xl md:text-6xl xl:text-7xl">
              Padhai ko thoda simple, thoda honest, aur kaafi zyada useful banana tha. Isliye yeh platform bana.
            </h1>
            <p className="max-w-2xl text-sm font-medium leading-8 text-muted-foreground sm:text-base md:text-lg">
              Yahan Class 6 se 12 tak ki padhai pehle aati hai. Notes,
              board-focused courses, revision support, aur seedha samjhaane wala
              teaching style uske centre mein hai. Skills aur career waale
              tracks bhi hain, lekin school journey ko side pe karke nahi.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/notes">
                <Download className="size-4" />
                Notes kholo
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/courses">
                Courses dekho
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">Free account banao</Link>
            </Button>
          </div>
        </RetroPanel>

        <div className="grid gap-4">
          <RetroPanel tone="secondary" size="lg" className="grid gap-4 sm:grid-cols-[0.86fr_1.14fr] sm:items-center">
            <div className="space-y-3">
              <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Amar Bhaiya
              </p>
              <h2 className="font-heading text-3xl font-black tracking-[-0.05em]">
                Real guidance. No coaching-noise drama.
              </h2>
              <p className="text-sm font-medium leading-7 text-foreground/80">
                Platform ka mood bhi wahi hai jo teaching ka hai: seedha, garam,
                aur student ke favour mein.
              </p>
            </div>
            <div className="overflow-hidden rounded-[calc(var(--radius)+6px)] border-2 border-border bg-[color:var(--surface-card)] shadow-retro-sm">
              <Image
                src="/AMAR BHAIYA.png"
                alt="Amar Bhaiya"
                width={720}
                height={720}
                priority
                className="aspect-square w-full object-cover"
              />
            </div>
          </RetroPanel>

          <div className="grid grid-cols-2 gap-4">
            {homeContent.stats.map((item) => (
              <MetricTile
                key={item.label}
                value={item.end}
                label={item.label}
                suffix={item.suffix}
              />
            ))}
          </div>
        </div>
      </section>

      {schoolCourses.length > 0 ? (
        <CourseShelf
          title="School courses that match what students are actually trying to clear right now."
          description="Yeh section only real published Appwrite courses se aata hai. Agar school catalogue grow karega, yahin se sabse pehle dikhega."
          courses={schoolCourses}
        />
      ) : null}

      {notesContent.notes.length > 0 ? (
        <section className="mx-auto max-w-7xl space-y-6">
          <SectionHeading
            eyebrow="Study notes"
            title="Kabhi kabhi ek achha note hi student ko wapas track pe le aata hai."
            description="Independent notes homepage par dikhne chahiye, kyunki kai students ke liye wahi pehla reason hota hai dobara lautne ka."
          />

          <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
            <RetroPanel tone="secondary" size="lg" className="space-y-5">
              <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Why notes matter
              </p>
              <h3 className="font-heading text-3xl font-black leading-[0.95] tracking-[-0.06em]">
                Student ko bina enroll kiye bhi help milni chahiye.
              </h3>
              <p className="text-sm font-medium leading-7 text-foreground/80">
                Agar koi pehli baar aaya hai aur ek note khol ke genuinely help
                feel karta hai, wahi trust ka start hota hai.
              </p>
              <Button asChild size="lg" variant="outline">
                <Link href="/notes">
                  Notes library kholo
                  <ArrowRight />
                </Link>
              </Button>
            </RetroPanel>

            <div className="grid gap-4 md:grid-cols-2">
              {notesContent.notes.map((note, index) => (
                <RetroPanel
                  key={note.id}
                  tone={index === 1 ? "accent" : "card"}
                  className="flex h-full flex-col gap-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline">
                      {note.classTag || note.subjectTag || "Independent note"}
                    </Badge>
                    <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {note.downloadCount.toLocaleString("en-IN")} downloads
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-heading text-2xl font-black tracking-[-0.05em]">
                      {note.title}
                    </h3>
                    <p className="text-sm font-medium leading-7 text-foreground/80">
                      {note.description || "Revision ke waqt kaam aane wala seedha, useful note."}
                    </p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {[note.subjectTag, note.chapterTag, ...note.tags].filter(Boolean).slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="ghost">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </RetroPanel>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-7xl">
          <RetroPanel tone="muted" size="lg" className="space-y-3">
            <h2 className="font-heading text-2xl font-black tracking-[-0.04em]">
              Notes shelf abhi fill ho rahi hai.
            </h2>
            <p className="max-w-3xl text-sm font-medium leading-7 text-foreground/80">
              Jaise hi Amar Bhaiya ya guest instructors real notes publish karenge,
              woh yahin dikhenge. Abhi ke liye directly courses explore kar sakte ho.
            </p>
          </RetroPanel>
        </section>
      )}

      {skillCourses.length > 0 ? (
        <CourseShelf
          title="Skill tracks for college students, freshers, and working learners."
          description="Yeh secondary layer hai. Sirf wahi dikhega jo Appwrite mein real published skill course ke form mein available hai."
          courses={skillCourses}
        />
      ) : null}

      {homeContent.domains.length > 0 ? (
        <section className="mx-auto max-w-7xl space-y-6">
          <SectionHeading
            eyebrow="Learning areas"
            title="Platform kis direction mein grow kar raha hai."
            description="Yeh blocks bhi Appwrite-backed site copy se aate hain. Agar backend mein configured nahi hain, yeh section hide ho jata hai."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {homeContent.domains.map((item) => (
              <RetroPanel key={item.title} tone="muted" className="space-y-3">
                <p className="font-heading text-xl font-black tracking-[-0.04em]">
                  {item.title}
                </p>
                <p className="text-sm font-medium leading-7 text-muted-foreground">
                  {item.sub}
                </p>
              </RetroPanel>
            ))}
          </div>
        </section>
      ) : null}

      {homeContent.whyItems.length > 0 ? (
        <section className="mx-auto max-w-7xl space-y-6">
          <SectionHeading
            eyebrow="Why learn here"
            title="Reason sirf content ka nahi hota. Feeling ka bhi hota hai."
            description="Agar Appwrite mein genuine positioning blocks configured hain, woh yahin se show hote hain."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {homeContent.whyItems.map((item, index) => (
              <RetroPanel
                key={item.title}
                tone={index % 2 === 0 ? "accent" : "card"}
                className="space-y-3"
              >
                <Sparkles className="size-5 text-primary" />
                <h3 className="font-heading text-base font-black tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="text-sm font-medium leading-7 text-muted-foreground">
                  {item.body}
                </p>
              </RetroPanel>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl">
        <RetroPanel tone="brand" size="lg" className="space-y-8 text-center">
          <div className="mx-auto max-w-3xl space-y-5">
            <h2 className="mx-auto font-heading text-4xl font-black leading-[0.92] tracking-[-0.06em] text-primary-foreground md:text-6xl">
              Start chhota rakho. Consistency badi ho jayegi.
            </h2>
            <p className="mx-auto max-w-2xl text-base font-medium leading-8 text-primary-foreground/80">
              Ek note kholo. Ek lesson dekho. Phir dekhna flow kaise banne lagta
              hai. Platform ka kaam overwhelm karna nahi, momentum dilana hai.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/notes">
                <Download className="size-4" />
                Notes explore karo
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Link href="/courses">
                <BookOpen className="size-4" />
                Courses dekho
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </RetroPanel>
      </section>
    </div>
  );
}
