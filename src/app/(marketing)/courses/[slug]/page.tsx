import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicCourseBySlug } from "@/lib/appwrite/marketing-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);

  if (!course) {
    return {
      title: "Course not found",
    };
  }

  return {
    title: course.title,
    description: course.shortDescription,
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  return (
    <div className="px-6 md:px-12 py-20 md:py-28 space-y-14">
      <section className="max-w-6xl mx-auto border border-border p-8 md:p-10 space-y-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Course detail</p>
        <h1 className="text-4xl md:text-5xl leading-tight">{course.title}</h1>
        <p className="text-lg text-muted-foreground max-w-4xl leading-relaxed">
          {course.shortDescription}
        </p>

        <div className="grid md:grid-cols-5 gap-3 text-sm">
          <div className="border border-border p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Category</p>
            <p>{course.category}</p>
          </div>
          <div className="border border-border p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Access model</p>
            <p className="capitalize">{course.accessModel}</p>
          </div>
          <div className="border border-border p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Lessons</p>
            <p>{course.totalLessons}</p>
          </div>
          <div className="border border-border p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Hours</p>
            <p>{course.totalDurationHours}</p>
          </div>
          <div className="border border-border p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Price</p>
            <p>{course.priceInr === 0 ? "Free" : `INR ${course.priceInr}`}</p>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-5">
          <Link
            href="/register"
            className="bg-foreground text-background px-6 py-3 text-sm font-medium"
          >
            Enroll now
          </Link>
          <Link href="/courses" className="text-sm underline underline-offset-4">
            Back to courses
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
        <article className="border border-border p-7 space-y-4">
          <h2 className="text-2xl">What you will learn</h2>
          {course.whatYouLearn.length === 0 ? (
            <p className="text-sm text-muted-foreground">No learning outcomes configured yet.</p>
          ) : null}
          <ul className="space-y-3">
            {course.whatYouLearn.map((item) => (
              <li key={item} className="text-muted-foreground leading-relaxed">
                - {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="border border-border p-7 space-y-4">
          <h2 className="text-2xl">Requirements</h2>
          {course.requirements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No specific requirements listed.</p>
          ) : null}
          <ul className="space-y-3">
            {course.requirements.map((item) => (
              <li key={item} className="text-muted-foreground leading-relaxed">
                - {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="max-w-6xl mx-auto border border-border p-7 md:p-8 space-y-6">
        <h2 className="text-2xl">Curriculum</h2>
        {course.curriculum.length === 0 ? (
          <p className="text-sm text-muted-foreground">Curriculum will appear once modules are published.</p>
        ) : null}
        <div className="space-y-4">
          {course.curriculum.map((module, index) => (
            <article key={module.title} className="border border-border p-5 space-y-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Module {index + 1}
              </p>
              <h3 className="text-xl">{module.title}</h3>
              <ul className="space-y-2">
                {module.lessons.map((lesson) => (
                  <li key={lesson} className="text-muted-foreground text-sm">
                    - {lesson}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
