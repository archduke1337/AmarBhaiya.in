import { FileText, Plus, Download, Eye, EyeOff } from "lucide-react";

import { requireRole } from "@/lib/appwrite/auth";
import {
  createStandaloneResourceAction,
  getInstructorResources,
  updateStandaloneResourceAction,
} from "@/actions/resources";
import { uploadResourceFileAction } from "@/actions/upload";
import { deleteStandaloneResourceAction } from "@/actions/resources";
import { formatCurrency } from "@/lib/utils/format";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function InstructorResourcesPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const resources = await getInstructorResources({ userId: user.$id, role });

  const published = resources.filter((r) => r.isPublished).length;
  const free = resources.filter((r) => r.accessModel === "free").length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Instructor · Resources"
        title="Standalone Resources"
        description={`${resources.length} total — ${published} published, ${free} free, ${resources.length - free} paid. These are independent materials NOT tied to any course.`}
      />

      {/* Create resource form */}
      <section className="border border-border">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Plus className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Create New Resource</h2>
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

      {/* Resource list */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">
          Your Resources ({resources.length})
        </h2>

        {resources.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No resources yet"
            description="Create notes, worksheets, test papers, or demo videos that students can access independently — no course required."
          />
        ) : (
          resources.map((resource) => (
            <article key={resource.id} className="border border-border">
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
              <form
                action={uploadResourceFileAction}
                encType="multipart/form-data"
                className="flex items-center gap-3 border-t border-border px-5 py-3"
              >
                <input type="hidden" name="resourceId" value={resource.id} />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {resource.fileId ? "✓ File attached" : "No file"}
                </span>
                <input
                  type="file"
                  name="file"
                  className="flex-1 text-xs file:mr-2 file:h-8 file:border file:border-border file:bg-background file:px-3 file:text-xs"
                />
                <button
                  type="submit"
                  className="h-8 shrink-0 border border-border px-3 text-xs hover:bg-muted transition-colors"
                >
                  Upload
                </button>
              </form>

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
