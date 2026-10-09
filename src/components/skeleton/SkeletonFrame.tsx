import type { ReactNode } from "react";
import { Bone } from "./Bone";

/**
 * Header and footer placeholders shared by public page skeletons.
 * @example <SkeletonFrame label="Loading">{sections}</SkeletonFrame>
 */
export function SkeletonFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground" aria-busy="true">
      <p className="sr-only">{label}</p>
      <header className="sticky top-0 z-40 border-b border-line bg-header">
        <div className="section-shell flex h-18 items-center justify-between">
          <Bone className="h-7 w-32" />
          <div className="hidden items-center gap-8 md:flex">
            <Bone className="h-3 w-14" />
            <Bone className="h-3 w-16" />
            <Bone className="h-3 w-12" />
            <Bone className="h-3 w-16" />
          </div>
          <Bone className="h-8 w-8 rounded-md md:hidden" />
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="border-t border-line">
        <div className="section-shell footer-grid py-16 sm:py-20">
          <Bone className="h-24" />
          <Bone className="h-24" />
          <Bone className="h-24" />
          <Bone className="h-24" />
        </div>
      </footer>
    </div>
  );
}

/**
 * Section title bar plus the accent underline.
 * @example <HeadingBone width="w-48" />
 */
export function HeadingBone({ width = "w-48" }: { width?: string }) {
  return (
    <div aria-hidden="true">
      <Bone className={`h-9 sm:h-10 ${width}`} />
      <Bone className="mt-3 h-1 w-24 rounded" />
    </div>
  );
}
