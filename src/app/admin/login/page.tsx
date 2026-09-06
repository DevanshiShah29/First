import { LoginForm } from "@/components/cms/LoginForm";
import { cmsConfigured } from "@/server/cms-auth";

export const dynamic = "force-dynamic";

/**
 * Renders the CMS login page.
 * @example <LoginPage /> default export for /admin/login
 */
export default async function LoginPage() {
  return <LoginForm configured={await cmsConfigured()} />;
}
