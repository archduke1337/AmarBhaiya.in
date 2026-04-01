import { requireAuth } from "@/lib/appwrite/auth";
import {
  upsertStudentProfileAction,
  getStudentProfile,
} from "@/actions/profile";
import { PageHeader } from "@/components/dashboard";

export default async function StudentProfileEditPage() {
  const user = await requireAuth();
  const profile = await getStudentProfile(user.$id);

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <PageHeader
        eyebrow="Profile"
        title="Your Personal Information"
        description="This information helps your instructors and the admin understand you better. Fields marked with * are optional."
      />

      <form
        action={upsertStudentProfileAction}
        className="flex flex-col gap-6"
      >
        {/* Basic Info */}
        <section className="border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">Basic Information</h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Date of Birth</span>
              <input
                name="dateOfBirth"
                type="date"
                defaultValue={profile?.dateOfBirth ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">
                Class / Grade / Year
              </span>
              <input
                name="grade"
                placeholder="e.g. Class 10, B.Tech 2nd Year"
                defaultValue={profile?.grade ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
              <span className="text-muted-foreground">School / College</span>
              <input
                name="school"
                placeholder="Your school or college name"
                defaultValue={profile?.school ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
              <span className="text-muted-foreground">
                Hobbies / Interests *
              </span>
              <input
                name="hobby"
                placeholder="e.g. coding, cricket, reading, gaming"
                defaultValue={profile?.hobby ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
              <span className="text-muted-foreground">Short Bio *</span>
              <textarea
                name="bio"
                rows={3}
                placeholder="Tell us a bit about yourself..."
                defaultValue={profile?.bio ?? ""}
                className="border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>
        </section>

        {/* Location */}
        <section className="border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">Location</h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">City</span>
              <input
                name="city"
                placeholder="Your city"
                defaultValue={profile?.city ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">State / Province</span>
              <input
                name="state"
                placeholder="Your state"
                defaultValue={profile?.state ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>
          </div>
        </section>

        {/* Guardian */}
        <section className="border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">Guardian Information *</h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">
                Parent / Guardian Name
              </span>
              <input
                name="guardianName"
                placeholder="Parent or guardian name"
                defaultValue={profile?.guardianName ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">
                Guardian Phone Number
              </span>
              <input
                name="guardianPhone"
                type="tel"
                placeholder="+91 98765 43210"
                defaultValue={profile?.guardianPhone ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="h-10 bg-foreground px-6 text-sm text-background transition-opacity hover:opacity-90"
          >
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
