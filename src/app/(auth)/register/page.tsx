import { RegisterForm } from "@/components/auth/register-form";
import { sanitizeInternalRedirectPath } from "@/lib/utils/url";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectPath =
    sanitizeInternalRedirectPath(params.redirect) ?? "/app/dashboard";

  return <RegisterForm redirectPath={redirectPath} />;
}
