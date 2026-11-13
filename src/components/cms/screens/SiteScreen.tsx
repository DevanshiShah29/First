"use client";

// Application services & types
import type { ContentData } from "@/content/types";
import type { Screen } from "../types";

// UI components
import { ChangePasswordForm } from "../ChangePasswordForm";
import { CmsSaveButton, type CmsSaveStatus } from "../components/CmsSaveButton";
import { Metabox } from "../components/Metabox";
import { Field, TextArea, TextInput } from "../fields";

interface SiteScreenProps {
  data: ContentData;
  setData: (data: ContentData) => void;
  go: (screen: Screen) => void;
  save: () => Promise<void>;
  dirty: boolean;
  status: CmsSaveStatus;
  onPasswordNotice?: (message: string) => void;
  onPasswordError?: (message: string) => void;
}

/**
 * Renders general site settings and password.
 * @example <SiteScreen data={data} go={go} save={save} … />
 */
export function SiteScreen({
  data,
  setData,
  go,
  save,
  dirty,
  status,
  onPasswordNotice,
  onPasswordError,
}: SiteScreenProps) {
  const site = data.site;

  return (
    <>
      <h1 className="wp-screen-title">General Settings</h1>
      <p className="wp-sub">
        Site identity and account password.{" "}
        <button type="button" className="wp-btn-link" onClick={() => go("contact")}>
          Edit contact
        </button>
        {" · "}
        <button type="button" className="wp-btn-link" onClick={() => go("hero")}>
          Edit hero
        </button>
        {" · "}
        <button type="button" className="wp-btn-link" onClick={() => go("about")}>
          Edit about
        </button>
      </p>
      <Metabox id="site_identity" title="Identity">
        <table className="wp-form-table">
          <tbody>
            <Field label="Site title">
              <TextInput value={site.name} onChange={(name) => setData({ ...data, site: { ...site, name } })} />
            </Field>
            <Field label="Initials">
              <TextInput
                value={site.initials}
                onChange={(initials) => setData({ ...data, site: { ...site, initials } })}
              />
            </Field>
            <Field label="Browser title">
              <TextInput value={site.title} onChange={(title) => setData({ ...data, site: { ...site, title } })} />
            </Field>
            <Field label="Tagline" wide>
              <TextArea
                value={site.description}
                onChange={(description) => setData({ ...data, site: { ...site, description } })}
                rows={3}
              />
            </Field>
          </tbody>
        </table>
      </Metabox>

      <ChangePasswordForm
        onSuccess={onPasswordNotice}
        onError={onPasswordError}
      />

      <p>
        <CmsSaveButton save={save} dirty={dirty} status={status} />
      </p>
    </>
  );
}
