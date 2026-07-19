"use client";

import { FormEvent, useMemo, useState } from "react";
import type React from "react";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/button";
import toast from "@/components/ui/toast";
import { useSession } from "@/lib/use-session";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-[var(--radius-sm)] border border-input-border bg-input-bg px-3 py-2.5 text-base text-foreground outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 ${props.className ?? ""}`}
    />
  );
}

export default function ProfileTab() {
  const qc = useQueryClient();
  const { session, isLoading } = useSession();
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const name = nameDraft ?? session?.name ?? "";
  const email = emailDraft ?? session?.email ?? "";

  const initials = useMemo(
    () =>
      (name || "User")
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [name]
  );

  const accountChanged =
    name.trim() !== (session?.name ?? "") ||
    email.trim().toLowerCase() !== (session?.email ?? "");

  async function patchProfile(body: Record<string, string>) {
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? "Update failed");
    qc.setQueryData(["session"], json.data);
    await qc.invalidateQueries({ queryKey: ["session"] });
    return json.data;
  }

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accountChanged) {
      toast.info("No account changes to save.");
      return;
    }

    setSavingAccount(true);
    try {
      await patchProfile({ name: name.trim(), email: email.trim().toLowerCase() });
      setNameDraft(null);
      setEmailDraft(null);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update profile");
    } finally {
      setSavingAccount(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await patchProfile({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update password");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="mt-1 text-[14px] text-muted">
            Update your account information and password.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-[var(--radius)] border border-separator bg-card px-4 py-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-bold text-primary">
            {isLoading ? "" : initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-foreground">
              {isLoading ? "Loading..." : session?.name}
            </p>
            <p className="truncate text-[12px] text-muted">{session?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <form
          onSubmit={handleAccountSubmit}
          className="rounded-[var(--radius)] border border-separator bg-card"
        >
          <div className="border-b border-separator px-5 py-4">
            <h2 className="text-[15px] font-semibold text-foreground">
              Account
            </h2>
            <p className="mt-1 text-[12px] text-muted">
              These details are used across the app and sidebar.
            </p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Full name">
              <TextInput
                autoComplete="name"
                disabled={isLoading || savingAccount}
                onChange={(event) => setNameDraft(event.target.value)}
                placeholder="Your name"
                required
                value={name}
              />
            </Field>
            <Field label="Email">
              <TextInput
                autoComplete="email"
                disabled={isLoading || savingAccount}
                onChange={(event) => setEmailDraft(event.target.value)}
                placeholder="you@company.com"
                required
                type="email"
                value={email}
              />
            </Field>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-separator px-5 py-4 sm:flex-row sm:justify-end">
            <Button
              className="w-full sm:w-auto"
              disabled={!accountChanged || isLoading}
              isLoading={savingAccount}
              type="submit"
            >
              Save Changes
            </Button>
          </div>
        </form>

        <form
          onSubmit={handlePasswordSubmit}
          className="rounded-[var(--radius)] border border-separator bg-card"
        >
          <div className="border-b border-separator px-5 py-4">
            <h2 className="text-[15px] font-semibold text-foreground">
              Password
            </h2>
            <p className="mt-1 text-[12px] text-muted">
              Use your current password before setting a new one.
            </p>
          </div>
          <div className="space-y-4 p-5">
            <Field label="Current password">
              <TextInput
                autoComplete="current-password"
                disabled={savingPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Current password"
                required
                type="password"
                value={currentPassword}
              />
            </Field>
            <Field label="New password" hint="Minimum 6 characters.">
              <TextInput
                autoComplete="new-password"
                disabled={savingPassword}
                minLength={6}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="New password"
                required
                type="password"
                value={newPassword}
              />
            </Field>
            <Field label="Confirm new password">
              <TextInput
                autoComplete="new-password"
                disabled={savingPassword}
                minLength={6}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat new password"
                required
                type="password"
                value={confirmPassword}
              />
            </Field>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-separator px-5 py-4 sm:flex-row sm:justify-end">
            <Button
              className="w-full sm:w-auto"
              disabled={!currentPassword || !newPassword || !confirmPassword}
              isLoading={savingPassword}
              type="submit"
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
