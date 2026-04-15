import { requireAuth } from "@/lib/appwrite/auth";
import {
  upsertStudentProfileAction,
  getStudentProfile,
} from "@/actions/profile";
import { updateDisplayNameAction, changePasswordAction } from "@/actions/account";
import { sendVerificationEmailAction } from "@/actions/verification";
import { AvatarUploadForm } from "@/components/profile/avatar-upload-form";
import { PageHeader } from "@/components/dashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        eyebrow="Profile"
        title="Profile ko student context ke hisaab se rakho."
        description="Yeh details instructors ko tumhari class, school, city, aur learning context samajhne mein help karti hain. Optional fields blank chhod sakte ho."
      />

      {/* Email verification banner */}
      {!user.emailVerification && (
        <RetroPanel tone="secondary" className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">Email verify karna baaki hai</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {user.email} verify kar loge toh account updates aur recovery safer ho jayegi.
            </p>
          </div>
          <form action={sendVerificationEmailAction}>
            <Button
              type="submit"
              variant="outline"
            >
              Send verification email
            </Button>
          </form>
        </RetroPanel>
      )}

      {user.emailVerification && (
        <RetroPanel tone="accent" className="text-sm font-semibold">
          Email verified · {user.email}
        </RetroPanel>
      )}

      <RetroPanel tone="card" className="space-y-0 p-0">
        <div className="border-b-2 border-border px-5 py-3">
          <h2 className="font-heading text-sm font-black uppercase tracking-[0.14em]">Avatar</h2>
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
              <p className="text-sm font-semibold">
                {avatarFileId ? "Current avatar uploaded" : "No avatar uploaded yet"}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                JPG, PNG, or WEBP up to 2 MB.
              </p>
            </div>
          </div>

          <AvatarUploadForm />
        </div>
      </RetroPanel>

      <form
        action={upsertStudentProfileAction}
        className="flex flex-col gap-6"
      >
        {/* Basic Info */}
        <RetroPanel tone="card" className="space-y-0 p-0">
          <div className="border-b-2 border-border px-5 py-3">
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.14em]">Basic information</h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                defaultValue={profile?.dateOfBirth ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Class / grade / year</Label>
              <Input
                id="grade"
                name="grade"
                placeholder="e.g. Class 10, B.Tech 2nd Year"
                defaultValue={profile?.grade ?? ""}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="school">School / college</Label>
              <Input
                id="school"
                name="school"
                placeholder="Your school or college name"
                defaultValue={profile?.school ?? ""}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="hobby">Hobbies / interests</Label>
              <Input
                id="hobby"
                name="hobby"
                placeholder="e.g. coding, cricket, reading, gaming"
                defaultValue={profile?.hobby ?? ""}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio">Short bio</Label>
              <Textarea
                id="bio"
                name="bio"
                rows={3}
                placeholder="Class, goal, favourite subject, ya jis cheez mein help chahiye woh likh sakte ho..."
                defaultValue={profile?.bio ?? ""}
              />
            </div>
          </div>
        </RetroPanel>

        {/* Location */}
        <RetroPanel tone="card" className="space-y-0 p-0">
          <div className="border-b-2 border-border px-5 py-3">
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.14em]">Location</h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                placeholder="Your city"
                defaultValue={profile?.city ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                placeholder="Your state"
                defaultValue={profile?.state ?? ""}
              />
            </div>
          </div>
        </RetroPanel>

        {/* Guardian */}
        <RetroPanel tone="card" className="space-y-0 p-0">
          <div className="border-b-2 border-border px-5 py-3">
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.14em]">Guardian information</h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guardianName">Parent / guardian name</Label>
              <Input
                id="guardianName"
                name="guardianName"
                placeholder="Parent or guardian name"
                defaultValue={profile?.guardianName ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianPhone">Guardian phone number</Label>
              <Input
                id="guardianPhone"
                name="guardianPhone"
                type="tel"
                placeholder="+91 98765 43210"
                defaultValue={profile?.guardianPhone ?? ""}
              />
            </div>
          </div>
        </RetroPanel>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="secondary"
            size="lg"
          >
            Save profile
          </Button>
        </div>
      </form>

      {/* Account Settings */}
      <RetroPanel tone="card" className="space-y-0 p-0">
        <div className="border-b-2 border-border px-5 py-3">
          <h2 className="font-heading text-sm font-black uppercase tracking-[0.14em]">Account settings</h2>
        </div>

        {/* Update Name */}
        <form action={updateDisplayNameAction} className="border-b-2 border-border p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                name="name"
                required
                minLength={2}
                defaultValue={user.name}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                variant="outline"
              >
                Update name
              </Button>
            </div>
          </div>
        </form>

        {/* Change Password */}
        <form action={changePasswordAction} className="p-5">
          <h3 className="mb-4 font-heading text-sm font-black uppercase tracking-[0.14em]">
            Change password
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              variant="outline"
            >
              Change password
            </Button>
          </div>
        </form>
      </RetroPanel>
    </div>
  );
}
