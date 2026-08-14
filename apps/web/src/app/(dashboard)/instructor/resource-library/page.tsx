import { Download, Eye, EyeOff, FileText, Plus } from "lucide-react";

import { requireRole } from "@/lib/appwrite/auth";
import {
  createStandaloneResourceFormAction,
} from "@/actions/form-wrappers";
import { getInstructorResources } from "@/actions/resources";
import { PageHeader, EmptyState, StatGrid, StatCard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResourceLibraryTable } from "./resource-library-table";

const selectClassName =
  "h-11 w-full rounded-[calc(var(--radius)+2px)] border-2 border-border bg-input px-3.5 text-sm font-semibold text-foreground shadow-retro-sm outline-none transition-all focus-visible:-translate-y-px focus-visible:translate-x-px focus-visible:shadow-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

export default async function InstructorResourceLibraryPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const resources = await getInstructorResources({ userId: user.$id, role });

  const published = resources.filter((r) => r.isPublished).length;
  const drafts = resources.filter((r) => !r.isPublished).length;
  const free = resources.filter((r) => r.accessModel === "free").length;
  const paid = resources.filter((r) => r.accessModel === "paid").length;
  const totalDownloads = resources.reduce((sum, r) => sum + r.downloadCount, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Instructor · Resource Library"
        title="Resource Library"
        description={`${resources.length} resources — notes, worksheets, test papers, and more. Manage your paid and free study materials that students can access independently.`}
      />

      <StatGrid columns={4}>
        <StatCard
          label="Total Resources"
          value={resources.length}
          icon={FileText}
          description={`${published} published, ${drafts} drafts`}
        />
        <StatCard
          label="Free"
          value={free}
          icon={Eye}
          description="Open access"
        />
        <StatCard
          label="Paid"
          value={paid}
          icon={EyeOff}
          description="Requires purchase"
        />
        <StatCard
          label="Total Downloads"
          value={totalDownloads}
          icon={Download}
          description="Across all resources"
        />
      </StatGrid>

      {/* Create form */}
      <div
        id="create-resource"
        className="scroll-mt-24 overflow-hidden rounded-2xl border border-border/40 bg-surface"
      >
        <div className="flex items-center gap-2 border-b-2 border-border bg-[color:var(--surface-secondary)] px-5 py-3">
          <Plus className="size-4 text-muted-foreground" />
          <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
            Create New Resource
          </h2>
        </div>
        <form action={createStandaloneResourceFormAction}
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
            <select name="type" className={selectClassName}>
              <option value="notes">Notes</option>
              <option value="worksheet">Worksheet</option>
              <option value="test_paper">Test Paper</option>
              <option value="video">Video</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <Label>Access</Label>
            <select name="accessModel" className={selectClassName}>
              <option value="free">Free — anyone can access</option>
              <option value="paid">Paid — requires purchase</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <Label>Price (INR)</Label>
            <Input name="price" type="number" min={0} defaultValue={0} />
          </label>

          <label className="flex flex-col gap-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              name="description"
              rows={3}
              placeholder="Tell students what this resource covers, class/subject/chapter, and how to use it."
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
            <Button type="submit" className="w-full min-[420px]:w-auto">
              Create Resource
            </Button>
          </div>
        </form>
      </div>

      {/* Resource list with search/filter */}
      {resources.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resources yet"
          description="Create notes, worksheets, test papers, or intro videos that students can access independently — no course required."
        />
      ) : (
        <ResourceLibraryTable resources={resources} />
      )}
    </div>
  );
}
