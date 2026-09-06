import type { Metadata } from "next";
import "./wp-admin.css";

export const metadata: Metadata = {
  title: "Dashboard ‹ Portfolio",
  robots: { index: false, follow: false },
};

/**
 * Renders the admin layout (noindex shell).
 * @example default export for /admin
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
