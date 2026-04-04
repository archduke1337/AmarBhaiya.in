import { LoginForm } from "@/components/auth/login-form";
import { sanitizeInternalRedirectPath } from "@/lib/utils/url";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectPath =
    sanitizeInternalRedirectPath(params.redirect) ?? "/app/dashboard";

  return <LoginForm redirectPath={redirectPath} />;
}
