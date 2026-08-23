function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths.filter((path) => path.trim().length > 0))];
}

export function getCourseDetailPaths(courseId: string, slug?: string): string[] {
  const normalizedId = courseId.trim();
  const normalizedSlug = slug?.trim() || "";

  return uniquePaths([
    normalizedId ? `/app/courses/${normalizedId}` : "",
    normalizedSlug ? `/app/courses/${normalizedSlug}` : "",
    normalizedSlug ? `/courses/${normalizedSlug}` : "",
  ]);
}

export function getBlogDetailPaths(slug?: string): string[] {
  const normalizedSlug = slug?.trim() || "";
  return uniquePaths([normalizedSlug ? `/blog/${normalizedSlug}` : ""]);
}
