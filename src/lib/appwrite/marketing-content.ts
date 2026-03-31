import { Query } from "node-appwrite";
import type { Models } from "node-appwrite";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import type {
  BlogPostRecord,
  Category,
  Course,
  Enrollment,
  Lesson,
  Module,
  SiteCopyRecord,
} from "@/types/appwrite";

type AnyRow = Models.Row & {
  [key: string]: unknown;
};

type CourseRow = AnyRow & Partial<Course>;
type CategoryRow = AnyRow & Partial<Category>;
type EnrollmentRow = AnyRow & Partial<Enrollment>;
type ModuleRow = AnyRow & Partial<Module>;
type LessonRow = AnyRow & Partial<Lesson>;
type BlogPostRow = AnyRow & Partial<BlogPostRecord>;
type SiteCopyRow = AnyRow & Partial<SiteCopyRecord>;

export type CourseSort = "popular" | "newest" | "price";

export type PublicCourseListItem = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  priceInr: number;
  rating: number;
  totalLessons: number;
  enrolledStudents: number;
  totalDurationHours: number;
  updatedAt: string;
  accessModel: string;
};

export type PublicCourseDetail = PublicCourseListItem & {
  whatYouLearn: string[];
  requirements: string[];
  curriculum: Array<{
    id: string;
    title: string;
    lessons: Array<{
      id: string;
      title: string;
      durationMinutes: number;
    }>;
  }>;
};

export type PublicBlogPostPreview = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readMinutes: number;
  authorName: string;
};

export type PublicBlogPost = PublicBlogPostPreview & {
  content: string[];
};

export type AboutIdentityItem = {
  title: string;
  detail: string;
};

export type AboutJourneyItem = {
  year: string;
  title: string;
  detail: string;
};

export type ContactChannelItem = {
  label: string;
  value: string;
};

export type HomeStatItem = {
  end: number;
  suffix: string;
  label: string;
};

export type HomeDomainItem = {
  title: string;
  sub: string;
};

export type HomeLearnItem = {
  title: string;
  who: string;
  desc: string;
};

export type HomeFeaturedCourseItem = {
  title: string;
  sub: string;
  level: string;
  students: string;
  price: string;
  note: string;
};

export type HomeWhyItem = {
  title: string;
  body: string;
};

export type HomePageContent = {
  stats: HomeStatItem[];
  domains: HomeDomainItem[];
  learnItems: HomeLearnItem[];
  featuredCourses: HomeFeaturedCourseItem[];
  whyItems: HomeWhyItem[];
};

export type CoursesPageData = {
  courses: PublicCourseListItem[];
  categories: string[];
};

export type BlogPageData = {
  posts: PublicBlogPostPreview[];
  categories: string[];
};

function toDate(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function toNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toDurationMinutes(value: unknown): number {
  const raw = toNumber(value, 0);
  if (raw <= 0) {
    return 0;
  }

  // Lessons are commonly stored in seconds, while UI renders minutes.
  if (raw > 240) {
    return Math.max(1, Math.round(raw / 60));
  }

  return Math.round(raw);
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function parseParagraphs(content: unknown): string[] {
  if (typeof content !== "string" || content.trim().length === 0) {
    return [];
  }

  return content
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseJsonPayload<T>(value: unknown): T | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function safeListRows<Row extends AnyRow>(
  tableId: string,
  queries: string[] = []
): Promise<{ rows: Row[]; total: number }> {
  try {
    const { tablesDB } = await createAdminClient();
    const response = await tablesDB.listRows<Row>({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId,
      queries,
    });

    return {
      rows: response.rows,
      total: response.total,
    };
  } catch {
    return {
      rows: [],
      total: 0,
    };
  }
}

async function safeGetSiteCopyRow(key: string): Promise<SiteCopyRow | null> {
  const response = await safeListRows<SiteCopyRow>(APPWRITE_CONFIG.tables.siteCopy, [
    Query.equal("key", [key]),
    Query.limit(1),
  ]);

  const row = response.rows[0];
  if (!row || row.isPublished === false) {
    return null;
  }

  return row;
}

async function getCategoryMaps() {
  const categoriesResult = await safeListRows<CategoryRow>(
    APPWRITE_CONFIG.tables.categories,
    [Query.limit(200)]
  );

  const categoryById = new Map<string, { slug: string; name: string }>();
  for (const category of categoriesResult.rows) {
    categoryById.set(category.$id, {
      slug:
        typeof category.slug === "string" && category.slug.length > 0
          ? category.slug
          : category.$id,
      name:
        typeof category.name === "string" && category.name.length > 0
          ? category.name
          : "Uncategorized",
    });
  }

  return categoryById;
}

async function getEnrollmentCountsByCourseId(courseIds: string[]) {
  if (courseIds.length === 0) {
    return new Map<string, number>();
  }

  const enrollmentsResult = await safeListRows<EnrollmentRow>(
    APPWRITE_CONFIG.tables.enrollments,
    [Query.limit(1000)]
  );

  const validCourseIds = new Set(courseIds);
  const counts = new Map<string, number>();

  for (const row of enrollmentsResult.rows) {
    if (row.isActive === false || typeof row.courseId !== "string") {
      continue;
    }

    if (!validCourseIds.has(row.courseId)) {
      continue;
    }

    counts.set(row.courseId, (counts.get(row.courseId) ?? 0) + 1);
  }

  return counts;
}

function toPublicCourse(
  row: CourseRow,
  categoryById: Map<string, { slug: string; name: string }>,
  enrollmentCounts: Map<string, number>
): PublicCourseListItem {
  const categoryEntry =
    (typeof row.categoryId === "string" && categoryById.get(row.categoryId)) ||
    null;

  const enrolledStudents =
    enrollmentCounts.get(row.$id) ?? toNumber(row.enrollmentCount, 0);

  return {
    id: row.$id,
    slug: typeof row.slug === "string" && row.slug.length > 0 ? row.slug : row.$id,
    title:
      typeof row.title === "string" && row.title.length > 0
        ? row.title
        : "Untitled course",
    shortDescription:
      typeof row.shortDescription === "string" && row.shortDescription.length > 0
        ? row.shortDescription
        : typeof row.description === "string"
          ? row.description
          : "",
    category: categoryEntry?.slug ?? "uncategorized",
    priceInr: toNumber(row.price, 0),
    rating: toNumber(row.rating, 0),
    totalLessons: toNumber(row.totalLessons, 0),
    enrolledStudents,
    totalDurationHours: Math.max(0, Math.round(toNumber(row.totalDuration, 0) / 3600)),
    updatedAt: row.$updatedAt,
    accessModel:
      typeof row.accessModel === "string" && row.accessModel.length > 0
        ? row.accessModel
        : "free",
  };
}

export async function getPublicCoursesPageData(options: {
  query?: string;
  category?: string;
  sort?: CourseSort;
}): Promise<CoursesPageData> {
  const query = (options.query ?? "").trim().toLowerCase();
  const activeCategory = options.category ?? "all";
  const sort = options.sort ?? "popular";

  const [coursesResult, categoryById] = await Promise.all([
    safeListRows<CourseRow>(APPWRITE_CONFIG.tables.courses, [
      Query.equal("isPublished", [true]),
      Query.limit(300),
    ]),
    getCategoryMaps(),
  ]);

  const courseIds = coursesResult.rows.map((row) => row.$id);
  const enrollmentCounts = await getEnrollmentCountsByCourseId(courseIds);

  const normalized = coursesResult.rows.map((row) =>
    toPublicCourse(row, categoryById, enrollmentCounts)
  );

  const filtered = normalized.filter((course) => {
    const categoryMatch = activeCategory === "all" || course.category === activeCategory;
    const queryMatch =
      query.length === 0 ||
      course.title.toLowerCase().includes(query) ||
      course.shortDescription.toLowerCase().includes(query);

    return categoryMatch && queryMatch;
  });

  const sorted = [...filtered].sort((left, right) => {
    if (sort === "newest") {
      return right.updatedAt.localeCompare(left.updatedAt);
    }

    if (sort === "price") {
      return left.priceInr - right.priceInr;
    }

    return right.enrolledStudents - left.enrolledStudents;
  });

  const categories = Array.from(new Set(normalized.map((course) => course.category))).sort();

  return {
    courses: sorted,
    categories,
  };
}

export async function getPublicCourseBySlug(
  slug: string
): Promise<PublicCourseDetail | null> {
  const courseResult = await safeListRows<CourseRow>(APPWRITE_CONFIG.tables.courses, [
    Query.equal("slug", [slug]),
    Query.limit(1),
  ]);

  const row = courseResult.rows[0];
  if (!row || row.isPublished === false) {
    return null;
  }

  const [categoryById, enrollmentCounts, modulesResult] = await Promise.all([
    getCategoryMaps(),
    getEnrollmentCountsByCourseId([row.$id]),
    safeListRows<ModuleRow>(APPWRITE_CONFIG.tables.modules, [
      Query.equal("courseId", [row.$id]),
      Query.limit(300),
    ]),
  ]);

  const lessonsResult = await safeListRows<LessonRow>(APPWRITE_CONFIG.tables.lessons, [
    Query.equal("courseId", [row.$id]),
    Query.limit(500),
  ]);

  const lessonsByModule = new Map<string, LessonRow[]>();
  for (const lesson of lessonsResult.rows) {
    if (typeof lesson.moduleId !== "string") {
      continue;
    }

    const current = lessonsByModule.get(lesson.moduleId) ?? [];
    current.push(lesson);
    lessonsByModule.set(lesson.moduleId, current);
  }

  const curriculum = modulesResult.rows
    .sort((left, right) => toNumber(left.order, 0) - toNumber(right.order, 0))
    .map((module) => ({
      id: module.$id,
      title:
        typeof module.title === "string" && module.title.length > 0
          ? module.title
          : "Untitled module",
      lessons: (lessonsByModule.get(module.$id) ?? [])
        .sort((left, right) => toNumber(left.order, 0) - toNumber(right.order, 0))
        .map((lesson) => ({
          id: lesson.$id,
          title:
            typeof lesson.title === "string" && lesson.title.length > 0
              ? lesson.title
              : "Untitled lesson",
          durationMinutes: toDurationMinutes(lesson.duration),
        })),
    }));

  const base = toPublicCourse(row, categoryById, enrollmentCounts);

  return {
    ...base,
    whatYouLearn: parseStringArray(row.whatYouLearn),
    requirements: parseStringArray(row.requirements),
    curriculum,
  };
}

export async function getPublicBlogPageData(options: {
  category?: string;
}): Promise<BlogPageData> {
  const activeCategory = options.category ?? "all";

  const postsResult = await safeListRows<BlogPostRow>(APPWRITE_CONFIG.tables.blogPosts, [
    Query.equal("isPublished", [true]),
    Query.limit(300),
  ]);

  const normalized: PublicBlogPostPreview[] = postsResult.rows
    .map((post) => ({
      slug: typeof post.slug === "string" ? post.slug : post.$id,
      title: typeof post.title === "string" ? post.title : "Untitled post",
      excerpt: typeof post.excerpt === "string" ? post.excerpt : "",
      category: typeof post.category === "string" ? post.category : "general",
      publishedAt:
        typeof post.publishedAt === "string"
          ? post.publishedAt
          : post.$createdAt,
      readMinutes: Math.max(1, toNumber(post.readMinutes, 5)),
      authorName:
        typeof post.authorName === "string" && post.authorName.length > 0
          ? post.authorName
          : "Team",
    }))
    .sort((left, right) => {
      const leftTime = toDate(left.publishedAt)?.getTime() ?? 0;
      const rightTime = toDate(right.publishedAt)?.getTime() ?? 0;
      return rightTime - leftTime;
    });

  const visiblePosts =
    activeCategory === "all"
      ? normalized
      : normalized.filter((post) => post.category === activeCategory);

  const categories = Array.from(new Set(normalized.map((post) => post.category))).sort();

  return {
    posts: visiblePosts,
    categories,
  };
}

export async function getPublicBlogPostBySlug(
  slug: string
): Promise<PublicBlogPost | null> {
  const postResult = await safeListRows<BlogPostRow>(APPWRITE_CONFIG.tables.blogPosts, [
    Query.equal("slug", [slug]),
    Query.limit(1),
  ]);

  const post = postResult.rows[0];
  if (!post || post.isPublished === false) {
    return null;
  }

  const contentParagraphs = parseParagraphs(post.content);

  return {
    slug: typeof post.slug === "string" ? post.slug : post.$id,
    title: typeof post.title === "string" ? post.title : "Untitled post",
    excerpt: typeof post.excerpt === "string" ? post.excerpt : "",
    category: typeof post.category === "string" ? post.category : "general",
    publishedAt:
      typeof post.publishedAt === "string" ? post.publishedAt : post.$createdAt,
    readMinutes: Math.max(1, toNumber(post.readMinutes, Math.ceil(contentParagraphs.length * 1.5))),
    authorName:
      typeof post.authorName === "string" && post.authorName.length > 0
        ? post.authorName
        : "Team",
    content: contentParagraphs,
  };
}

export async function getAboutPageContent(): Promise<{
  identityCards: AboutIdentityItem[];
  journey: AboutJourneyItem[];
  mission: string;
}> {
  const [identityRow, journeyRow, missionRow] = await Promise.all([
    safeGetSiteCopyRow("about.identityCards"),
    safeGetSiteCopyRow("about.journey"),
    safeGetSiteCopyRow("about.mission"),
  ]);

  const identityCards =
    parseJsonPayload<AboutIdentityItem[]>(identityRow?.payload) ?? [];
  const journey = parseJsonPayload<AboutJourneyItem[]>(journeyRow?.payload) ?? [];

  const missionPayload = parseJsonPayload<{ text?: string }>(missionRow?.payload);
  const mission =
    missionPayload?.text ||
    (typeof missionRow?.body === "string" ? missionRow.body : "");

  return {
    identityCards: Array.isArray(identityCards) ? identityCards : [],
    journey: Array.isArray(journey) ? journey : [],
    mission,
  };
}

export async function getContactChannelsContent(): Promise<ContactChannelItem[]> {
  const row = await safeGetSiteCopyRow("contact.channels");
  const payload = parseJsonPayload<ContactChannelItem[]>(row?.payload);

  if (!payload || !Array.isArray(payload)) {
    return [];
  }

  return payload.filter(
    (item): item is ContactChannelItem =>
      typeof item?.label === "string" && typeof item?.value === "string"
  );
}

export async function getHomePageContent(): Promise<HomePageContent> {
  const [
    domainsRow,
    learnRow,
    whyRow,
    metricsRow,
    coursesResult,
    enrollmentsResult,
  ] = await Promise.all([
    safeGetSiteCopyRow("home.domains"),
    safeGetSiteCopyRow("home.learnItems"),
    safeGetSiteCopyRow("home.whyItems"),
    safeGetSiteCopyRow("home.metrics"),
    safeListRows<CourseRow>(APPWRITE_CONFIG.tables.courses, [
      Query.equal("isPublished", [true]),
      Query.limit(300),
    ]),
    safeListRows<EnrollmentRow>(APPWRITE_CONFIG.tables.enrollments, [Query.limit(1000)]),
  ]);

  const domains = parseJsonPayload<HomeDomainItem[]>(domainsRow?.payload) ?? [];
  const learnItems = parseJsonPayload<HomeLearnItem[]>(learnRow?.payload) ?? [];
  const whyItems = parseJsonPayload<HomeWhyItem[]>(whyRow?.payload) ?? [];
  const metrics = parseJsonPayload<{ teachingYears?: number }>(metricsRow?.payload);

  const enrolledUserIds = new Set<string>();
  const enrolledByCourse = new Map<string, number>();

  for (const enrollment of enrollmentsResult.rows) {
    if (enrollment.isActive === false || typeof enrollment.userId !== "string") {
      continue;
    }

    enrolledUserIds.add(enrollment.userId);

    if (typeof enrollment.courseId === "string") {
      enrolledByCourse.set(
        enrollment.courseId,
        (enrolledByCourse.get(enrollment.courseId) ?? 0) + 1
      );
    }
  }

  const totalHours = Math.max(
    0,
    Math.round(
      coursesResult.rows.reduce(
        (sum, course) => sum + toNumber(course.totalDuration, 0),
        0
      ) / 3600
    )
  );

  const stats: HomeStatItem[] = [
    {
      end: enrolledUserIds.size,
      suffix: "+",
      label: "Students",
    },
    {
      end: coursesResult.rows.length,
      suffix: "+",
      label: "Courses",
    },
    {
      end: totalHours,
      suffix: "+",
      label: "Hours",
    },
    {
      end: Math.max(0, Math.round(toNumber(metrics?.teachingYears, 0))),
      suffix: " yrs",
      label: "Teaching",
    },
  ];

  const featuredCourses = [...coursesResult.rows]
    .sort(
      (left, right) =>
        (enrolledByCourse.get(right.$id) ?? 0) -
        (enrolledByCourse.get(left.$id) ?? 0)
    )
    .slice(0, 3)
    .map((course) => {
      const enrolled = enrolledByCourse.get(course.$id) ?? 0;

      return {
        title:
          typeof course.title === "string" && course.title.length > 0
            ? course.title
            : "Untitled course",
        sub:
          typeof course.shortDescription === "string" &&
          course.shortDescription.length > 0
            ? course.shortDescription
            : "",
        level: typeof course.accessModel === "string" ? course.accessModel : "free",
        students: `${enrolled.toLocaleString("en-IN")}+`,
        price:
          toNumber(course.price, 0) === 0
            ? "Free"
            : `INR ${toNumber(course.price, 0)}`,
        note:
          typeof course.accessModel === "string" && course.accessModel === "subscription"
            ? "Subscription access"
            : "Full access",
      };
    });

  return {
    stats,
    domains: Array.isArray(domains) ? domains : [],
    learnItems: Array.isArray(learnItems) ? learnItems : [],
    featuredCourses,
    whyItems: Array.isArray(whyItems) ? whyItems : [],
  };
}
