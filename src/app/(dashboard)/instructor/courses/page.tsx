import Link from "next/link";

const COURSES = [
  { id: "complete-coding-bootcamp", title: "Complete Coding Bootcamp", status: "Published" },
  { id: "board-exam-domination", title: "Board Exam Domination", status: "Published" },
  { id: "student-fitness-blueprint", title: "Student Fitness Blueprint", status: "Draft" },
];

export default function InstructorCoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Instructor Courses</p>
          <h1 className="text-3xl mt-2">Your Course Library</h1>
        </div>
        <Link href="/instructor/courses/new" className="h-10 px-4 bg-foreground text-background text-sm inline-flex items-center">
          New course
        </Link>
      </div>

      <section className="space-y-3">
        {COURSES.map((course) => (
          <article key={course.id} className="border border-border p-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl">{course.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">Status: {course.status}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/instructor/courses/${course.id}`} className="text-sm underline underline-offset-4">
                Edit details
              </Link>
              <Link href={`/instructor/courses/${course.id}/curriculum`} className="text-sm underline underline-offset-4">
                Curriculum
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
