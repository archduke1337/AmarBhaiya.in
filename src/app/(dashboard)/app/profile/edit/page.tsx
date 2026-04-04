import { requireAuth } from "@/lib/appwrite/auth";
import {
  upsertStudentProfileAction,
  getStudentProfile,
} from "@/actions/profile";
import { updateDisplayNameAction, changePasswordAction } from "@/actions/account";
import { sendVerificationEmailAction } from "@/actions/verification";
import { uploadAvatarAction } from "@/actions/upload";
import { PageHeader } from "@/components/dashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getInitials(value: string): string {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "U";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default async function StudentProfileEditPage() {
  const user = await requireAuth();
  const profile = await getStudentProfile();
  const avatarFileId = String(user.prefs?.avatarFileId ?? "");
  const avatarAlt = user.name || user.email || "Avatar";
  const avatarFallback = getInitials(user.name || user.email || "User");

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <PageHeader
        eyebrow="Profile"
        title="Your Personal Information"
        description="This information helps your instructors and the admin understand you better. Fields marked with * are optional."
      />

      {/* Email verification banner */}
      {!user.emailVerification && (
        <div className="flex items-center justify-between border border-amber-500/30 bg-amber-500/5 px-5 py-3">
          <div>
            <p className="text-sm font-medium">Email not verified</p>
            <p className="text-xs text-muted-foreground">
              Verify your email ({user.email}) to unlock all features.
            </p>
          </div>
          <form action={sendVerificationEmailAction}>
            <button
              type="submit"
              className="h-9 border border-border px-4 text-xs transition-colors hover:bg-muted"
            >
              Send Verification Email
            </button>
          </form>
        </div>
      )}

      {user.emailVerification && (
        <div className="flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/5 px-5 py-3 text-sm">
          <span>✓</span>
          <span>Email verified — {user.email}</span>
        </div>
      )}

      <section className="border border-border">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">Avatar</h2>
        </div>
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar data-size="lg">
              {avatarFileId ? (
                <AvatarImage
                  src="/api/avatar/current"
                  alt={avatarAlt}
                />
              ) : null}
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {avatarFileId ? "Current avatar uploaded" : "No avatar uploaded yet"}
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, or WEBP up to 2 MB.
              </p>
            </div>
          </div>

          <form
            action={uploadAvatarAction}
            encType="multipart/form-data"
            className="flex flex-wrap items-center gap-3"
          >
            <input
              type="file"
              name="file"
              accept=".jpg,.jpeg,.png,.webp"
              required
              className="text-xs file:mr-2 file:h-8 file:border file:border-border file:bg-background file:px-3 file:text-xs"
            />
            <button
              type="submit"
              className="h-8 border border-border px-3 text-xs transition-colors hover:bg-muted"
            >
              Upload Avatar
            </button>
          </form>
        </div>
      </section>

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

      {/* Account Settings */}
      <section className="border border-border">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">Account Settings</h2>
        </div>

        {/* Update Name */}
        <form action={updateDisplayNameAction} className="border-b border-border p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Display Name</span>
              <input
                name="name"
                required
                minLength={2}
                defaultValue={user.name}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="h-10 border border-border px-4 text-sm transition-colors hover:bg-muted"
              >
                Update Name
              </button>
            </div>
          </div>
        </form>

        {/* Change Password */}
        <form action={changePasswordAction} className="p-5">
          <h3 className="mb-3 text-sm font-medium">Change Password</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Current Password</span>
              <input
                name="currentPassword"
                type="password"
                required
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">New Password</span>
              <input
                name="newPassword"
                type="password"
                required
                minLength={8}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Confirm Password</span>
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="h-10 border border-border px-4 text-sm transition-colors hover:bg-muted"
            >
              Change Password
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
