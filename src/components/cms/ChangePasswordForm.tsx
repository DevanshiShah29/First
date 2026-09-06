"use client";

import { useState, type FormEvent } from "react";
import { cmsChangePassword } from "@/lib/cms-client";
import { Metabox } from "./components/Metabox";
import { Field, TextInput } from "./fields";

const MIN_LENGTH = 8;

interface ChangePasswordFormProps {
  isOpen?: boolean;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function ChangePasswordForm({ isOpen, onSuccess, onError }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState("");
  const [localSuccess, setLocalSuccess] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError("");
    setLocalSuccess("");
    onError?.("");

    if (newPassword.length < MIN_LENGTH) {
      const msg = `Password must be at least ${MIN_LENGTH} characters.`;
      setLocalError(msg);
      onError?.(msg);
      return;
    }
    if (newPassword !== confirmPassword) {
      const msg = "New passwords do not match.";
      setLocalError(msg);
      onError?.(msg);
      return;
    }

    setPending(true);
    const result = await cmsChangePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    setPending(false);

    if (!result.ok) {
      const msg = result.error || "Could not change password.";
      setLocalError(msg);
      onError?.(msg);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    const msg = "Password updated. Use the new password next time you log in.";
    setLocalSuccess(msg);
    onSuccess?.(msg);
  }

  return (
    <Metabox id="site_password" title="Password" isOpen={isOpen}>
      <p className="wp-description" style={{ marginTop: 0 }}>
        Change the CMS login password. After updating, the new password is stored in the database
        and used instead of <code>ADMIN_PASSWORD</code> from env.
      </p>
      <form onSubmit={(e) => void onSubmit(e)}>
        <table className="wp-form-table">
          <tbody>
            <Field label="Current password">
              <TextInput
                type="password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Current password"
              />
            </Field>
            <Field label="New password" hint={`At least ${MIN_LENGTH} characters. No spaces.`}>
              <TextInput
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="New password"
              />
            </Field>
            <Field label="Confirm new password">
              <TextInput
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm new password"
              />
            </Field>
          </tbody>
        </table>
        {!onError && localError ? (
          <div className="wp-notice is-error" role="alert" style={{ marginTop: 12 }}>
            {localError}
          </div>
        ) : null}
        {!onSuccess && localSuccess && !localError ? (
          <div className="wp-notice is-success" role="status" style={{ marginTop: 12 }}>
            {localSuccess}
          </div>
        ) : null}
        <p style={{ marginTop: 16, marginBottom: 0 }}>
          <button
            type="submit"
            className="wp-btn wp-btn-primary"
            disabled={
              pending || !currentPassword || !newPassword || !confirmPassword
            }
          >
            {pending ? "Updating…" : "Update Password"}
          </button>
        </p>
      </form>
    </Metabox>
  );
}
