import { unstable_cache } from "next/cache";

const revalidationSeconds = {
  homePage: 300,
  courses: 600,
  courseDetail: 900,
  blog: 600,
  blogPost: 900,
  about: 3600,
  contact: 3600,
  notes: 600,
};

const tags = {
  homePage: "public-home",
  courses: "public-courses",
  courseDetail: (slug: string) => `course-${slug}`,
  blog: "public-blog",
  blogPost: (slug: string) => `blog-${slug}`,
  notes: "public-notes",
};

export function cachedHomePage<T>(fn: () => Promise<T>): Promise<T> {
  return unstable_cache(fn, ["public-home"], {
    revalidate: revalidationSeconds.homePage,
    tags: [tags.homePage],
  })();
}

export function cachedCoursesPage<T>(
  cacheKey: string,
  fn: () => Promise<T>
): Promise<T> {
  return unstable_cache(fn, ["public-courses", cacheKey], {
    revalidate: revalidationSeconds.courses,
    tags: [tags.courses],
  })();
}

export function cachedCourseDetail<T>(slug: string, fn: () => Promise<T>): Promise<T> {
  return unstable_cache(fn, [`course-detail-${slug}`], {
    revalidate: revalidationSeconds.courseDetail,
    tags: [tags.courseDetail(slug)],
  })();
}

export function cachedBlogPage<T>(fn: () => Promise<T>): Promise<T> {
  return unstable_cache(fn, ["public-blog"], {
    revalidate: revalidationSeconds.blog,
    tags: [tags.blog],
  })();
}

export function cachedBlogPost<T>(slug: string, fn: () => Promise<T>): Promise<T> {
  return unstable_cache(fn, [`blog-post-${slug}`], {
    revalidate: revalidationSeconds.blogPost,
    tags: [tags.blogPost(slug)],
  })();
}

export function cachedAboutPage<T>(fn: () => Promise<T>): Promise<T> {
  return unstable_cache(fn, ["public-about"], {
    revalidate: revalidationSeconds.about,
    tags: ["public-about"],
  })();
}

export function cachedContactPage<T>(fn: () => Promise<T>): Promise<T> {
  return unstable_cache(fn, ["public-contact"], {
    revalidate: revalidationSeconds.contact,
    tags: ["public-contact"],
  })();
}

export function cachedNotesPage<T>(cacheKey: string, fn: () => Promise<T>): Promise<T> {
  return unstable_cache(fn, ["public-notes", cacheKey], {
    revalidate: revalidationSeconds.notes,
    tags: ["public-notes"],
  })();
}
