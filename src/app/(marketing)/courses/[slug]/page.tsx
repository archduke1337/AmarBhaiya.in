import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Play } from "lucide-react";

import { getPublicCourseBySlug } from "@/lib/appwrite/marketing-content";
import { getLoggedInUser } from "@/lib/appwrite/auth";
import { isEnrolled } from "@/actions/enrollment";
import { enrollInCourseFormAction } from "@/actions/enrollment-form-wrapper";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { RazorpayCheckout } from "@/components/razorpay-checkout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-14 px-6 py-20 md:px-12 md:py-28">
      <section className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
        <RetroPanel tone="card" size="lg" className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">{course.category}</Badge>
            <Badge variant="secondary" className="capitalize">
              {course.accessModel}
            </Badge>
            {enrolled ? <Badge variant="ghost">Enrolled</Badge> : null}
          </div>

          <div className="space-y-4">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Course detail
            </p>
            <h1 className="font-heading text-4xl font-black leading-[0.94] tracking-[-0.06em] md:text-6xl">
              {course.title}
            </h1>
            <p className="max-w-3xl text-lg font-medium leading-8 text-muted-foreground">
              {course.shortDescription}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-5 text-sm">
            <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-secondary px-3 py-3 shadow-retro-sm">
              <p className="mb-1 font-heading text-[0.62rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Category
              </p>
              <p className="font-bold">{course.category}</p>
            </div>
            <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-accent px-3 py-3 shadow-retro-sm">
              <p className="mb-1 font-heading text-[0.62rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Access
              </p>
              <p className="font-bold capitalize">{course.accessModel}</p>
            </div>
            <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card px-3 py-3 shadow-retro-sm">
              <p className="mb-1 font-heading text-[0.62rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Lessons
              </p>
              <p className="font-bold">{course.totalLessons}</p>
            </div>
            <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card px-3 py-3 shadow-retro-sm">
              <p className="mb-1 font-heading text-[0.62rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Hours
              </p>
              <p className="font-bold">{course.totalDurationHours}</p>
            </div>
            <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-muted px-3 py-3 shadow-retro-sm">
              <p className="mb-1 font-heading text-[0.62rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Price
              </p>
              <p className="font-bold">{course.priceInr === 0 ? "Free" : `INR ${course.priceInr}`}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
          {enrolled && firstLesson ? (
            <Button asChild size="lg">
              <Link href={`/app/learn/${course.id}/${firstLesson.id}`}>
                <Play className="size-4" />
                Start learning
              </Link>
            </Button>
          ) : user && !enrolled ? (
            course.accessModel === "free" ? (
              <form action={enrollInCourseFormAction}>
                <input type="hidden" name="courseId" value={course.id} />
                <Button type="submit" size="lg">
                  Enroll for Free
                </Button>
              </form>
            ) : (
              <RazorpayCheckout
                courseId={course.id}
                courseTitle={course.title}
                priceInr={course.priceInr}
                userName={user.name || ""}
                userEmail={user.email}
              />
            )
          ) : !user ? (
            <Button asChild size="lg">
              <Link href={`/register?redirect=/courses/${slug}`}>Sign up to enroll</Link>
            </Button>
          ) : null}

            <Button asChild variant="outline" size="lg">
              <Link href="/courses">Back to courses</Link>
            </Button>
          </div>

          {enrolled && (
            <p className="rounded-[calc(var(--radius)+4px)] border-2 border-border bg-secondary px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
              You are enrolled in this course
            </p>
          )}
        </RetroPanel>

        <RetroPanel tone="secondary" size="lg" className="space-y-5 xl:translate-y-10">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              width={1280}
              height={720}
              className="aspect-video w-full rounded-[calc(var(--radius)+4px)] border-2 border-border object-cover shadow-retro-sm"
              priority
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-[calc(var(--radius)+4px)] border-2 border-border bg-card text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-retro-sm">
              Thumbnail coming soon
            </div>
          )}
          <div className="space-y-2">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Who this is for
            </p>
            <p className="text-base font-semibold leading-7 text-foreground/85">
              Students who want structure, not noise. The curriculum is designed to move from clarity to repetition to real execution without padding the path.
            </p>
          </div>
        </RetroPanel>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <RetroPanel tone="accent" size="lg" className="space-y-4">
          <h2 className="font-heading text-3xl font-black tracking-[-0.05em]">What you will learn</h2>
          {course.whatYouLearn.length === 0 ? (
            <p className="text-sm font-medium text-muted-foreground">No learning outcomes configured yet.</p>
          ) : null}
          <ul className="space-y-3">
            {course.whatYouLearn.map((item) => (
              <li
                key={item}
                className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card px-4 py-3 text-sm font-semibold leading-6 text-foreground shadow-retro-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </RetroPanel>

        <RetroPanel tone="muted" size="lg" className="space-y-4">
          <h2 className="font-heading text-3xl font-black tracking-[-0.05em]">Requirements</h2>
          {course.requirements.length === 0 ? (
            <p className="text-sm font-medium text-muted-foreground">No specific requirements listed.</p>
          ) : null}
          <ul className="space-y-3">
            {course.requirements.map((item) => (
              <li
                key={item}
                className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card px-4 py-3 text-sm font-semibold leading-6 text-foreground shadow-retro-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl">
        <RetroPanel tone="card" size="lg" className="space-y-6">
          <div className="space-y-2">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Curriculum
            </p>
            <h2 className="font-heading text-3xl font-black tracking-[-0.05em]">
              See the path before you commit to it.
            </h2>
          </div>
        {course.curriculum.length === 0 ? (
          <p className="text-sm font-medium text-muted-foreground">Curriculum will appear once modules are published.</p>
        ) : null}
        <div className="space-y-4">
          {course.curriculum.map((module, index) => (
            <RetroPanel
              key={module.title}
              tone={index % 2 === 0 ? "secondary" : "accent"}
              className="space-y-4"
            >
              <p className="font-heading text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                Module {index + 1}
              </p>
              <h3 className="font-heading text-2xl font-black tracking-[-0.04em]">{module.title}</h3>
              <ul className="space-y-2">
                {module.lessons.map((lesson) => {
                  const isAccessible =
                    enrolled ||
                    lesson.isFreePreview ||
                    course.accessModel === "free";

                  return (
                    <li
                      key={lesson.id}
                      className="flex flex-wrap items-center gap-2 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-retro-sm"
                    >
                      {isAccessible ? (
                        enrolled ? (
                          <Link
                            href={`/app/learn/${course.id}/${lesson.id}`}
                            className="underline decoration-2 underline-offset-4 transition-colors hover:text-primary"
                          >
                            {lesson.title}
                          </Link>
                        ) : (
                          <span className="inline-flex flex-wrap items-center gap-2">
                            {lesson.title}
                            {lesson.isFreePreview && (
                              <Badge variant="secondary" className="text-[0.62rem]">
                                Free preview
                              </Badge>
                            )}
                          </span>
                        )
                      ) : (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Lock className="size-3" />
                          {lesson.title}
                        </span>
                      )}
                      {lesson.durationMinutes > 0 && (
                        <span className="ml-auto text-[0.65rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                          ({lesson.durationMinutes}m)
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </RetroPanel>
          ))}
        </div>
        </RetroPanel>
      </section>
    </div>
  );
}
