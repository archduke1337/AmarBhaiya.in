import { BookOpen, GraduationCap, DollarSign, Layers } from "lucide-react";

import { getAdminCourses } from "@/lib/appwrite/dashboard-data";
import { formatCurrency } from "@/lib/utils/format";
import { PageHeader, StatGrid, StatCard, EmptyState } from "@/components/dashboard";
import { AdminCoursesTable } from "./courses-table";

export default async function AdminCoursesPage() {
  const courses = await getAdminCourses();

  const published = courses.filter((c) => c.state === "published").length;
  const drafts = courses.filter((c) => c.state === "draft").length;
  const featured = courses.filter((c) => c.featured === "yes").length;
  const freeCourses = courses.filter((c) => c.price === 0).length;
  const totalStudents = courses.reduce((sum, c) => sum + c.enrollmentCount, 0);
  const totalRevenue = courses
    .filter((c) => c.price > 0)
    .reduce((sum, c) => sum + c.price * c.enrollmentCount, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Admin · Courses"
        title="Course Oversight"
        description="Review every course before it reaches students. Keep publication, featured placement, and catalogue quality in one calm control room."
      />

      <StatGrid columns={4}>
        <StatCard label="Total Courses" value={courses.length} icon={BookOpen} description={`${published} published, ${drafts} drafts`} />
        <StatCard label="Total Students" value={totalStudents} icon={GraduationCap} description="Active enrollments across all courses" />
        <StatCard
          label="Featured"
          value={featured}
          icon={Layers}
          description={`${freeCourses} free courses`}
        />
        <StatCard
          label="Est. Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          description="Based on current enrollments"
        />
      </StatGrid>

      {courses.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No courses found"
          description="Instructors can create courses from their dashboard. They will appear here for admin review."
        />
      ) : (
        <AdminCoursesTable courses={courses} />
      )}

      <div className="rounded-xl border border-border/40 bg-surface-hover px-5 py-3">
        <p className="text-[10px] font-semibold text-muted-foreground">
          ⚡ The homepage hero section picks the top 3 featured courses by enrollment count. Unfeature a course or feature a new one and the hero updates after revalidation.
        </p>
      </div>
    </div>
  );
}
