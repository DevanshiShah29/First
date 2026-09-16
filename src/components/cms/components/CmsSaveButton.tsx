"use client";

export type CmsSaveStatus = "idle" | "saving" | "saved" | "error";

interface CmsSaveButtonProps {
  save: () => Promise<void>;
  dirty: boolean;
  status: CmsSaveStatus;
  /** Button label when idle and dirty. Default: "Save Changes" */
  label?: string;
  /** Compact bar-style button (admin top bar). */
  variant?: "default" | "bar";
  className?: string;
}

/**
 * CMS save control with loading spinner and disabled-while-saving state.
 * @example <CmsSaveButton save={save} dirty={dirty} status={status} />
 */
export function CmsSaveButton({
  save,
  dirty,
  status,
  label = "Save Changes",
  variant = "default",
  className,
}: CmsSaveButtonProps) {
  const saving = status === "saving";
  const disabled = !dirty || saving;

  if (variant === "bar") {
    return (
      <button
        type="button"
        className={className ?? "wp-bar-item"}
        onClick={() => void save()}
        disabled={disabled}
        aria-busy={saving}
      >
        {saving ? (
          <>
            <span className="wp-save-spinner" aria-hidden="true" />
            Updating…
          </>
        ) : dirty ? (
          "Update"
        ) : (
          "Updated"
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={className ?? "wp-btn wp-btn-primary wp-btn-large"}
      onClick={() => void save()}
      disabled={disabled}
      aria-busy={saving}
    >
      {saving ? (
        <>
          <span className="wp-save-spinner" aria-hidden="true" />
          Saving…
        </>
      ) : (
        label
      )}
    </button>
  );
}
