import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Download,
  FileText,
  GraduationCap,
  Heart,
  Lightbulb,
  MessageCircle,
  PlayCircle,
  Sparkles,
  Star,
  Users,
  Video,
} from "lucide-react";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHomePageContent } from "@/lib/appwrite/marketing-content";

export const revalidate = 3600;

const classGrades = [
  { grade: "6", label: "Class 6", subjects: "Science, Maths, English" },
  { grade: "7", label: "Class 7", subjects: "Science, Maths, SST" },
  { grade: "8", label: "Class 8", subjects: "Science, Maths, English" },
  { grade: "9", label: "Class 9", subjects: "Science, Maths, SST, English" },
  { grade: "10", label: "Class 10", subjects: "Board Prep, Science, Maths" },
  { grade: "11", label: "Class 11", subjects: "Physics, Chemistry, Maths, Bio" },
  { grade: "12", label: "Class 12", subjects: "Board + Competitive Prep" },
];

const skillsCourses = [
  {
    title: "Coding & Web Dev",
    desc: "HTML, CSS, JavaScript, React — build real projects, not just watch tutorials.",
    icon: Lightbulb,
  },
  {
    title: "Career & Interviews",
    desc: "Resume building, interview prep, and honest career guidance for the Indian job market.",
    icon: GraduationCap,
  },
  {
    title: "Communication",
    desc: "English speaking, presentation skills, and confidence — practical, not theoretical.",
    icon: MessageCircle,
  },
  {
    title: "Personal Finance",
    desc: "Saving, investing basics, understanding money early — things school doesn't teach.",
    icon: Star,
  },
];

const platformFeatures = [
  {
    title: "Video Lessons",
    desc: "Clear explanations in Hindi + English, at your own pace.",
    icon: PlayCircle,
  },
  {
    title: "Free Study Notes",
    desc: "Chapter-wise notes you can download, print, and revise from.",
    icon: FileText,
  },
  {
    title: "Live Doubt Sessions",
    desc: "Ask questions directly during live sessions — no hesitation needed.",
    icon: Video,
  },
  {
    title: "Community Support",
    desc: "Connect with other students, share notes, and help each other out.",
    icon: Users,
  },
];

export default async function LandingPage() {
  const homeContent = await getHomePageContent();

  return (
    <div className="space-y-20 px-4 pb-12 pt-6 md:space-y-28 md:px-6 md:pt-8">

      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl text-center">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary">Class 6 – 12</Badge>
            <Badge variant="outline">Skill Courses</Badge>
            <Badge variant="ghost">Free Notes</Badge>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
            Padhai simple honi chahiye.{" "}
            <span className="text-primary">Bhaiya hai na.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
            Main Amarnath hoon — class 6 se 12th tak ka syllabus, coding, career guidance,
            aur real-life skills — sab ek jagah. Free notes. Video lessons. Live sessions.
            Aur haan, doubt poochne mein koi sharam nahi.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/register">
                Start free
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/courses">
                <BookOpen className="size-4" />
                Browse courses
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/notes">
                <Download className="size-4" />
                Free notes
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mx-auto mt-12 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4 sm:max-w-2xl">
          {homeContent.stats.map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-2xl font-black tracking-tight sm:text-3xl">
                {item.end.toLocaleString("en-IN")}
                <span className="text-primary">{item.suffix}</span>
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Class-wise Courses (Primary Audience) ────────────────── */}
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="School Courses"
          title="Class 6 to 12 — chapter by chapter, exam by exam."
          description="Jo class mein samajh nahi aaya, woh yahan se samjho. Syllabus ke saath chalte hain, exam ke liye tayyar karte hain."
          titleAs="h2"
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {classGrades.map((item) => (
            <Link
              key={item.grade}
              href={`/courses?category=class-${item.grade}`}
              className="group"
            >
              <RetroPanel
                tone="card"
                className="flex items-center gap-4 transition-all group-hover:shadow-retro-lg group-hover:-translate-y-0.5"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading text-lg font-black text-primary">
                  {item.grade}
                  <span className="text-[0.55rem] text-muted-foreground">th</span>
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-base font-black">{item.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.subjects}</p>
                </div>
                <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </RetroPanel>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Free Study Notes (Prominent) ─────────────────────────── */}
      <section className="mx-auto max-w-6xl">
        <RetroPanel tone="accent" size="lg" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-4">
              <SectionHeading
                eyebrow="Free Notes"
                title="Notes download karo, revise karo, top karo."
                description="Har chapter ke handwritten-style notes — clean, to the point, aur bilkul free. Board exams ke liye bane hain, tuition ki zaroorat nahi."
                titleAs="h2"
              />
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/notes">
                    <Download className="size-4" />
                    Browse all notes
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/register">
                    Get updates on new notes
                  </Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="grid grid-cols-2 gap-2">
                {["Science", "Maths", "English", "SST"].map((subject) => (
                  <div
                    key={subject}
                    className="rounded-lg border border-border bg-card p-4 text-center"
                  >
                    <FileText className="mx-auto size-6 text-primary" />
                    <p className="mt-2 text-xs font-bold">{subject}</p>
                    <p className="text-[10px] text-muted-foreground">Notes ready</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RetroPanel>
      </section>

      {/* ─── Who is Amar Bhaiya? (Connection Section) ─────────────── */}
      <section className="mx-auto max-w-5xl">
        <RetroPanel tone="secondary" size="lg" className="space-y-5">
          <div className="flex items-center gap-3">
            <Heart className="size-5 text-primary" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              The person behind this
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              I am not a coaching institute. I am your bhaiya who figured things out the hard way.
            </h2>
            <div className="max-w-2xl space-y-3 text-sm font-medium leading-relaxed text-foreground/80 sm:text-base">
              <p>
                Mujhe bhi wahi problems face karni padi jo aap kar rahe ho — confusing syllabus,
                expensive tuitions, and zero career guidance. Main Tier-3 city se hoon.
                Mere paas bhi koi roadmap nahi tha.
              </p>
              <p>
                Par dhire dhire samjha — agar koi sahi tarike se samjha de, toh padhai mushkil nahi hai.
                Bas sahi guidance chahiye. Yahi reason hai ki maine ye platform banaya.
              </p>
              <p>
                Yahan pe koi fake promise nahi hai. Koi "100% result guaranteed" type bakwaas nahi hai.
                Bas honest teaching, practical notes, aur agar tum lage raho toh results khud aayenge.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild variant="default">
              <Link href="/about">
                Read my full story
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`https://youtube.com/@amarbhaiya`} target="_blank" rel="noreferrer">
                <PlayCircle className="size-4" />
                Watch on YouTube
              </Link>
            </Button>
          </div>
        </RetroPanel>
      </section>

      {/* ─── Featured Courses ─────────────────────────────────────── */}
      {homeContent.featuredCourses.length > 0 && (
        <section className="mx-auto max-w-6xl space-y-6">
          <SectionHeading
            eyebrow="Popular courses"
            title="Jo sabse zyada students padh rahe hain"
            description="These are the courses students are actually enrolling in and completing. Not just listed — actively used."
            titleAs="h2"
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {homeContent.featuredCourses.map((course, index) => (
              <Link
                key={`${course.title}-${index}`}
                href={course.slug ? `/courses/${course.slug}` : "/courses"}
                className="group"
              >
                <RetroPanel
                  tone="card"
                  size="lg"
                  className="flex h-full flex-col gap-4 transition-all group-hover:-translate-y-1 group-hover:shadow-retro-lg"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline">{course.level}</Badge>
                    <span className="text-xs font-semibold text-muted-foreground">{course.students} students</span>
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-black leading-snug tracking-tight">
                      {course.title}
                    </h3>
                    <p className="text-sm font-medium leading-relaxed text-muted-foreground line-clamp-2">
                      {course.sub}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-lg font-black text-primary">
                      {course.price}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      View course
                      <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </RetroPanel>
              </Link>
            ))}
          </div>

          <div className="flex justify-start">
            <Button asChild variant="outline" size="lg">
              <Link href="/courses">
                Browse all courses
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* ─── Skills Courses (Secondary) ───────────────────────────── */}
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Beyond school"
          title="Skills jo school nahi sikhata, par life mein kaam aate hain."
          description="College students aur working professionals ke liye — practical skills that actually help you build a career."
          titleAs="h2"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {skillsCourses.map((item) => (
            <RetroPanel key={item.title} tone="card" className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="size-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black tracking-tight">{item.title}</h3>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            </RetroPanel>
          ))}
        </div>
      </section>

      {/* ─── Platform Features ────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="What you get"
          title="Ek jagah pe sab kuch — simple aur clean."
          description="No random WhatsApp groups, no scattered PDFs. Everything organized in one place."
          titleAs="h2"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {platformFeatures.map((item) => (
            <RetroPanel key={item.title} tone="muted" className="space-y-3 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-base font-black tracking-tight">{item.title}</h3>
              <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
            </RetroPanel>
          ))}
        </div>
      </section>

      {/* ─── Social Proof / Why Items ─────────────────────────────── */}
      {homeContent.whyItems.length > 0 && (
        <section className="mx-auto max-w-6xl space-y-6">
          <SectionHeading
            eyebrow="Why students trust this"
            title="Teaching style matters more than the topic list."
            description="Ye sirf course nahi hai — ye ek system hai jo actually kaam karta hai kyunki approach different hai."
            titleAs="h2"
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {homeContent.whyItems.map((item, index) => (
              <RetroPanel
                key={item.title}
                tone={index % 2 === 0 ? "card" : "muted"}
                className="space-y-2"
              >
                <Sparkles className="size-4 text-primary" />
                <h3 className="text-base font-black tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </RetroPanel>
            ))}
          </div>
        </section>
      )}

      {/* ─── CTA Footer ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl">
        <RetroPanel tone="brand" size="lg" className="text-center space-y-6">
          <h2 className="mx-auto max-w-3xl text-3xl font-black leading-tight tracking-tight text-primary-foreground sm:text-4xl md:text-5xl">
            Bas ek step door ho apni padhai ko sort karne se.
          </h2>
          <p className="mx-auto max-w-xl text-sm font-medium leading-relaxed text-primary-foreground/80 sm:text-base">
            Free account banao, notes download karo, courses explore karo — aur agar mann kare toh community join karo. No pressure.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">
                Create a free account
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20">
              <Link href="/contact">Talk to Bhaiya</Link>
            </Button>
          </div>
        </RetroPanel>
      </section>
    </div>
  );
}
