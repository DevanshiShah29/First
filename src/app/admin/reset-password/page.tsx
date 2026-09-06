import { ResetPasswordForm } from "@/components/cms/ResetPasswordForm";

export const dynamic = "force-dynamic";

/**
 * Renders the CMS reset-password page from ?token.
 * @example <ResetPasswordPage /> for /admin/reset-password
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params.token;
  const token = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] ?? "" : "";
  return <ResetPasswordForm token={token} />;
}
