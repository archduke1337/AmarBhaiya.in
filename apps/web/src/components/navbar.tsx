import { getLoggedInUser } from "@/lib/appwrite/auth";
import { getUserRole } from "@/lib/appwrite/auth-utils";
import type { Role } from "@/lib/utils/constants";

import { NavbarClient } from "./navbar-client";

function getDashboardHref(role: Role): string {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "instructor") {
    return "/instructor";
  }

  if (role === "moderator") {
    return "/moderator";
  }

  return "/app/dashboard";
}

export async function Navbar() {
  const user = await getLoggedInUser();
  const role = getUserRole(user);

  return (
    <NavbarClient
      isAuthenticated={Boolean(user)}
      dashboardHref={getDashboardHref(role)}
      firstName={user?.name?.split(" ")[0] || ""}
    />
  );
}
