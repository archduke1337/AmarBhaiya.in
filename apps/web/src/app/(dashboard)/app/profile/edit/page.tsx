import { requireAuth } from "@/server/appwrite/auth";
import {
  upsertStudentProfileFormAction,
  upsertBillingInfoFormAction,
  updateDisplayNameFormAction,
  changePasswordFormAction,
} from "@/server/actions/form-wrappers";
import {
  getStudentProfile,
  getBillingInfo,
} from "@/server/actions/profile";
import { sendVerificationEmailAction } from "@/server/actions/verification";
import { AvatarUploadForm } from "@/components/profile/avatar-upload-form";
import { PageHeader } from "@/components/dashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [profile, billing] = await Promise.all([
    getStudentProfile(),
    getBillingInfo(),
  ]);
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
        <div className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-surface p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">Email verify karna baaki hai</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {user.email} verify kar loge toh account updates aur recovery safer ho jayegi.
            </p>
          </div>
          <form action={async () => { "use server"; await sendVerificationEmailAction(); }}>
            <Button
              type="submit"
              variant="outline"
            >
              Send verification email
            </Button>
          </form>
        </div>
      )}

      {user.emailVerification && (
        <div className="rounded-2xl border border-border/40 bg-surface p-5 text-sm font-semibold">
          Email verified · {user.email}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
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
      </div>

      <form
        action={upsertStudentProfileFormAction}
        className="flex flex-col gap-6"
      >
        {/* Basic Info */}
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
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
        </div>

        {/* Location */}
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
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
        </div>

        {/* Guardian */}
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
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
        </div>

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

      {/* Billing info — used at checkout, same table as /app/billing */}
      <form id="billing" action={upsertBillingInfoFormAction} className="flex flex-col gap-6">
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
          <div className="border-b-2 border-border px-5 py-3 flex items-center justify-between">
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.14em]">Billing information</h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Used at checkout · invoices</span>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bf-firstName">First name</Label>
              <Input id="bf-firstName" name="firstName" required placeholder="Gaurav" defaultValue={billing?.firstName ?? user.name?.split(" ")[0] ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bf-lastName">Last name</Label>
              <Input id="bf-lastName" name="lastName" required placeholder="Sharma" defaultValue={billing?.lastName ?? user.name?.split(" ").slice(1).join(" ") ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bf-phone">Phone</Label>
              <Input id="bf-phone" name="phone" type="tel" required placeholder="+91 98765 43210" defaultValue={billing?.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bf-parentName">Parent / guardian name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="bf-parentName" name="parentName" placeholder="Parent name" defaultValue={billing?.parentName ?? profile?.guardianName ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bf-parentPhone">Parent phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="bf-parentPhone" name="parentPhone" type="tel" placeholder="+91 98765 43210" defaultValue={billing?.parentPhone ?? profile?.guardianPhone ?? ""} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bf-addressLine1">Address line 1</Label>
              <Input id="bf-addressLine1" name="addressLine1" required placeholder="House/Flat No., Street" defaultValue={billing?.addressLine1 ?? ""} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bf-addressLine2">Address line 2 <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="bf-addressLine2" name="addressLine2" placeholder="Apartment, landmark" defaultValue={billing?.addressLine2 ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bf-city">City</Label>
              <Input id="bf-city" name="city" required placeholder="Mumbai" defaultValue={billing?.city ?? profile?.city ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bf-state">State</Label>
              <Input id="bf-state" name="state" required placeholder="Maharashtra" defaultValue={billing?.state ?? profile?.state ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bf-country">Country</Label>
              <Input id="bf-country" name="country" required placeholder="India" defaultValue={billing?.country ?? "India"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bf-zipcode">PIN code</Label>
              <Input id="bf-zipcode" name="zipcode" required placeholder="400001" pattern="\d{6}" defaultValue={billing?.zipcode ?? ""} />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="secondary" size="lg">
            Save billing info
          </Button>
        </div>
      </form>

      {/* Account Settings */}
      <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
        <div className="border-b-2 border-border px-5 py-3">
          <h2 className="font-heading text-sm font-black uppercase tracking-[0.14em]">Account settings</h2>
        </div>

        {/* Update Name */}
        <form action={updateDisplayNameFormAction} className="border-b-2 border-border p-5">
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
        <form action={changePasswordFormAction} className="p-5">
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
      </div>
    </div>
  );
}
