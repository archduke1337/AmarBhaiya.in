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
import { RetroPanel } from "@/components/marketing/retro-panel";
import { formatCurrency } from "@/lib/utils/format";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "h-11 w-full rounded-[calc(var(--radius)+2px)] border-2 border-border bg-input px-3.5 text-sm font-semibold text-foreground shadow-retro-sm outline-none transition-all focus-visible:-translate-y-px focus-visible:translate-x-px focus-visible:shadow-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

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
        title="Notes & Resources Library"
        description={`${courseLinked} lesson-linked resources and ${resources.length} standalone resources. Upload class notes, worksheets, PDFs, and downloads students can actually use while studying.`}
      />

      <section className="grid gap-3 md:grid-cols-3">
        <RetroPanel tone="accent" className="p-4">
          <p className="font-heading text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Course-linked
          </p>
          <p className="mt-2 text-3xl">{courseLinked}</p>
          <p className="mt-1 text-xs font-semibold leading-6 text-muted-foreground">
            Files and links attached directly to lessons.
          </p>
        </RetroPanel>
        <RetroPanel tone="card" className="p-4">
          <p className="font-heading text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Published standalone
          </p>
          <p className="mt-2 text-3xl">{published}</p>
          <p className="mt-1 text-xs font-semibold leading-6 text-muted-foreground">
            Visible in the independent resources library.
          </p>
        </RetroPanel>
        <RetroPanel tone="secondary" className="p-4">
          <p className="font-heading text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Free standalone
          </p>
          <p className="mt-2 text-3xl">{free}</p>
          <p className="mt-1 text-xs font-semibold leading-6 text-muted-foreground">
            Open access resources that do not need a purchase.
          </p>
        </RetroPanel>
      </section>

      {/* Course-linked resources */}
      <RetroPanel
        id="create-course-resource"
        tone="card"
        className="scroll-mt-24 overflow-hidden p-0"
      >
        <div className="flex items-center gap-2 border-b-2 border-border bg-[color:var(--surface-secondary)] px-5 py-3">
          <BookOpen className="size-4 text-muted-foreground" />
          <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
            Course Lesson Resources
          </h2>
        </div>

        {lessonOptions.length === 0 ? (
          <div className="px-5 py-6 text-sm font-semibold leading-7 text-muted-foreground">
            Add lessons in your curriculum first. Once lessons exist, you can attach PDFs,
            links, and downloadable files exactly where students need them.
          </div>
        ) : (
          <form
            action={createCourseResourceAction}
            className="grid gap-4 p-5 md:grid-cols-2"
          >
            <label className="flex flex-col gap-2 md:col-span-2">
              <Label>Lesson</Label>
              <select
                name="lessonId"
                required
                className={selectClassName}
                defaultValue={lessonOptions[0]?.lessonId ?? ""}
              >
                {lessonOptions.map((lesson) => (
                  <option key={lesson.lessonId} value={lesson.lessonId}>
                    {lesson.courseTitle} · {lesson.lessonTitle}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <Label>Title</Label>
              <Input
                name="title"
                required
                minLength={3}
                placeholder="Worksheet PDF, formula sheet, practice set"
              />
            </label>

            <label className="flex flex-col gap-2">
              <Label>Type</Label>
              <select
                name="type"
                className={selectClassName}
              >
                <option value="file">Downloadable file</option>
                <option value="pdf">PDF</option>
                <option value="link">External link</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 md:col-span-2">
              <Label>Link URL</Label>
              <Input
                name="url"
                type="url"
                placeholder="Only needed when the type is external link"
              />
            </label>

            <div className="flex items-end justify-end md:col-span-2">
              <Button
                type="submit"
                className="w-full min-[420px]:w-auto"
              >
                Add Course Resource
              </Button>
            </div>
          </form>
        )}

        <div className="border-t-2 border-border bg-[color:var(--surface-muted)] px-5 py-3 text-xs font-semibold leading-6 text-muted-foreground">
          These resources are attached to specific lessons and inherit course access automatically.
        </div>
      </RetroPanel>

      <section
        id="course-resources"
        className="scroll-mt-24 flex flex-col gap-3"
      >
        <h2 className="font-heading text-2xl font-black tracking-[-0.04em]">
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
            <RetroPanel
              key={resource.id}
              id={`course-resource-${resource.id}`}
              tone="card"
              className="scroll-mt-24 overflow-hidden p-0"
            >
              <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-lg font-black tracking-[-0.04em]">
                      {resource.title}
                    </h3>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {resource.type}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {resource.courseTitle} · {resource.lessonTitle}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
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
                className="border-t-2 border-border bg-[color:var(--surface-muted)] px-5 py-4"
              >
                <input type="hidden" name="resourceId" value={resource.id} />
                <div className="grid gap-3 md:grid-cols-4">
                  <label className="flex flex-col gap-2 md:col-span-2">
                    <Label>Title</Label>
                    <Input
                      name="title"
                      minLength={3}
                      defaultValue={resource.title}
                      className="h-10 text-xs"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <Label>Type</Label>
                    <select
                      name="type"
                      defaultValue={resource.type}
                      className={selectClassName}
                    >
                      <option value="file">File</option>
                      <option value="pdf">PDF</option>
                      <option value="link">Link</option>
                    </select>
                  </label>

                  <div className="flex items-end">
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      Save
                    </Button>
                  </div>

                  <label className="flex flex-col gap-2 md:col-span-4">
                    <Label>Link URL</Label>
                    <Input
                      name="url"
                      type="url"
                      defaultValue={resource.url}
                      placeholder="https://..."
                      className="h-10 text-xs"
                    />
                  </label>
                </div>
              </form>

              <div className="border-t-2 border-border px-5 py-3">
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
                className="flex justify-end border-t-2 border-border px-5 py-3"
              >
                <input type="hidden" name="resourceId" value={resource.id} />
                <Button
                  type="submit"
                  variant="destructive"
                  size="xs"
                >
                  Delete resource
                </Button>
              </form>
            </RetroPanel>
          ))
        )}
      </section>

      {/* Create standalone resource form */}
      <RetroPanel
        id="create-standalone-resource"
        tone="accent"
        className="scroll-mt-24 overflow-hidden p-0"
      >
        <div className="flex items-center gap-2 border-b-2 border-border bg-[color:var(--surface-secondary)] px-5 py-3">
          <Plus className="size-4 text-muted-foreground" />
          <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
            Create Standalone Resource
          </h2>
        </div>
        <form
          action={createStandaloneResourceAction}
          className="grid gap-4 p-5 md:grid-cols-2"
        >
          <label className="flex flex-col gap-2 md:col-span-2">
            <Label>Title</Label>
            <Input
              name="title"
              required
              minLength={4}
              placeholder="Class 10 Maths formula sheet"
            />
          </label>

          <label className="flex flex-col gap-2">
            <Label>Type</Label>
            <select
              name="type"
              className={selectClassName}
            >
              <option value="notes">Notes</option>
              <option value="worksheet">Worksheet</option>
              <option value="test_paper">Test Paper</option>
              <option value="video">Video</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <Label>Access</Label>
            <select
              name="accessModel"
              className={selectClassName}
            >
              <option value="free">Free - anyone can access</option>
              <option value="paid">Paid - requires purchase</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <Label>Price (INR)</Label>
            <Input
              name="price"
              type="number"
              min={0}
              defaultValue={0}
            />
          </label>

          <label className="flex flex-col gap-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              name="description"
              rows={3}
              placeholder="Tell students what this note covers, class/subject/chapter, and how to use it."
              className="min-h-28"
            />
          </label>

          <label className="flex min-h-11 items-center gap-3 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-input px-3.5 shadow-retro-sm">
            <input
              name="isPublished"
              type="checkbox"
              className="size-4 accent-foreground"
            />
            <span className="text-sm font-semibold text-muted-foreground">
              Publish immediately
            </span>
          </label>

          <div className="flex items-end justify-end md:col-span-2">
            <Button
              type="submit"
              className="w-full min-[420px]:w-auto"
            >
              Create Resource
            </Button>
          </div>
        </form>
      </RetroPanel>

      {/* Standalone resource list */}
      <section
        id="standalone-resources"
        className="scroll-mt-24 flex flex-col gap-3"
      >
        <h2 className="font-heading text-2xl font-black tracking-[-0.04em]">
          Standalone Resources ({resources.length})
        </h2>

        {resources.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No resources yet"
            description="Create notes, worksheets, test papers, or intro videos that students can access independently — no course required."
          />
        ) : (
          resources.map((resource) => (
            <RetroPanel
              key={resource.id}
              id={`standalone-resource-${resource.id}`}
              tone={resource.isPublished ? "secondary" : "card"}
              className="scroll-mt-24 overflow-hidden p-0"
            >
              <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-lg font-black tracking-[-0.04em]">
                      {resource.title}
                    </h3>
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
                    <p className="line-clamp-2 max-w-3xl text-xs font-semibold leading-6 text-muted-foreground">
                      {resource.description}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
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
                className="border-t-2 border-border bg-[color:var(--surface-muted)] px-5 py-4"
              >
                <input type="hidden" name="resourceId" value={resource.id} />
                <div className="grid gap-3 md:grid-cols-4">
                  <label className="flex flex-col gap-2 md:col-span-2">
                    <Label>Title</Label>
                    <Input
                      name="title"
                      minLength={4}
                      defaultValue={resource.title}
                      className="h-10 text-xs"
                    />
                  </label>

                  <label className="flex flex-col gap-2 md:col-span-2">
                    <Label>Description</Label>
                    <Input
                      name="description"
                      defaultValue={resource.description}
                      className="h-10 text-xs"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <Label>Type</Label>
                    <select
                      name="type"
                      defaultValue={resource.type}
                      className={selectClassName}
                    >
                      <option value="notes">Notes</option>
                      <option value="worksheet">Worksheet</option>
                      <option value="test_paper">Test Paper</option>
                      <option value="video">Video</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-2">
                    <Label>Access</Label>
                    <select
                      name="accessModel"
                      defaultValue={resource.accessModel}
                      className={selectClassName}
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-2">
                    <Label>Price (INR)</Label>
                    <Input
                      name="price"
                      type="number"
                      min={0}
                      defaultValue={resource.price}
                      className="h-10 text-xs"
                    />
                  </label>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="flex min-h-10 items-center gap-2 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-input px-3 shadow-retro-sm">
                      <input
                        name="isPublished"
                        type="checkbox"
                        defaultChecked={resource.isPublished}
                        className="size-4 accent-foreground"
                      />
                      <span className="text-xs font-semibold">Published</span>
                    </label>
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </form>

              {/* File upload */}
              <div className="border-t-2 border-border px-5 py-3">
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
                className="flex justify-end border-t-2 border-border px-5 py-3"
              >
                <input type="hidden" name="resourceId" value={resource.id} />
                <Button
                  type="submit"
                  variant="destructive"
                  size="xs"
                >
                  Delete resource
                </Button>
              </form>
            </RetroPanel>
          ))
        )}
      </section>
    </div>
  );
}
