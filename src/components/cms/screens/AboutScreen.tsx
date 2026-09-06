"use client";

import type { ContentData } from "@/content/types";
import { Metabox, SectionTools } from "../components/Metabox";
import { Field, TextArea, TextInput } from "../fields";
import { move } from "../types";

interface AboutScreenProps {
  data: ContentData;
  setData: (data: ContentData) => void;
  sectionState: Record<string, boolean>;
  expandAll: (ids: string[]) => void;
  collapseAll: (ids: string[]) => void;
  save: () => Promise<void>;
  dirty: boolean;
}

export function AboutScreen({
  data,
  setData,
  sectionState,
  expandAll,
  collapseAll,
  save,
  dirty,
}: AboutScreenProps) {
  const site = data.site;
  const sectionIds = ["about_copy", "about_stats"];

  return (
    <>
      <h1 className="wp-screen-title">About</h1>
      <p className="wp-sub">Bio, philosophy, experience intro, and homepage stats.</p>
      <SectionTools
        onExpandAll={() => expandAll(sectionIds)}
        onCollapseAll={() => collapseAll(sectionIds)}
      />

      <Metabox id="about_copy" title="About" isOpen={sectionState["about_copy"]}>
        <table className="wp-form-table">
          <tbody>
            <Field label="About" wide>
              <TextArea
                value={site.about}
                onChange={(about) => setData({ ...data, site: { ...site, about } })}
                rows={6}
              />
            </Field>
            <Field label="Philosophy kicker">
              <TextInput
                value={site.philosophyKicker}
                onChange={(philosophyKicker) =>
                  setData({ ...data, site: { ...site, philosophyKicker } })
                }
              />
            </Field>
            <Field label="Philosophy title">
              <TextInput
                value={site.philosophyTitle}
                onChange={(philosophyTitle) =>
                  setData({ ...data, site: { ...site, philosophyTitle } })
                }
              />
            </Field>
            <Field label="Philosophy" wide>
              <TextArea
                value={site.philosophy}
                onChange={(philosophy) => setData({ ...data, site: { ...site, philosophy } })}
                rows={4}
              />
            </Field>
            <Field label="Experience intro" wide>
              <TextArea
                value={site.experienceIntro}
                onChange={(experienceIntro) =>
                  setData({ ...data, site: { ...site, experienceIntro } })
                }
                rows={3}
              />
            </Field>
          </tbody>
        </table>
      </Metabox>

      <Metabox
        id="about_stats"
        title="Stats"
        badge={`${site.stats.length} ${site.stats.length === 1 ? "stat" : "stats"}`}
        isOpen={sectionState["about_stats"]}
      >
        {site.stats.map((stat, i) => (
          <div
            key={i}
            className="row"
            style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}
          >
            <input
              type="number"
              min={0}
              value={stat.value}
              className="wp-input wp-input-small"
              onChange={(e) => {
                const stats = [...site.stats];
                stats[i] = { ...stat, value: Number(e.target.value) };
                setData({ ...data, site: { ...site, stats } });
              }}
            />
            <TextInput
              value={stat.suffix}
              placeholder="+"
              small
              onChange={(suffix) => {
                const stats = [...site.stats];
                stats[i] = { ...stat, suffix };
                setData({ ...data, site: { ...site, stats } });
              }}
            />
            <TextInput
              value={stat.label}
              onChange={(label) => {
                const stats = [...site.stats];
                stats[i] = { ...stat, label };
                setData({ ...data, site: { ...site, stats } });
              }}
            />
            <button
              type="button"
              className="wp-btn"
              disabled={i === 0}
              title="Move stat up"
              aria-label="Move stat up"
              onClick={() => {
                const stats = move(site.stats, i, -1);
                setData({ ...data, site: { ...site, stats } });
              }}
              style={{ padding: "0 8px" }}
            >
              ↑
            </button>
            <button
              type="button"
              className="wp-btn"
              disabled={i === site.stats.length - 1}
              title="Move stat down"
              aria-label="Move stat down"
              onClick={() => {
                const stats = move(site.stats, i, 1);
                setData({ ...data, site: { ...site, stats } });
              }}
              style={{ padding: "0 8px" }}
            >
              ↓
            </button>
            <button
              type="button"
              className="wp-btn"
              onClick={() =>
                setData({ ...data, site: { ...site, stats: site.stats.filter((_, j) => j !== i) } })
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="wp-add"
          onClick={() =>
            setData({
              ...data,
              site: { ...site, stats: [...site.stats, { value: 0, suffix: "+", label: "New stat" }] },
            })
          }
        >
          + Add stat
        </button>
      </Metabox>

      <p>
        <button
          type="button"
          className="wp-btn wp-btn-primary wp-btn-large"
          onClick={() => void save()}
          disabled={!dirty}
        >
          Save Changes
        </button>
      </p>
    </>
  );
}
