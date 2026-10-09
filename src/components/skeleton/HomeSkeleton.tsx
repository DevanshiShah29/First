import { Bone } from "./Bone";
import { HeadingBone, SkeletonFrame } from "./SkeletonFrame";

/**
 * Homepage skeleton: hero plus About, Experience, Projects, Skills, and Contact.
 * @example <HomeSkeleton /> while / resolves
 */
export function HomeSkeleton() {
  return (
    <SkeletonFrame label="Loading">
      <section className="hero-viewport-min flex items-center py-20 sm:py-28" aria-hidden="true">
        <div className="section-shell w-full">
          <Bone className="h-4 w-24" />
          <Bone className="mt-5 h-12 w-full max-w-xl sm:h-16" />
          <Bone className="mt-4 h-4 w-full max-w-lg" />
          <Bone className="mt-2 h-4 w-4/5 max-w-md" />
          <div className="mt-8 flex flex-wrap gap-3">
            <Bone className="h-11 w-36 rounded-lg" />
            <Bone className="h-11 w-40 rounded-lg" />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-hidden="true">
        <div className="section-shell grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <HeadingBone width="w-40" />
            <Bone className="mt-6 h-4 w-full" />
            <Bone className="mt-2 h-4 w-full" />
            <Bone className="mt-2 h-4 w-3/4" />
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Bone className="h-20 rounded-xl" />
              <Bone className="h-20 rounded-xl" />
              <Bone className="h-20 rounded-xl" />
            </div>
          </div>
          <div className="card-surface space-y-4 rounded-2xl p-8">
            <Bone className="h-3 w-24" />
            <Bone className="h-8 w-48" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-5/6" />
            <Bone className="h-4 w-2/3" />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-hidden="true">
        <div className="section-shell">
          <HeadingBone width="w-44" />
          <Bone className="mt-4 h-4 w-full max-w-2xl" />
          <div className="mt-10 flex flex-col gap-6 sm:gap-8">
            <article className="card-surface space-y-3 rounded-2xl p-6">
              <Bone className="h-3 w-28" />
              <Bone className="h-7 w-56" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-4/5" />
            </article>
            <article className="card-surface space-y-3 rounded-2xl p-6">
              <Bone className="h-3 w-24" />
              <Bone className="h-7 w-48" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-3/4" />
            </article>
            <article className="card-surface space-y-3 rounded-2xl p-6">
              <Bone className="h-3 w-32" />
              <Bone className="h-7 w-52" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-5/6" />
            </article>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-hidden="true">
        <div className="section-shell">
          <HeadingBone width="w-36" />
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <article className="card-surface space-y-3 rounded-2xl p-6">
              <Bone className="h-6 w-32" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-5/6" />
              <div className="flex gap-2 pt-4">
                <Bone className="h-6 w-16 rounded-full" />
                <Bone className="h-6 w-20 rounded-full" />
              </div>
            </article>
            <article className="card-surface space-y-3 rounded-2xl p-6">
              <Bone className="h-6 w-40" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-4/5" />
              <div className="flex gap-2 pt-4">
                <Bone className="h-6 w-14 rounded-full" />
                <Bone className="h-6 w-16 rounded-full" />
              </div>
            </article>
            <article className="card-surface space-y-3 rounded-2xl p-6">
              <Bone className="h-6 w-28" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-3/4" />
              <div className="flex gap-2 pt-4">
                <Bone className="h-6 w-20 rounded-full" />
                <Bone className="h-6 w-12 rounded-full" />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-hidden="true">
        <div className="section-shell">
          <HeadingBone width="w-64" />
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div className="card-surface space-y-4 rounded-2xl p-6">
              <Bone className="h-6 w-36" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Bone className="h-16 rounded-xl" />
                <Bone className="h-16 rounded-xl" />
                <Bone className="h-16 rounded-xl" />
                <Bone className="h-16 rounded-xl" />
                <Bone className="h-16 rounded-xl" />
                <Bone className="h-16 rounded-xl" />
              </div>
            </div>
            <div className="card-surface space-y-4 rounded-2xl p-6">
              <Bone className="h-6 w-40" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Bone className="h-16 rounded-xl" />
                <Bone className="h-16 rounded-xl" />
                <Bone className="h-16 rounded-xl" />
                <Bone className="h-16 rounded-xl" />
                <Bone className="h-16 rounded-xl" />
                <Bone className="h-16 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-hidden="true">
        <div className="section-shell">
          <div className="card-surface contact-grid rounded-2xl p-6 sm:p-8">
            <div className="space-y-4">
              <Bone className="h-9 w-64 sm:h-10" />
              <Bone className="h-4 w-full max-w-sm" />
              <Bone className="h-11 w-full rounded-lg" />
              <Bone className="h-11 w-full rounded-lg" />
              <Bone className="h-28 w-full rounded-lg" />
              <Bone className="h-11 w-36 rounded-lg" />
            </div>
            <Bone className="h-72 w-full rounded-2xl" />
          </div>
        </div>
      </section>
    </SkeletonFrame>
  );
}
