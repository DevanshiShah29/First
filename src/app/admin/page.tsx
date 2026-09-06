import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminApp } from "@/components/cms/AdminApp";
import { loadContent } from "@/content/store";
import { verifySessionCookie } from "@/server/cms-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = (await cookies()).get("cms_session")?.value;
  if (!(await verifySessionCookie(token))) {
    redirect("/admin/login");
  }
  const content = await loadContent();
  return <AdminApp initial={content} />;
}
