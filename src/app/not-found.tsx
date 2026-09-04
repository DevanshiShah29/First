import Link from "next/link";

export default function NotFound() {
  return (
    <main className="section-shell flex min-h-screen flex-col items-center justify-center py-24 text-center">
      <p className="kicker">404</p>
      <h1 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl">
        This page doesn&apos;t exist.
      </h1>
      <p className="mt-3 max-w-md text-muted">The link may be old, or the page was never built.</p>
      <Link
        href="/"
        className="btn-primary mt-8 inline-flex items-center rounded-lg px-6 py-3 text-sm font-semibold text-foreground hover:-translate-y-0.5"
      >
        Back home
      </Link>
    </main>
  );
}
