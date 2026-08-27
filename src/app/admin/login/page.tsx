import { LoginForm } from "@/components/cms/LoginForm";
import { cmsConfigured } from "@/lib/cms-auth";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginForm configured={cmsConfigured()} />;
}
