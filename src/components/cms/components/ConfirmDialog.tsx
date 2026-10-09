"use client";

import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "@/hooks/use-dialog-focus";

const DEFAULT_MESSAGE = "This removes it from the editor. Save to update the live site.";

export function ConfirmDialog({
  title,
  message = DEFAULT_MESSAGE,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLDivElement>(true);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return createPortal(
    <div className="wp-confirm-backdrop" role="presentation" onClick={onCancel}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="wp-confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClick={(event) => event.stopPropagation()}>
        <h2 id={titleId}>{title}</h2>
        <p id={messageId}>{message}</p>
        <div className="wp-confirm-actions">
          <button type="button" className="wp-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="wp-btn wp-btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmButton({
  children,
  className,
  style,
  disabled,
  buttonTitle,
  ariaLabel,
  title,
  message,
  confirmLabel,
  onConfirm,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  buttonTitle?: string;
  ariaLabel?: string;
  title: string;
  message?: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        style={style}
        disabled={disabled}
        title={buttonTitle}
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}>
        {children}
      </button>
      {open ? (
        <ConfirmDialog
          title={title}
          message={message}
          confirmLabel={confirmLabel}
          onCancel={() => setOpen(false)}
          onConfirm={() => {
            setOpen(false);
            onConfirm();
          }}
        />
      ) : null}
    </>
  );
}
