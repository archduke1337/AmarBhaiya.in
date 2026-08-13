import { Query } from "node-appwrite";
import { APPWRITE_CONFIG } from "../config";
import { createAdminClient } from "../server";
import {
  safeListAllRows, safeListRows, safeGetRow, isActiveEnrollmentRow,
  type AnyRow, type CourseRow, type ModuleRow, type LessonRow, type EnrollmentRow,
} from "./internal";

export {
  type PublicCourseCard,
  type PublicCourseDetail,
} from "./internal";

export async function getPublicCourses() {
  const { tablesDB } = await createAdminClient();
  try {
    const rows = await safeListAllRows<CourseRow>(
      tablesDB, APPWRITE_CONFIG.tables.courses,
      [Query.equal("isPublished", [true]), Query.orderDesc("$createdAt")]
    );
    return rows.map((c) => ({
      id: c.$id,
      title: typeof c.title === "string" ? c.title : "Untitled",
      slug: typeof c.slug === "string" ? c.slug : c.$id,
      shortDescription: typeof c.shortDescription === "string" ? c.shortDescription : "",
      accessModel: typeof c.accessModel === "string" ? c.accessModel : "free",
      price: Number(c.price ?? 0),
      thumbnailId: typeof c.thumbnailFileId === "string" && c.thumbnailFileId.length > 0 ? c.thumbnailFileId : typeof c.thumbnailId === "string" ? c.thumbnailId : "",
      instructorName: typeof c.instructorName === "string" ? c.instructorName : "",
      totalLessons: Number(c.totalLessons ?? 0),
      totalDuration: Number(c.totalDuration ?? 0),
      enrolledCount: Number(c.enrollmentCount ?? c.enrolledCount ?? 0),
      categoryId: typeof c.categoryId === "string" ? c.categoryId : "",
    }));
  } catch {
    return [];
  }
}

export async function getPublicCourseBySlug(slugOrId: string) {
  const { tablesDB } = await createAdminClient();
  let course = await safeGetRow<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses, slugOrId);
  if (!course) {
    const bySlug = await safeListRows<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses, [Query.equal("slug", [slugOrId]), Query.limit(1)]);
    course = bySlug.rows[0] ?? null;
  }
  if (!course || !course.isPublished) return null;
  const [moduleRows, lessonRows, enrollmentRows] = await Promise.all([
    safeListAllRows<ModuleRow>(tablesDB, APPWRITE_CONFIG.tables.modules, [Query.equal("courseId", [course.$id]), Query.orderAsc("order")]),
    safeListAllRows<LessonRow>(tablesDB, APPWRITE_CONFIG.tables.lessons, [Query.equal("courseId", [course.$id]), Query.orderAsc("order")]),
    safeListAllRows<EnrollmentRow>(tablesDB, APPWRITE_CONFIG.tables.enrollments, [Query.equal("courseId", [course.$id])]),
  ]);
  const activeEnrollmentRows = enrollmentRows.filter(isActiveEnrollmentRow);
  const lessonsByModuleId = new Map<string, LessonRow[]>();
  for (const lesson of lessonRows) {
    const moduleId = typeof lesson.moduleId === "string" ? lesson.moduleId : "";
    if (!moduleId) continue;
    const existing = lessonsByModuleId.get(moduleId) ?? [];
    existing.push(lesson);
    lessonsByModuleId.set(moduleId, existing);
  }
  const modules = moduleRows.map((module) => {
    const moduleLessons = (lessonsByModuleId.get(module.$id) ?? []).sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
    return {
      id: module.$id,
      title: typeof module.title === "string" ? module.title : "Untitled Module",
      order: Number(module.order ?? 0),
      lessons: moduleLessons.map((lesson) => ({
        id: lesson.$id,
        title: typeof lesson.title === "string" ? lesson.title : "Untitled Lesson",
        order: Number(lesson.order ?? 0),
        duration: Number(lesson.duration ?? 0),
        isFree: Boolean(lesson.isFree),
        isFreePreview: Boolean(lesson.isFreePreview),
      })),
    };
  });
  return {
    id: course.$id,
    title: typeof course.title === "string" ? course.title : "Untitled",
    slug: typeof course.slug === "string" ? course.slug : course.$id,
    shortDescription: typeof course.shortDescription === "string" ? course.shortDescription : "",
    accessModel: typeof course.accessModel === "string" ? course.accessModel : "free",
    price: Number(course.price ?? 0),
    thumbnailId: typeof course.thumbnailFileId === "string" && course.thumbnailFileId.length > 0 ? course.thumbnailFileId : typeof course.thumbnailId === "string" ? course.thumbnailId : "",
    instructorId: typeof course.instructorId === "string" ? course.instructorId : "",
    instructorName: typeof course.instructorName === "string" ? course.instructorName : "",
    totalLessons: Number(course.totalLessons ?? 0),
    totalDuration: Number(course.totalDuration ?? 0),
    enrolledCount: activeEnrollmentRows.length > 0 ? activeEnrollmentRows.length : Number(course.enrollmentCount ?? course.enrolledCount ?? 0),
    isPublished: Boolean(course.isPublished),
    modules,
  };
}
