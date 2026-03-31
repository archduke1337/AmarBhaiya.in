const COURSE_ROWS = [
  { title: "Complete Coding Bootcamp", state: "published", featured: "yes" },
  { title: "Board Exam Domination", state: "published", featured: "no" },
  { title: "Career Launchpad", state: "draft", featured: "no" },
];

export default function AdminCoursesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Courses</p>
        <h1 className="text-3xl mt-2">Course Oversight</h1>
      </div>

      <section className="space-y-3">
        {COURSE_ROWS.map((course) => (
          <article key={course.title} className="border border-border p-5">
            <h2 className="text-xl">{course.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              State: {course.state} - Featured: {course.featured}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
