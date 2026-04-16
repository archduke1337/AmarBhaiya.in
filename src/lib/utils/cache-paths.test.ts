import { describe, expect, it } from "vitest";

import { getBlogDetailPaths, getCourseDetailPaths } from "./cache-paths";

describe("cache path helpers", () => {
  it("returns both app course variants and the public course path", () => {
    expect(getCourseDetailPaths("course_1", "maths-class-10")).toEqual([
      "/app/courses/course_1",
      "/app/courses/maths-class-10",
      "/courses/maths-class-10",
    ]);
  });

  it("deduplicates overlapping course identifiers", () => {
    expect(getCourseDetailPaths("same", "same")).toEqual([
      "/app/courses/same",
      "/courses/same",
    ]);
  });

  it("omits empty optional values", () => {
    expect(getCourseDetailPaths("course_1")).toEqual(["/app/courses/course_1"]);
    expect(getBlogDetailPaths("")).toEqual([]);
  });

  it("returns a blog detail path when a slug exists", () => {
    expect(getBlogDetailPaths("my-post")).toEqual(["/blog/my-post"]);
  });
});
