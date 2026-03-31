export default function InstructorStudentsPage() {
  const students = [
    { name: "Aarav", course: "Complete Coding Bootcamp", progress: "68%" },
    { name: "Riya", course: "Board Exam Domination", progress: "82%" },
    { name: "Kabir", course: "Career Launchpad", progress: "51%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Students</p>
        <h1 className="text-3xl mt-2">Learner Progress Overview</h1>
      </div>

      <section className="space-y-3">
        {students.map((student) => (
          <article key={student.name} className="border border-border p-5">
            <h2 className="text-lg">{student.name}</h2>
            <p className="text-sm text-muted-foreground">{student.course}</p>
            <p className="text-sm text-muted-foreground mt-1">Progress: {student.progress}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
