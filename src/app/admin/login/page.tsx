import { LoginForm } from "@/components/cms/LoginForm";
import { cmsConfigured } from "@/lib/cms-auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  return <LoginForm configured={await cmsConfigured()} />;
}
