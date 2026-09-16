"use client";

// External dependencies
import { useState } from "react";

// Application services & types
import { EMPTY_CRAFT } from "@/content/types";
import type { ContentData, CraftContent, CraftGroup, CraftItem } from "@/content/types";
import {
  generateCraftGroupCopy,
  generateCraftPageCopy,
  type CraftGroupVariant,
  type CraftPageVariant,
} from "@/lib/cms-client";
import { move } from "../types";

// UI components
import { AiFormSection, AiGeneratePanel } from "../components/AiGeneratePanel";
import { AiVariantPicker } from "../components/AiVariantPicker";
import { CmsSaveButton, type CmsSaveStatus } from "../components/CmsSaveButton";
import { Metabox } from "../components/Metabox";
import { EditorTabs } from "../preview/EditorTabs";
import { LivePreviewShell } from "../preview/LivePreviewShell";
import { Field, TextArea, TextInput } from "../fields";

interface CraftScreenProps {
  data: ContentData;
  setData: (data: ContentData) => void;
  save: () => Promise<void>;
  dirty: boolean;
  status: CmsSaveStatus;
}

type GroupAiState = {
  generating: boolean;
  error: string | null;
  variants: CraftGroupVariant[];
  selectedIndex: number;
};

/**
 * Returns craft content or EMPTY_CRAFT.
 * @example craftOf(data) // CraftContent
 */
function craftOf(data: ContentData): CraftContent {
  return data.craft ?? EMPTY_CRAFT;
}

/**
 * Returns data with craft replaced.
 * @example setCraft(data, craft) // ContentData
 */
function setCraft(data: ContentData, craft: CraftContent): ContentData {
  return { ...data, craft };
}

/**
 * Renders Craft page and group editors with AI assist.
 * @example <CraftScreen data={data} setData={setData} … />
 */
export function CraftScreen({
  data,
  setData,
  save,
  dirty,
  status,
}: CraftScreenProps) {
  const craft = craftOf(data);
  const groups = craft.groups;
  const site = data.site;

  const [pageGenerating, setPageGenerating] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageVariants, setPageVariants] = useState<CraftPageVariant[]>([]);
  const [pageSelected, setPageSelected] = useState(0);
  const [groupAi, setGroupAi] = useState<Record<number, GroupAiState>>({});

  /**
   * Merges a patch into craft content.
   * @example patchCraft({ intro: "…" }) // void
   */
  function patchCraft(patch: Partial<CraftContent>) {
    setData(setCraft(data, { ...craft, ...patch }));
  }

  /**
   * Replaces craft groups in document state.
   * @example setGroups(next) // void
   */
  function setGroups(nextGroups: CraftGroup[]) {
    patchCraft({ groups: nextGroups });
  }

  /**
   * Reads or defaults AI state for a craft group index.
   * @example groupState(0) // GroupAiState
   */
  function groupState(gi: number): GroupAiState {
    return (
      groupAi[gi] ?? {
        generating: false,
        error: null,
        variants: [],
        selectedIndex: 0,
      }
    );
  }

  /**
   * Patches AI state for one craft group.
   * @example patchGroupAi(0, { generating: true }) // void
   */
  function patchGroupAi(gi: number, patch: Partial<GroupAiState>) {
    setGroupAi((prev) => {
      const current = prev[gi] ?? {
        generating: false,
        error: null,
        variants: [],
        selectedIndex: 0,
      };
      return { ...prev, [gi]: { ...current, ...patch } };
    });
  }

  /**
   * Generates craft page copy variants.
   * @example void onGeneratePage() // Promise
   */
  async function onGeneratePage() {
    if (pageGenerating) return;
    setPageError(null);
    setPageGenerating(true);
    const result = await generateCraftPageCopy({
      kicker: craft.kicker,
      title: craft.title,
      intro: craft.intro,
      footnote: craft.footnote,
      siteName: site.name,
      siteRoles: site.roles ?? [],
      about: site.about,
    });
    setPageGenerating(false);
    if (!result.ok) {
      setPageError(result.error);
      return;
    }
    setPageVariants(result.data.variants);
    setPageSelected(0);
  }

  /**
   * Generates variants for one craft group.
   * @example void onGenerateGroup(0) // Promise
   */
  async function onGenerateGroup(gi: number) {
    const group = groups[gi];
    if (!group || groupState(gi).generating) return;
    patchGroupAi(gi, { generating: true, error: null });
    const result = await generateCraftGroupCopy({
      groupTitle: group.title,
      groupIntro: group.intro,
      items: group.items,
      siteName: site.name,
      siteRoles: site.roles ?? [],
      about: site.about,
    });
    if (!result.ok) {
      patchGroupAi(gi, { generating: false, error: result.error });
      return;
    }
    patchGroupAi(gi, {
      generating: false,
      variants: result.data.variants,
      selectedIndex: 0,
      error: null,
    });
  }

  const hasPageDraft = Boolean(
    craft.kicker.trim() || craft.title.trim() || craft.intro.trim() || craft.footnote.trim(),
  );
  const hasSiteVoice = Boolean(site.name.trim() || site.about.trim() || (site.roles?.length ?? 0) > 0);

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

      <EditorTabs
        preview={<LivePreviewShell data={data} dirty={dirty} section="craft" />}
      >

      <Metabox id="craft_page" title="Page copy">
        <div className="wp-ai-stack">
          <AiFormSection
            step={1}
            title="Sources for AI"
            description="Uses current page copy plus site name, roles, and About for voice."
          >
            <ul className="wp-ai-source-summary">
              <li>
                <strong>Page draft</strong>
                <span>{hasPageDraft ? "Present" : "Empty"}</span>
              </li>
              <li>
                <strong>Site voice</strong>
                <span>
                  {[site.name, ...(site.roles ?? []).slice(0, 3)].filter(Boolean).join(" · ") ||
                    "Not set"}
                </span>
              </li>
            </ul>
          </AiFormSection>

          <AiGeneratePanel
            basisItems={[
              { label: "Page draft", ready: hasPageDraft, optional: hasSiteVoice },
              { label: "Site name / roles / About", ready: hasSiteVoice, optional: hasPageDraft },
            ]}
            fills="Kicker, Title, Intro, and Footnote"
            generating={pageGenerating}
            error={pageError}
            onGenerate={() => void onGeneratePage()}
          />

          {pageVariants.length > 0 ? (
            <AiFormSection step={2} title="Pick a version" tone="output">
              <AiVariantPicker
                variants={pageVariants}
                selectedIndex={pageSelected}
                onSelect={setPageSelected}
                busy={pageGenerating}
                onUse={(fieldSources) => {
                  const pick = (key: string) => pageVariants[fieldSources[key] ?? pageSelected];
                  const kicker = pick("kicker");
                  const title = pick("title");
                  const intro = pick("intro");
                  const footnote = pick("footnote");
                  if (!kicker && !title && !intro && !footnote) return;
                  patchCraft({
                    kicker: kicker?.kicker ?? craft.kicker,
                    title: title?.title ?? craft.title,
                    intro: intro?.intro ?? craft.intro,
                    footnote: footnote?.footnote ?? craft.footnote,
                  });
                  setPageVariants([]);
                  setPageSelected(0);
                }}
                onDismiss={() => {
                  setPageVariants([]);
                  setPageSelected(0);
                }}
                fields={[
                  { key: "kicker", label: "Kicker", render: (v) => v.kicker },
                  { key: "title", label: "Title", render: (v) => v.title },
                  { key: "intro", label: "Intro", render: (v) => v.intro },
                  {
                    key: "footnote",
                    label: "Footnote",
                    render: (v) => v.footnote || "—",
                  },
                ]}
              />
            </AiFormSection>
          ) : null}

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
        </div>
      </Metabox>

      {groups.map((group, gi) => {
        const ai = groupState(gi);
        const hasGroupDraft = Boolean(
          group.title.trim() || group.intro.trim() || group.items.some((i) => i.title || i.why),
        );
        return (
          <Metabox
            key={`craft_group_${gi}`}
            id={`craft_group_${gi}`}
            title={group.title || "Craft group"}
            badge={`${group.items.length} ${group.items.length === 1 ? "item" : "items"}`}
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
            <div className="wp-ai-stack">
              <AiGeneratePanel
                basisItems={[
                  { label: "Group title", ready: Boolean(group.title.trim()), optional: true },
                  {
                    label: "Intro / items draft",
                    ready: Boolean(group.intro.trim() || group.items.length > 0),
                    optional: Boolean(group.title.trim()),
                  },
                  { label: "Site voice", ready: hasSiteVoice, optional: true },
                ]}
                fills="Group intro and item titles & blurbs"
                generating={ai.generating}
                error={ai.error}
                onGenerate={() => void onGenerateGroup(gi)}
                disabled={!hasGroupDraft && !hasSiteVoice}
              />

              {ai.variants.length > 0 ? (
                <AiVariantPicker
                  variants={ai.variants}
                  selectedIndex={ai.selectedIndex}
                  onSelect={(index) => patchGroupAi(gi, { selectedIndex: index })}
                  busy={ai.generating}
                  onUse={(fieldSources) => {
                    const pick = (key: string) => ai.variants[fieldSources[key] ?? ai.selectedIndex];
                    const intro = pick("intro");
                    const items = pick("items");
                    if (!intro && !items) return;
                    const next = [...groups];
                    next[gi] = {
                      ...group,
                      intro: intro?.intro ?? group.intro,
                      items: items?.items ?? group.items,
                    };
                    setGroups(next);
                    patchGroupAi(gi, { variants: [], selectedIndex: 0 });
                  }}
                  onDismiss={() => patchGroupAi(gi, { variants: [], selectedIndex: 0 })}
                  fields={[
                    {
                      key: "intro",
                      label: "Intro",
                      render: (variant) => variant.intro || "—",
                    },
                    {
                      key: "items",
                      label: "Items",
                      render: (variant) => (
                        <>
                          {variant.items.map((item) => (
                            <div key={item.title} style={{ marginBottom: 6 }}>
                              <strong>{item.title}</strong>
                              <br />
                              {item.why}
                            </div>
                          ))}
                        </>
                      ),
                    },
                  ]}
                />
              ) : null}

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
            </div>

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
        );
      })}

      <p>
        <CmsSaveButton save={save} dirty={dirty} status={status} />
      </p>
      </EditorTabs>
    </>
  );
}
