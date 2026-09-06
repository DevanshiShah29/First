import type { SkillGroup } from "@/content/types";
import { Fade } from "@/components/Fade";
import { SkillMark } from "@/components/icons";

/**
 * Renders skills and technology groups.
 * @example <SkillsSection skillGroups={skills} techGroups={tech} />
 */
export function SkillsSection({
  skillGroups = [],
  techGroups = [],
}: {
  skillGroups?: SkillGroup[];
  techGroups?: SkillGroup[];
}) {
  return (
    <section id="skills" tabIndex={-1} aria-labelledby="skills-heading" className="py-16 sm:py-24">
      <div className="section-shell">
        <Fade y={24}>
          <h2 id="skills-heading" className="text-3xl font-semibold text-foreground sm:text-4xl">
            Skills &amp; Technologies
          </h2>
          <div className="accent-underline mt-3 h-1 w-48 rounded" />
        </Fade>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {[...techGroups, ...skillGroups].map((group, gi) => (
            <Fade key={`${group.title}-${gi}`} y={22} delay={0.08 * (gi % 2)}>
              <div className="skill-group-card card-surface rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-foreground">{group.title}</h3>
                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {group.items.map((item) => (
                    <div
                      key={item.name}
                      className="skill-tile flex flex-col items-center gap-2 rounded-xl border border-line bg-chip p-4 text-muted"
                    >
                      <SkillMark
                        icon={item.icon}
                        color={item.color}
                        src={item.iconUrl}
                        className="skill-mark"
                      />
                      <span className="text-center text-xs font-medium text-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Fade>
          ))}
        </div>
      </div>
    </section>
  );
}
