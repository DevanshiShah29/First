import { LoginForm } from "@/components/cms/LoginForm";
import { cmsConfigured } from "@/server/cms-auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  return <LoginForm configured={await cmsConfigured()} />;
}
