import { Bone } from "./Bone";
import { HeadingBone, SkeletonFrame } from "./SkeletonFrame";

/**
 * One book-card placeholder: cover plus title lines.
 * @example <BookBone />
 */
function BookBone() {
  return (
    <article className="card-surface flex gap-4 rounded-2xl p-4" aria-hidden="true">
      <Bone className="h-36 w-24 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-3 pt-1">
        <Bone className="h-5 w-2/3" />
        <Bone className="h-3 w-1/2" />
        <Bone className="h-3 w-24" />
        <Bone className="h-4 w-full" />
      </div>
    </article>
  );
}

/**
 * Book Nook skeleton: intro, shelf, and the three shelf lists.
 * @example <ReadingSkeleton /> while /reading resolves
 */
export function ReadingSkeleton() {
  return (
    <SkeletonFrame label="Loading">
      <section className="section-shell pt-16 sm:pt-24" aria-hidden="true">
        <Bone className="h-3 w-28" />
        <Bone className="mt-3 h-12 w-full max-w-md sm:h-14" />
        <Bone className="mt-5 h-4 w-full max-w-2xl" />
        <Bone className="mt-2 h-4 w-4/5 max-w-xl" />
        <Bone className="mt-4 h-3 w-40" />
        <div className="mt-8 flex flex-wrap gap-3">
          <Bone className="h-8 w-36 rounded-full" />
          <Bone className="h-8 w-20 rounded-full" />
          <Bone className="h-8 w-32 rounded-full" />
        </div>
      </section>

      <div className="section-shell mt-10" aria-hidden="true">
        <Bone className="h-64 w-full rounded-2xl sm:h-80" />
      </div>

      <section className="section-shell pt-16" aria-hidden="true">
        <HeadingBone width="w-52" />
        <div className="mt-8 grid gap-6">
          <BookBone />
        </div>
      </section>

      <section className="section-shell pt-16" aria-hidden="true">
        <HeadingBone width="w-24" />
        <div className="mt-8 grid gap-6">
          <BookBone />
          <BookBone />
          <BookBone />
        </div>
      </section>

      <section className="section-shell pt-16 pb-20 sm:pb-28" aria-hidden="true">
        <HeadingBone width="w-40" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Bone className="h-24 rounded-xl" />
          <Bone className="h-24 rounded-xl" />
          <Bone className="h-24 rounded-xl" />
          <Bone className="h-24 rounded-xl" />
          <Bone className="h-24 rounded-xl" />
          <Bone className="h-24 rounded-xl" />
        </div>
      </section>
    </SkeletonFrame>
  );
}
