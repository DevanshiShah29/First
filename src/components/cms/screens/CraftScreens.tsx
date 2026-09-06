"use client";

// Application services & types
import { EMPTY_CRAFT } from "@/content/types";
import type { ContentData, CraftContent, CraftGroup, CraftItem } from "@/content/types";
import { move } from "../types";

// UI components
import { Metabox, SectionTools } from "../components/Metabox";
import { Field, TextArea, TextInput } from "../fields";

interface CraftScreenProps {
  data: ContentData;
  setData: (data: ContentData) => void;
  sectionState: Record<string, boolean>;
  expandAll: (ids: string[]) => void;
  collapseAll: (ids: string[]) => void;
  save: () => Promise<void>;
  dirty: boolean;
}

function craftOf(data: ContentData): CraftContent {
  return data.craft ?? EMPTY_CRAFT;
}

function setCraft(data: ContentData, craft: CraftContent): ContentData {
  return { ...data, craft };
}

export function CraftScreen({
  data,
  setData,
  sectionState,
  expandAll,
  collapseAll,
  save,
  dirty,
}: CraftScreenProps) {
  const craft = craftOf(data);
  const groups = craft.groups;
  const pageSectionIds = ["craft_page"];
  const groupSectionIds = groups.map((_, gi) => `craft_group_${gi}`);
  const allSectionIds = [...pageSectionIds, ...groupSectionIds];

  function patchCraft(patch: Partial<CraftContent>) {
    setData(setCraft(data, { ...craft, ...patch }));
  }

  function setGroups(nextGroups: CraftGroup[]) {
    patchCraft({ groups: nextGroups });
  }

  return (
    <>
      <h1 className="wp-screen-title">
        Craft
        <button
          type="button"
          className="wp-btn wp-btn-primary"
          onClick={() =>
            setGroups([...groups, { title: "New craft group", intro: "", items: [] }])
          }
        >
          Add Group
        </button>
      </h1>
      <p className="wp-sub">
        Public <code>/craft</code> page — engineering notes visitors see. Empty means empty on the
        site.
      </p>

      <SectionTools
        onExpandAll={() => expandAll(allSectionIds)}
        onCollapseAll={() => collapseAll(allSectionIds)}
      />

      <Metabox id="craft_page" title="Page copy" isOpen={sectionState["craft_page"]}>
        <table className="wp-form-table">
          <tbody>
            <Field label="Kicker">
              <TextInput
                value={craft.kicker}
                onChange={(kicker) => patchCraft({ kicker })}
                placeholder="Engineering"
              />
            </Field>
            <Field label="Title">
              <TextInput
                value={craft.title}
                onChange={(title) => patchCraft({ title })}
                placeholder="Notes on craft"
              />
            </Field>
            <Field label="Intro" wide>
              <TextArea
                value={craft.intro}
                onChange={(intro) => patchCraft({ intro })}
                rows={4}
              />
            </Field>
            <Field label="Footnote" wide hint="Shown under the intro, before groups.">
              <TextArea
                value={craft.footnote}
                onChange={(footnote) => patchCraft({ footnote })}
                rows={3}
              />
            </Field>
          </tbody>
        </table>
      </Metabox>

      {groups.map((group, gi) => (
        <Metabox
          key={`craft_group_${gi}`}
          id={`craft_group_${gi}`}
          title={group.title || "Craft group"}
          badge={`${group.items.length} ${group.items.length === 1 ? "item" : "items"}`}
          isOpen={sectionState[`craft_group_${gi}`]}
          actions={
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button
                type="button"
                className="wp-btn"
                onClick={() => setGroups(move(groups, gi, -1))}
                disabled={gi === 0}
                title="Move group up"
                aria-label="Move group up"
                style={{ height: 24, lineHeight: "22px", padding: "0 6px", fontSize: 11 }}
              >
                ↑
              </button>
              <button
                type="button"
                className="wp-btn"
                onClick={() => setGroups(move(groups, gi, 1))}
                disabled={gi === groups.length - 1}
                title="Move group down"
                aria-label="Move group down"
                style={{ height: 24, lineHeight: "22px", padding: "0 6px", fontSize: 11 }}
              >
                ↓
              </button>
            </div>
          }
        >
          <table className="wp-form-table">
            <tbody>
              <Field label="Group title">
                <TextInput
                  value={group.title}
                  onChange={(title) => {
                    const next = [...groups];
                    next[gi] = { ...group, title };
                    setGroups(next);
                  }}
                />
              </Field>
              <Field label="Group intro" wide>
                <TextArea
                  value={group.intro}
                  onChange={(intro) => {
                    const next = [...groups];
                    next[gi] = { ...group, intro };
                    setGroups(next);
                  }}
                  rows={2}
                />
              </Field>
            </tbody>
          </table>

          {group.items.map((item, ii) => (
            <div
              key={`craft-item-${gi}-${ii}`}
              className="row"
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid var(--wp-border, #dcdcde)",
              }}
            >
              <table className="wp-form-table">
                <tbody>
                  <Field label="Item title">
                    <TextInput
                      value={item.title}
                      onChange={(title) => {
                        const next = [...groups];
                        const items = [...group.items];
                        items[ii] = { ...item, title };
                        next[gi] = { ...group, items };
                        setGroups(next);
                      }}
                    />
                  </Field>
                  <Field label="Why it matters" wide>
                    <TextArea
                      value={item.why}
                      onChange={(why) => {
                        const next = [...groups];
                        const items = [...group.items];
                        items[ii] = { ...item, why };
                        next[gi] = { ...group, items };
                        setGroups(next);
                      }}
                      rows={3}
                    />
                  </Field>
                </tbody>
              </table>
              <p style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="wp-add"
                  onClick={() => {
                    const next = [...groups];
                    next[gi] = { ...group, items: move(group.items, ii, -1) };
                    setGroups(next);
                  }}
                  disabled={ii === 0}
                >
                  Move up
                </button>
                {" · "}
                <button
                  type="button"
                  className="wp-add"
                  onClick={() => {
                    const next = [...groups];
                    next[gi] = { ...group, items: move(group.items, ii, 1) };
                    setGroups(next);
                  }}
                  disabled={ii === group.items.length - 1}
                >
                  Move down
                </button>
                {" · "}
                <button
                  type="button"
                  className="wp-btn-link"
                  onClick={() => {
                    const next = [...groups];
                    next[gi] = {
                      ...group,
                      items: group.items.filter((_, j) => j !== ii),
                    };
                    setGroups(next);
                  }}
                >
                  Trash item
                </button>
              </p>
            </div>
          ))}

          <p>
            <button
              type="button"
              className="wp-add"
              onClick={() => {
                const next = [...groups];
                const blank: CraftItem = { title: "New practice", why: "" };
                next[gi] = { ...group, items: [...group.items, blank] };
                setGroups(next);
              }}
            >
              + Add item
            </button>
            {" · "}
            <button
              type="button"
              className="wp-btn-link"
              onClick={() => setGroups(groups.filter((_, j) => j !== gi))}
            >
              Trash group
            </button>
          </p>
        </Metabox>
      ))}

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
