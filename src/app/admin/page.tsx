import { AdminApp } from "@/components/cms/AdminApp";
import { loadContent } from "@/content/store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const content = await loadContent();
  return <AdminApp initial={content} />;
}
