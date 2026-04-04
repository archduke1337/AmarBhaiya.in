import { BookOpen, Download, Eye, EyeOff, FileText, Plus } from "lucide-react";

import { requireRole } from "@/lib/appwrite/auth";
import {
  createCourseResourceAction,
  createStandaloneResourceAction,
  deleteCourseResourceAction,
  deleteStandaloneResourceAction,
  getInstructorCourseResourceOptions,
  getInstructorCourseResources,
  getInstructorResources,
  updateCourseResourceAction,
  updateStandaloneResourceAction,
} from "@/actions/resources";
import { DirectAppwriteUploadForm } from "@/components/instructor/direct-appwrite-upload-form";
import { formatCurrency } from "@/lib/utils/format";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function InstructorResourcesPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const [resources, courseResources, lessonOptions] = await Promise.all([
    getInstructorResources({ userId: user.$id, role }),
    getInstructorCourseResources({ userId: user.$id, role }),
    getInstructorCourseResourceOptions({ userId: user.$id, role }),
  ]);

  const published = resources.filter((r) => r.isPublished).length;
  const free = resources.filter((r) => r.accessModel === "free").length;
  const courseLinked = courseResources.length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Instructor · Resources"
        title="Resources Library"
        description={`${courseLinked} lesson-linked resources and ${resources.length} standalone resources. Manage course attachments and independent downloads from one place.`}
      />

      <section className="grid gap-3 md:grid-cols-3">
        <article className="border border-border p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Course-linked
          </p>
          <p className="mt-2 text-2xl font-medium">{courseLinked}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Files and links attached directly to lessons.
          </p>
        </article>
        <article className="border border-border p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Published standalone
          </p>
          <p className="mt-2 text-2xl font-medium">{published}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Visible in the independent resources library.
          </p>
        </article>
        <article className="border border-border p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Free standalone
          </p>
          <p className="mt-2 text-2xl font-medium">{free}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Open access resources that do not need a purchase.
          </p>
        </article>
      </section>

      {/* Course-linked resources */}
      <section
        id="create-course-resource"
        className="scroll-mt-24 border border-border"
      >
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <BookOpen className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Course Lesson Resources</h2>
        </div>

        {lessonOptions.length === 0 ? (
          <div className="px-5 py-6 text-sm text-muted-foreground">
            Add lessons in your course curriculum first. Once lessons exist, you can attach PDFs,
            links, and downloadable files here for students.
          </div>
        ) : (
          <form
            action={createCourseResourceAction}
            className="grid gap-4 p-5 md:grid-cols-2"
          >
            <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
              <span className="text-muted-foreground">Lesson</span>
              <select
                name="lessonId"
                required
                className="h-10 border border-border bg-background px-3 text-sm"
                defaultValue={lessonOptions[0]?.lessonId ?? ""}
              >
                {lessonOptions.map((lesson) => (
                  <option key={lesson.lessonId} value={lesson.lessonId}>
                    {lesson.courseTitle} · {lesson.lessonTitle}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Title</span>
              <input
                name="title"
                required
                minLength={3}
                placeholder="e.g. Worksheet PDF"
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Type</span>
              <select
                name="type"
                className="h-10 border border-border bg-background px-3 text-sm"
              >
                <option value="file">Downloadable file</option>
                <option value="pdf">PDF</option>
                <option value="link">External link</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
              <span className="text-muted-foreground">Link URL (for link type)</span>
              <input
                name="url"
                type="url"
                placeholder="https://..."
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>

            <div className="flex items-end justify-end md:col-span-2">
              <button
                type="submit"
                className="h-10 bg-foreground px-4 text-sm text-background transition-opacity hover:opacity-90"
              >
                Add Course Resource
              </button>
            </div>
          </form>
        )}

        <div className="border-t border-border bg-muted/10 px-5 py-3 text-xs text-muted-foreground">
          These resources are attached to specific lessons and inherit course access automatically.
        </div>
      </section>

      <section
        id="course-resources"
        className="scroll-mt-24 flex flex-col gap-3"
      >
        <h2 className="text-lg font-medium">
          Course Resources ({courseResources.length})
        </h2>

        {courseResources.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No lesson resources yet"
            description="Attach PDFs, files, or links to specific lessons so students can access them while learning."
          />
        ) : (
          courseResources.map((resource) => (
            <article
              key={resource.id}
              id={`course-resource-${resource.id}`}
              className="scroll-mt-24 border border-border"
            >
              <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium">{resource.title}</h3>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {resource.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {resource.courseTitle} · {resource.lessonTitle}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Download className="size-3" />
                      {resource.fileId ? "File attached" : "No file yet"}
                    </span>
                    <span>
                      {resource.type === "link"
                        ? resource.url || "No link yet"
                        : "Visible inside the lesson viewer"}
                    </span>
                  </div>
                </div>
              </div>

              <form
                action={updateCourseResourceAction}
                className="border-t border-border bg-muted/20 px-5 py-4"
              >
                <input type="hidden" name="resourceId" value={resource.id} />
                <div className="grid gap-3 md:grid-cols-4">
                  <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
                    <span className="text-muted-foreground">Title</span>
                    <input
                      name="title"
                      minLength={3}
                      defaultValue={resource.title}
                      className="h-9 border border-border bg-background px-3 text-xs"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <select
                      name="type"
                      defaultValue={resource.type}
                      className="h-9 border border-border bg-background px-3 text-xs"
                    >
                      <option value="file">File</option>
                      <option value="pdf">PDF</option>
                      <option value="link">Link</option>
                    </select>
                  </label>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="h-9 w-full border border-border px-3 text-xs transition-colors hover:bg-muted"
                    >
                      Save
                    </button>
                  </div>

                  <label className="flex flex-col gap-1.5 text-sm md:col-span-4">
                    <span className="text-muted-foreground">Link URL</span>
                    <input
                      name="url"
                      type="url"
                      defaultValue={resource.url}
                      placeholder="https://..."
                      className="h-9 border border-border bg-background px-3 text-xs"
                    />
                  </label>
                </div>
              </form>

              <div className="border-t border-border px-5 py-3">
                <DirectAppwriteUploadForm
                  kind="course-resource"
                  resourceId={resource.id}
                  accept=".pdf,.zip,.txt,.doc,.docx,.pptx"
                  statusLabel={resource.fileId ? "✓ File attached" : "No file"}
                  buttonLabel="Upload"
                  successMessage="Course resource file uploaded."
                  helperText="Direct Appwrite upload. Supports PDF, ZIP, TXT, DOC, DOCX, and PPTX up to 50 MB."
                />
              </div>

              <form
                action={deleteCourseResourceAction}
                className="flex justify-end border-t border-border px-5 py-2"
              >
                <input type="hidden" name="resourceId" value={resource.id} />
                <button
                  type="submit"
                  className="h-8 px-3 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Delete resource
                </button>
              </form>
            </article>
          ))
        )}
      </section>

      {/* Create standalone resource form */}
      <section
        id="create-standalone-resource"
        className="scroll-mt-24 border border-border"
      >
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Plus className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Create Standalone Resource</h2>
        </div>
        <form
          action={createStandaloneResourceAction}
          className="grid gap-4 p-5 md:grid-cols-2"
        >
          <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
            <span className="text-muted-foreground">Title</span>
            <input
              name="title"
              required
              minLength={4}
              placeholder="e.g. Class 10 Maths Formula Sheet"
              className="h-10 border border-border bg-background px-3 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Type</span>
            <select
              name="type"
              className="h-10 border border-border bg-background px-3 text-sm"
            >
              <option value="notes">📝 Notes</option>
              <option value="worksheet">📄 Worksheet</option>
              <option value="test_paper">📋 Test Paper</option>
              <option value="video">🎥 Video</option>
              <option value="other">📦 Other</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Access</span>
            <select
              name="accessModel"
              className="h-10 border border-border bg-background px-3 text-sm"
            >
              <option value="free">Free — anyone can access</option>
              <option value="paid">Paid — requires purchase</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Price (₹, for paid)</span>
            <input
              name="price"
              type="number"
              min={0}
              defaultValue={0}
              className="h-10 border border-border bg-background px-3 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
            <span className="text-muted-foreground">Description</span>
            <textarea
              name="description"
              rows={3}
              placeholder="What does this resource cover? Who is it for?"
              className="border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              name="isPublished"
              type="checkbox"
              className="size-4 accent-foreground"
            />
            <span className="text-muted-foreground">Publish immediately</span>
          </label>

          <div className="flex items-end justify-end md:col-span-2">
            <button
              type="submit"
              className="h-10 bg-foreground px-4 text-sm text-background transition-opacity hover:opacity-90"
            >
              Create Resource
            </button>
          </div>
        </form>
      </section>

      {/* Standalone resource list */}
      <section
        id="standalone-resources"
        className="scroll-mt-24 flex flex-col gap-3"
      >
        <h2 className="text-lg font-medium">
          Standalone Resources ({resources.length})
        </h2>

        {resources.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No resources yet"
            description="Create notes, worksheets, test papers, or demo videos that students can access independently — no course required."
          />
        ) : (
          resources.map((resource) => (
            <article
              key={resource.id}
              id={`standalone-resource-${resource.id}`}
              className="scroll-mt-24 border border-border"
            >
              <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium">{resource.title}</h3>
                    <Badge variant="outline" className="text-[10px]">
                      {resource.type.replace("_", " ")}
                    </Badge>
                    <Badge
                      variant={
                        resource.accessModel === "free" ? "default" : "outline"
                      }
                      className="text-[10px]"
                    >
                      {resource.accessModel === "free"
                        ? "FREE"
                        : formatCurrency(resource.price)}
                    </Badge>
                  </div>
                  {resource.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {resource.description}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Download className="size-3" />
                      {resource.downloadCount} downloads
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {resource.isPublished ? (
                        <>
                          <Eye className="size-3" /> Published
                        </>
                      ) : (
                        <>
                          <EyeOff className="size-3" /> Draft
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inline edit form */}
              <form
                action={updateStandaloneResourceAction}
                className="border-t border-border bg-muted/20 px-5 py-4"
              >
                <input type="hidden" name="resourceId" value={resource.id} />
                <div className="grid gap-3 md:grid-cols-4">
                  <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
                    <span className="text-muted-foreground">Title</span>
                    <input
                      name="title"
                      minLength={4}
                      defaultValue={resource.title}
                      className="h-9 border border-border bg-background px-3 text-xs"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
                    <span className="text-muted-foreground">Description</span>
                    <input
                      name="description"
                      defaultValue={resource.description}
                      className="h-9 border border-border bg-background px-3 text-xs"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <select
                      name="type"
                      defaultValue={resource.type}
                      className="h-9 border border-border bg-background px-3 text-xs"
                    >
                      <option value="notes">Notes</option>
                      <option value="worksheet">Worksheet</option>
                      <option value="test_paper">Test Paper</option>
                      <option value="video">Video</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted-foreground">Access</span>
                    <select
                      name="accessModel"
                      defaultValue={resource.accessModel}
                      className="h-9 border border-border bg-background px-3 text-xs"
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted-foreground">Price (₹)</span>
                    <input
                      name="price"
                      type="number"
                      min={0}
                      defaultValue={resource.price}
                      className="h-9 border border-border bg-background px-3 text-xs"
                    />
                  </label>

                  <div className="flex items-end gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        name="isPublished"
                        type="checkbox"
                        defaultChecked={resource.isPublished}
                        className="size-4 accent-foreground"
                      />
                      Published
                    </label>
                    <button
                      type="submit"
                      className="h-9 border border-border px-3 text-xs transition-colors hover:bg-muted"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>

              {/* File upload */}
              <div className="border-t border-border px-5 py-3">
                <DirectAppwriteUploadForm
                  kind="standalone-resource"
                  resourceId={resource.id}
                  accept=".pdf,.zip,.txt,.doc,.docx,.ppt,.pptx,.mp4,.webm,.mov,.mkv"
                  statusLabel={resource.fileId ? "✓ File attached" : "No file"}
                  buttonLabel="Upload"
                  successMessage="Resource file uploaded."
                  helperText="Direct Appwrite upload. Supports docs, archives, and media up to 200 MB."
                />
              </div>

              {/* Delete */}
              <form
                action={deleteStandaloneResourceAction}
                className="flex justify-end border-t border-border px-5 py-2"
              >
                <input type="hidden" name="resourceId" value={resource.id} />
                <button
                  type="submit"
                  className="h-8 px-3 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Delete resource
                </button>
              </form>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
