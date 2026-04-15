import { Query } from "node-appwrite";
import type { Models } from "node-appwrite";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { getFilePreviewUrl } from "@/lib/utils/file-urls";
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

type TablesDbClient = Awaited<ReturnType<typeof createAdminClient>>["tablesDB"];

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
  thumbnailFileId: string;
  thumbnailUrl: string;
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
      isFreePreview: boolean;
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
  slug: string;
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
  tablesDB: TablesDbClient,
  tableId: string,
  queries: string[] = []
): Promise<{ rows: Row[]; total: number }> {
  try {
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

function isActiveEnrollmentRow(row: Partial<EnrollmentRow>): boolean {
  return row.isActive !== false
    && String(row.status ?? "active") !== "cancelled";
}

async function safeCountRows(
  tablesDB: TablesDbClient,
  tableId: string,
  queries: string[] = []
): Promise<number> {
  const response = await safeListRows<AnyRow>(tablesDB, tableId, [
    ...queries,
    Query.limit(1),
  ]);

  return response.total;
}

function chunkValues(values: string[], chunkSize: number): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }
  return chunks;
}

async function safeListAllRows<Row extends AnyRow>(
  tablesDB: TablesDbClient,
  tableId: string,
  queries: string[] = [],
  pageSize = 500
): Promise<Row[]> {
  const rows: Row[] = [];
  let offset = 0;

  while (true) {
    const response = await safeListRows<Row>(tablesDB, tableId, [
      ...queries,
      Query.limit(pageSize),
      Query.offset(offset),
    ]);

    rows.push(...response.rows);

    if (response.rows.length < pageSize) {
      break;
    }

    offset += response.rows.length;
  }

  return rows;
}

async function safeListRowsByFieldValues<Row extends AnyRow>(
  tablesDB: TablesDbClient,
  tableId: string,
  field: string,
  values: string[],
  extraQueries: string[] = []
): Promise<Row[]> {
  if (values.length === 0) {
    return [];
  }

  const chunks = chunkValues(values, 20);
  const results = await Promise.all(
    chunks.map((chunk) =>
      safeListAllRows<Row>(tablesDB, tableId, [
        Query.equal(field, chunk),
        ...extraQueries,
      ])
    )
  );

  return results.flatMap((result) => result);
}

async function safeGetSiteCopyRow(
  tablesDB: TablesDbClient,
  key: string
): Promise<SiteCopyRow | null> {
  const response = await safeListRows<SiteCopyRow>(tablesDB, APPWRITE_CONFIG.tables.siteCopy, [
    Query.equal("key", [key]),
    Query.limit(1),
  ]);

  const row = response.rows[0];
  if (!row || row.isPublished === false) {
    return null;
  }

  return row;
}

async function getCategoryMaps(tablesDB: TablesDbClient) {
  const categoriesResult = await safeListAllRows<CategoryRow>(
    tablesDB,
    APPWRITE_CONFIG.tables.categories,
    [Query.orderAsc("name")]
  );

  const categoryById = new Map<string, { slug: string; name: string }>();
  for (const category of categoriesResult) {
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

async function getEnrollmentCountsByCourseId(
  tablesDB: TablesDbClient,
  courseIds: string[]
) {
  if (courseIds.length === 0) {
    return new Map<string, number>();
  }

  const enrollmentRows = await safeListRowsByFieldValues<EnrollmentRow>(
    tablesDB,
    APPWRITE_CONFIG.tables.enrollments,
    "courseId",
    courseIds
  );

  const counts = new Map<string, number>();

  for (const row of enrollmentRows) {
    if (typeof row.courseId !== "string" || !isActiveEnrollmentRow(row)) {
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
  const thumbnailFileId =
    typeof row.thumbnailFileId === "string" && row.thumbnailFileId.length > 0
      ? row.thumbnailFileId
      : typeof row.thumbnailId === "string"
        ? row.thumbnailId
        : "";

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
    thumbnailFileId,
    thumbnailUrl: thumbnailFileId
      ? getFilePreviewUrl(APPWRITE_CONFIG.buckets.courseThumbnails, thumbnailFileId, 1280, 720)
      : "",
  };
}

export async function getPublicCoursesPageData(options: {
  query?: string;
  category?: string;
  sort?: CourseSort;
}): Promise<CoursesPageData> {
  const { tablesDB } = await createAdminClient();
  const query = (options.query ?? "").trim().toLowerCase();
  const activeCategory = options.category ?? "all";
  const sort = options.sort ?? "popular";

  const [courseRows, categoryById] = await Promise.all([
    safeListAllRows<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses, [
      Query.equal("isPublished", [true]),
      Query.orderDesc("$updatedAt"),
    ]),
    getCategoryMaps(tablesDB),
  ]);

  const courseIds = courseRows.map((row) => row.$id);
  const enrollmentCounts = await getEnrollmentCountsByCourseId(tablesDB, courseIds);

  const normalized = courseRows.map((row) =>
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
  const { tablesDB } = await createAdminClient();
  const courseResult = await safeListRows<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses, [
    Query.equal("slug", [slug]),
    Query.limit(1),
  ]);

  const row = courseResult.rows[0];
  if (!row || row.isPublished === false) {
    return null;
  }

  const [categoryById, enrollmentCounts, modulesResult] = await Promise.all([
    getCategoryMaps(tablesDB),
    getEnrollmentCountsByCourseId(tablesDB, [row.$id]),
    safeListAllRows<ModuleRow>(tablesDB, APPWRITE_CONFIG.tables.modules, [
      Query.equal("courseId", [row.$id]),
      Query.orderAsc("order"),
    ]),
  ]);

  const lessonRows = await safeListAllRows<LessonRow>(tablesDB, APPWRITE_CONFIG.tables.lessons, [
    Query.equal("courseId", [row.$id]),
    Query.orderAsc("order"),
  ]);

  const lessonsByModule = new Map<string, LessonRow[]>();
  for (const lesson of lessonRows) {
    if (typeof lesson.moduleId !== "string") {
      continue;
    }

    const current = lessonsByModule.get(lesson.moduleId) ?? [];
    current.push(lesson);
    lessonsByModule.set(lesson.moduleId, current);
  }

  const curriculum = modulesResult
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
          isFreePreview: Boolean(lesson.isFreePreview),
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
  const { tablesDB } = await createAdminClient();
  const activeCategory = options.category ?? "all";

  const postRows = await safeListAllRows<BlogPostRow>(tablesDB, APPWRITE_CONFIG.tables.blogPosts, [
    Query.equal("isPublished", [true]),
    Query.orderDesc("publishedAt"),
  ]);

  const normalized: PublicBlogPostPreview[] = postRows
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
  const { tablesDB } = await createAdminClient();
  const postResult = await safeListRows<BlogPostRow>(tablesDB, APPWRITE_CONFIG.tables.blogPosts, [
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
  const { tablesDB } = await createAdminClient();
  const [identityRow, journeyRow, missionRow] = await Promise.all([
    safeGetSiteCopyRow(tablesDB, "about.identityCards"),
    safeGetSiteCopyRow(tablesDB, "about.journey"),
    safeGetSiteCopyRow(tablesDB, "about.mission"),
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
  const { tablesDB } = await createAdminClient();
  const row = await safeGetSiteCopyRow(tablesDB, "contact.channels");
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
  const { tablesDB } = await createAdminClient();
  const [
    domainsRow,
    learnRow,
    whyRow,
    metricsRow,
    publishedCourseCount,
    studentCount,
    featuredCoursesResult,
  ] = await Promise.all([
    safeGetSiteCopyRow(tablesDB, "home.domains"),
    safeGetSiteCopyRow(tablesDB, "home.learnItems"),
    safeGetSiteCopyRow(tablesDB, "home.whyItems"),
    safeGetSiteCopyRow(tablesDB, "home.metrics"),
    safeCountRows(tablesDB, APPWRITE_CONFIG.tables.courses, [
      Query.equal("isPublished", [true]),
    ]),
    safeCountRows(tablesDB, APPWRITE_CONFIG.tables.studentProfiles),
    safeListRows<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses, [
      Query.equal("isPublished", [true]),
      Query.orderDesc("enrollmentCount"),
      Query.limit(6),
    ]),
  ]);

  const domains = parseJsonPayload<HomeDomainItem[]>(domainsRow?.payload) ?? [];
  const learnItems = parseJsonPayload<HomeLearnItem[]>(learnRow?.payload) ?? [];
  const whyItems = parseJsonPayload<HomeWhyItem[]>(whyRow?.payload) ?? [];
  const metrics = parseJsonPayload<{
    teachingYears?: number;
    totalHours?: number;
    totalStudents?: number;
    totalCourses?: number;
  }>(metricsRow?.payload);

  const featuredCourseRows =
    featuredCoursesResult.rows.length > 0
      ? featuredCoursesResult.rows
      : (
          await safeListRows<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses, [
            Query.equal("isPublished", [true]),
            Query.orderDesc("$updatedAt"),
            Query.limit(6),
          ])
        ).rows;

  const totalHours =
    toNumber(metrics?.totalHours, -1) >= 0
      ? Math.max(0, Math.round(toNumber(metrics?.totalHours, 0)))
      : Math.max(
          0,
          Math.round(
            featuredCourseRows.reduce(
              (sum, course) => sum + toNumber(course.totalDuration, 0),
              0
            ) / 3600
          )
        );

  const stats: HomeStatItem[] = [
    {
      end: Math.max(0, Math.round(toNumber(metrics?.totalStudents, studentCount))),
      suffix: "+",
      label: "Students",
    },
    {
      end: Math.max(0, Math.round(toNumber(metrics?.totalCourses, publishedCourseCount))),
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

  const featuredCourses = [...featuredCourseRows]
    .sort(
      (left, right) =>
        toNumber(right.enrollmentCount, 0) - toNumber(left.enrollmentCount, 0)
    )
    .slice(0, 3)
    .map((course) => {
      const enrolled = toNumber(course.enrollmentCount, 0);

      return {
        title:
          typeof course.title === "string" && course.title.length > 0
            ? course.title
            : "Untitled course",
        slug:
          typeof course.slug === "string" && course.slug.length > 0
            ? course.slug
            : "",
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

  const DEFAULT_DOMAINS = [
    { title: "Board Prep", sub: "Class 6-12, CBSE & State boards" },
    { title: "Coding", sub: "Web dev, basics, projects" },
    { title: "Career", sub: "Guidance for college & jobs" },
    { title: "Life Skills", sub: "Communication, money, habits" },
  ];

  const DEFAULT_LEARN_ITEMS = [
    { title: "Full-Stack Web Dev", who: "Class 10+", desc: "HTML, CSS, JS, React, Node — build real projects, not toy apps." },
    { title: "DSA for Placements", who: "College", desc: "200+ problems solved step-by-step. Crack any coding round." },
    { title: "Fitness at Home", who: "Everyone", desc: "No gym needed. Bodyweight routines, diet plans, transformation roadmaps." },
    { title: "Career Guidance", who: "Class 8–12", desc: "Which stream, which college, which skills — sorted." },
    { title: "Money & Investing", who: "18+", desc: "Mutual funds, taxes, budgeting — what school never taught." },
    { title: "Communication", who: "Everyone", desc: "Speak confidently in English, Hindi, or Hinglish. No judgement." },
  ];

  const DEFAULT_WHY_ITEMS = [
    { title: "No Filler Content", body: "Every lesson is picked because it matters. No 40-hour filler courses." },
    { title: "Real Experience", body: "I teach what I've done — not what I read in a textbook." },
    { title: "Hindi + English", body: "Learn in the language you think in. Code comments in English, explanations in Hindi." },
    { title: "Affordable", body: "Most content is free. Paid courses are priced for students, not corporates." },
  ];

  const resolvedDomains = Array.isArray(domains) && domains.length > 0 ? domains : DEFAULT_DOMAINS;
  const resolvedLearnItems = Array.isArray(learnItems) && learnItems.length > 0 ? learnItems : DEFAULT_LEARN_ITEMS;
  const resolvedWhyItems = Array.isArray(whyItems) && whyItems.length > 0 ? whyItems : DEFAULT_WHY_ITEMS;

  return {
    stats,
    domains: resolvedDomains,
    learnItems: resolvedLearnItems,
    featuredCourses,
    whyItems: resolvedWhyItems,
  };
}
