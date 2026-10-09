import { Bone } from "./Bone";
import { HeadingBone, SkeletonFrame } from "./SkeletonFrame";

/**
 * One craft note card placeholder.
 * @example <NoteBone />
 */
function NoteBone() {
  return (
    <li className="card-surface space-y-3 rounded-2xl border border-line p-5 sm:p-6" aria-hidden="true">
      <Bone className="h-5 w-2/3" />
      <Bone className="h-4 w-full" />
      <Bone className="h-4 w-5/6" />
    </li>
  );
}

/**
 * Craft page skeleton: intro plus two note groups.
 * @example <CraftSkeleton /> while /craft resolves
 */
export function CraftSkeleton() {
  return (
    <SkeletonFrame label="Loading">
      <article className="section-shell py-16 sm:py-24">
        <Bone className="h-3 w-24" />
        <Bone className="mt-3 h-12 w-full max-w-lg sm:h-14" />
        <Bone className="mt-5 h-4 w-full max-w-2xl" />
        <Bone className="mt-2 h-4 w-4/5 max-w-xl" />
        <Bone className="mt-4 h-3 w-64" />

        <div className="mt-14 space-y-14">
          <section aria-hidden="true">
            <HeadingBone width="w-48" />
            <Bone className="mt-4 h-4 w-full max-w-2xl" />
            <ul className="mt-8 space-y-6">
              <NoteBone />
              <NoteBone />
            </ul>
          </section>
          <section aria-hidden="true">
            <HeadingBone width="w-40" />
            <Bone className="mt-4 h-4 w-full max-w-xl" />
            <ul className="mt-8 space-y-6">
              <NoteBone />
              <NoteBone />
            </ul>
          </section>
        </div>
      </article>
    </SkeletonFrame>
  );
}
