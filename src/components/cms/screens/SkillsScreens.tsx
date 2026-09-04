"use client";

import type { ContentData, SkillGroup, SkillItem } from "@/content/types";
import { Metabox, SectionTools } from "../components/Metabox";
import { Field, TextInput } from "../fields";
import { SkillItemRow } from "../SkillItemRow";
import { move } from "../types";

interface SkillGroupsScreenProps {
  kind: "skills" | "technologies";
  title: string;
  noun: "skill" | "technology";
  data: ContentData;
  setData: (data: ContentData) => void;
  sectionState: Record<string, boolean>;
  expandAll: (ids: string[]) => void;
  collapseAll: (ids: string[]) => void;
  uploadSkillIcon: (file: File, kind: "skills" | "technologies", gi: number, ii: number) => Promise<void>;
  uploading: boolean;
  save: () => Promise<void>;
  dirty: boolean;
}

export function SkillGroupsScreen({
  kind,
  title,
  noun,
  data,
  setData,
  sectionState,
  expandAll,
  collapseAll,
  uploadSkillIcon,
  uploading,
  save,
  dirty,
}: SkillGroupsScreenProps) {
  const groups = data[kind] ?? [];
  const prefix = kind === "skills" ? "skill_group" : "tech_group";

  return (
    <>
      <h1 className="wp-screen-title">
        {title}
        <button
          type="button"
          className="wp-btn wp-btn-primary"
          onClick={() =>
            setData({
              ...data,
              [kind]: [...groups, { title: `New ${noun} group`, items: [] }],
            })
          }
        >
          Add New
        </button>
      </h1>
      <SectionTools
        onExpandAll={() => expandAll(groups.map((_, gi) => `${prefix}_${gi}`))}
        onCollapseAll={() => collapseAll(groups.map((_, gi) => `${prefix}_${gi}`))}
      />
      {groups.map((group: SkillGroup, gi: number) => (
        <Metabox
          key={`${prefix}_${gi}`}
          id={`${prefix}_${gi}`}
          title={group.title || `${title} group`}
          badge={`${group.items.length} ${group.items.length === 1 ? noun : `${noun}s`}`}
          isOpen={sectionState[`${prefix}_${gi}`]}
          actions={
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button
                type="button"
                className="wp-btn"
                onClick={() => setData({ ...data, [kind]: move(groups, gi, -1) })}
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
                onClick={() => setData({ ...data, [kind]: move(groups, gi, 1) })}
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
                  onChange={(groupTitle) => {
                    const nextGroups = [...groups];
                    nextGroups[gi] = { ...group, title: groupTitle };
                    setData({ ...data, [kind]: nextGroups });
                  }}
                />
              </Field>
            </tbody>
          </table>
          {group.items.map((item, ii) => (
            <SkillItemRow
              key={`${kind}-item-${gi}-${ii}`}
              item={item}
              index={ii}
              total={group.items.length}
              uploading={uploading}
              noun={noun}
              onChange={(next: SkillItem) => {
                const nextGroups = [...groups];
                const items = [...group.items];
                items[ii] = next;
                nextGroups[gi] = { ...group, items };
                setData({ ...data, [kind]: nextGroups });
              }}
              onMove={(dir) => {
                const nextGroups = [...groups];
                nextGroups[gi] = { ...group, items: move(group.items, ii, dir) };
                setData({ ...data, [kind]: nextGroups });
              }}
              onRemove={() => {
                const nextGroups = [...groups];
                nextGroups[gi] = { ...group, items: group.items.filter((_, j) => j !== ii) };
                setData({ ...data, [kind]: nextGroups });
              }}
              onUpload={(file) => void uploadSkillIcon(file, kind, gi, ii)}
            />
          ))}
          <p>
            <button
              type="button"
              className="wp-add"
              onClick={() => {
                const nextGroups = [...groups];
                nextGroups[gi] = {
                  ...group,
                  items: [...group.items, { name: `New ${noun}`, icon: "empty" }],
                };
                setData({ ...data, [kind]: nextGroups });
              }}
            >
              + Add {noun}
            </button>
            {" · "}
            <button
              type="button"
              className="wp-add"
              onClick={() => setData({ ...data, [kind]: move(groups, gi, -1) })}
            >
              Move up
            </button>
            {" · "}
            <button
              type="button"
              className="wp-add"
              onClick={() => setData({ ...data, [kind]: move(groups, gi, 1) })}
            >
              Move down
            </button>
            {" · "}
            <button
              type="button"
              className="wp-btn-link"
              onClick={() =>
                setData({ ...data, [kind]: groups.filter((_, j) => j !== gi) })
              }
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
