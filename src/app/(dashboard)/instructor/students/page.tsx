import { requireRole } from "@/lib/appwrite/auth";
import { getInstructorStudents } from "@/lib/appwrite/dashboard-data";

export default async function InstructorStudentsPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const students = await getInstructorStudents({ userId: user.$id, role });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Students</p>
        <h1 className="text-3xl mt-2">Learner Progress Overview</h1>
      </div>

      <section className="space-y-3">
        {students.length === 0 ? (
          <article className="border border-border p-5 text-sm text-muted-foreground">
            No enrolled students found yet.
          </article>
        ) : null}

        {students.map((student) => (
          <article key={`${student.id}-${student.courseTitle}`} className="border border-border p-5">
            <h2 className="text-lg">{student.name}</h2>
            <p className="text-sm text-muted-foreground">{student.email}</p>
            <p className="text-sm text-muted-foreground mt-1">{student.courseTitle}</p>
            <p className="text-sm text-muted-foreground mt-1">Progress: {student.progressPercent}%</p>
          </article>
        ))}
      </section>
    </div>
  );
}
