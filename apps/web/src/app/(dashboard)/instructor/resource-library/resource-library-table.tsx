"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Eye, EyeOff, Download, Edit2, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DirectAppwriteUploadForm } from "@/components/instructor/direct-appwrite-upload-form";
import {
  updateStandaloneResourceFormAction,
  deleteStandaloneResourceFormAction,
} from "@/actions/form-wrappers";

type Resource = {
  id: string;
  title: string;
  description: string;
  type: string;
  accessModel: string;
  price: number;
  fileId: string;
  downloadCount: number;
  isPublished: boolean;
  createdAt: string;
};

const selectClassName =
  "h-10 w-full rounded-[calc(var(--radius)+2px)] border-2 border-border bg-input px-3 text-xs font-semibold text-foreground shadow-retro-sm outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/40";

export function ResourceLibraryTable({ resources }: { resources: Resource[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return resources.filter((r) => {
      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && r.isPublished) ||
        (statusFilter === "draft" && !r.isPublished) ||
        (statusFilter === "free" && r.accessModel === "free") ||
        (statusFilter === "paid" && r.accessModel === "paid");
      return matchesSearch && matchesStatus;
    });
  }, [resources, search, statusFilter]);

  const counts = useMemo(
    () => ({
      all: resources.length,
      published: resources.filter((r) => r.isPublished).length,
      draft: resources.filter((r) => !r.isPublished).length,
      free: resources.filter((r) => r.accessModel === "free").length,
      paid: resources.filter((r) => r.accessModel === "paid").length,
    }),
    [resources]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, type, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-sm rounded-xl border border-border/40 bg-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: "all", label: "All" },
              { key: "published", label: "Published" },
              { key: "draft", label: "Drafts" },
              { key: "free", label: "Free" },
              { key: "paid", label: "Paid" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  statusFilter === key
                    ? "bg-foreground text-background border-foreground"
                    : "border-border/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                <span className="tabular-nums">{counts[key as keyof typeof counts]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {(search || statusFilter !== "all") && (
        <p className="text-xs font-semibold text-muted-foreground tabular-nums">
          Showing {filtered.length} of {resources.length} resources
        </p>
      )}

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/40 px-5 py-12 text-center text-sm font-semibold text-muted-foreground">
            No resources match your search or filter.
          </div>
        ) : (
          filtered.map((resource) => (
            <div
              key={resource.id}
              id={`resource-${resource.id}`}
              className="scroll-mt-24 overflow-hidden rounded-2xl border border-border/40 bg-surface"
            >
              <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-lg font-black tracking-[-0.04em]">
                      {resource.title}
                    </h3>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {resource.type.replace("_", " ")}
                    </Badge>
                    <Badge
                      variant={resource.accessModel === "free" ? "default" : "outline"}
                      className="text-[10px]"
                    >
                      {resource.accessModel === "free"
                        ? "FREE"
                        : formatCurrency(resource.price)}
                    </Badge>
                    {resource.isPublished ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                        <Eye className="size-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                        <EyeOff className="size-3" /> Draft
                      </span>
                    )}
                  </div>
                  {resource.description && (
                    <p className="line-clamp-2 max-w-3xl text-xs font-semibold leading-6 text-muted-foreground">
                      {resource.description}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Download className="size-3" />
                      {resource.downloadCount} downloads
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => setEditingId(editingId === resource.id ? null : resource.id)}
                  >
                    <Edit2 className="size-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>

              {editingId === resource.id && (
                <>
                  <form
                    action={updateStandaloneResourceFormAction}
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
                        <select name="type" defaultValue={resource.type} className={selectClassName}>
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
                        <Button type="submit" variant="secondary" size="sm">
                          Save
                        </Button>
                      </div>
                    </div>
                  </form>

                  <div className="border-t-2 border-border px-5 py-3">
                    <DirectAppwriteUploadForm
                      kind="standalone-resource"
                      resourceId={resource.id}
                      accept=".pdf,.zip,.txt,.doc,.docx,.ppt,.pptx,.mp4,.webm,.mov,.mkv"
                      statusLabel={resource.fileId ? "File attached" : "No file"}
                      buttonLabel="Upload"
                      successMessage="Resource file uploaded."
                      helperText="Supports docs, archives, and media up to 200 MB."
                    />
                  </div>

                  <form
                    action={deleteStandaloneResourceFormAction}
                    className="flex justify-end border-t-2 border-border px-5 py-3"
                  >
                    <input type="hidden" name="resourceId" value={resource.id} />
                    <Button type="submit" variant="destructive" size="xs">
                      Delete resource
                    </Button>
                  </form>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
