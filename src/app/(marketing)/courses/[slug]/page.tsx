import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Clock, Lock, Play, Users } from "lucide-react";

import { getPublicCourseBySlug } from "@/lib/appwrite/marketing-content";
import { getLoggedInUser } from "@/lib/appwrite/auth";
import { enrollInCourseAction, isEnrolled } from "@/actions/enrollment";
import { formatDuration } from "@/lib/utils/format";

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

  // Check if user is logged in and enrolled
  const user = await getLoggedInUser();
  const enrolled = user ? await isEnrolled(course.id, user.$id) : false;

  // Find first lesson for "Start learning" button
  const firstLesson = course.curriculum?.[0]?.lessons?.[0];

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

        {/* Enrollment CTA */}
        <div className="pt-2 flex items-center gap-5">
          {enrolled && firstLesson ? (
            <Link
              href={`/app/learn/${course.id}/${firstLesson.id}`}
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
            >
              <Play className="size-4" />
              Start Learning
            </Link>
          ) : user && !enrolled ? (
            course.accessModel === "free" ? (
              <form action={enrollInCourseAction}>
                <input type="hidden" name="courseId" value={course.id} />
                <button
                  type="submit"
                  className="bg-foreground text-background px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
                >
                  Enroll for Free
                </button>
              </form>
            ) : (
              <Link
                href={`/app/billing?courseId=${course.id}`}
                className="bg-foreground text-background px-6 py-3 text-sm font-medium"
              >
                Enroll — INR {course.priceInr}
              </Link>
            )
          ) : !user ? (
            <Link
              href={`/register?redirect=/courses/${slug}`}
              className="bg-foreground text-background px-6 py-3 text-sm font-medium"
            >
              Sign up to enroll
            </Link>
          ) : null}

          <Link href="/courses" className="text-sm underline underline-offset-4">
            Back to courses
          </Link>
        </div>

        {enrolled && (
          <p className="text-xs text-emerald-600 flex items-center gap-1.5">
            <span>✓</span> You are enrolled in this course
          </p>
        )}
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
                {module.lessons.map((lesson) => {
                  const isAccessible =
                    enrolled ||
                    lesson.isFreePreview ||
                    course.accessModel === "free";

                  return (
                    <li
                      key={lesson.id}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      {isAccessible ? (
                        enrolled ? (
                          <Link
                            href={`/app/learn/${course.id}/${lesson.id}`}
                            className="hover:text-foreground transition-colors underline underline-offset-4"
                          >
                            {lesson.title}
                          </Link>
                        ) : (
                          <span>
                            {lesson.title}
                            {lesson.isFreePreview && (
                              <span className="text-[10px] ml-1 text-emerald-600">FREE PREVIEW</span>
                            )}
                          </span>
                        )
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Lock className="size-3" />
                          {lesson.title}
                        </span>
                      )}
                      {lesson.durationMinutes > 0 && (
                        <span className="text-[10px] text-muted-foreground/60">
                          ({lesson.durationMinutes}m)
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
