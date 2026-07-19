"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "@/components/ui/toast";
import Badge from "@/components/ui/badge";
import DynamicSelect from "@/components/ui/dynamic-select";

interface Organisation {
  _id: string; name: string; slug: string; domain?: string; logo?: string;
  isActive: boolean; createdAt: string;
  settings: {
    currency: string; timezone: string;
    capacitySplit: { delivery: number; salesMarketing: number; internal: number; buffer: number };
    defaultWorkingHoursPerWeek: number; defaultBillablePercentage: number;
  };
}

type Section = "profile" | "defaults" | "account";

function SectionBtn({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left ${active ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground hover:bg-muted-bg"}`}>
      {icon}
      {label}
    </button>
  );
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col justify-between gap-2 border-b border-separator py-4 last:border-0 sm:flex-row sm:items-center">
      <div className="min-w-0 sm:max-w-[50%]">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted mt-0.5">{description}</p>}
      </div>
      <div className="min-w-0 sm:w-[45%]">{children}</div>
    </div>
  );
}

const inputClass = "w-full rounded-lg bg-input-bg px-3 py-2.5 text-base text-foreground border border-input-border outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-input-focus transition-all";

const currencyOptions = [
  { label: "Toman (IRR)", value: "IRR" },
  { label: "US Dollar (USD)", value: "USD" },
  { label: "British Pound (GBP)", value: "GBP" },
];

const timezoneOptions = [
  { label: "Asia/Tehran (IRST)", value: "Asia/Tehran" },
  { label: "UTC", value: "UTC" },
  { label: "Europe/London (GMT/BST)", value: "Europe/London" },
  { label: "America/New York (EST)", value: "America/New_York" },
  { label: "Europe/Berlin (CET)", value: "Europe/Berlin" },
  { label: "Asia/Dubai (GST)", value: "Asia/Dubai" },
];

export default function SettingsTab() {
  const qc = useQueryClient();
  const [section, setSection] = useState<Section>("profile");

  const { data: org } = useQuery<Organisation>({
    queryKey: ["settings", "org"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data;
    },
  });

  // ── Profile state ──
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");

  // ── Defaults state ──
  const [currency, setCurrency] = useState("IRR");
  const [timezone, setTimezone] = useState("Asia/Tehran");
  const [workingHours, setWorkingHours] = useState(44);
  const [billablePct, setBillablePct] = useState(75);
  const [splitDelivery, setSplitDelivery] = useState(70);
  const [splitSales, setSplitSales] = useState(15);
  const [splitInternal, setSplitInternal] = useState(10);
  const [splitBuffer, setSplitBuffer] = useState(5);

  // ── Account state ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!org) return;
    setName(org.name);
    setDomain(org.domain ?? "");
    setCurrency(org.settings.currency);
    setTimezone(org.settings.timezone);
    setWorkingHours(org.settings.defaultWorkingHoursPerWeek);
    setBillablePct(org.settings.defaultBillablePercentage);
    setSplitDelivery(org.settings.capacitySplit.delivery);
    setSplitSales(org.settings.capacitySplit.salesMarketing);
    setSplitInternal(org.settings.capacitySplit.internal);
    setSplitBuffer(org.settings.capacitySplit.buffer);
  }, [org]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveMut = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
    },
    onSuccess: () => { toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["settings", "org"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const passwordMut = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error("Passwords don't match");
      if (newPassword.length < 6) throw new Error("Min 6 characters");
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
    },
    onSuccess: () => { toast.success("Password changed"); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); },
    onError: (e: Error) => toast.error(e.message),
  });

  function saveProfile() {
    saveMut.mutate({ name, domain: domain || undefined });
  }

  function saveDefaults() {
    saveMut.mutate({
      settings: {
        currency,
        timezone,
        defaultWorkingHoursPerWeek: workingHours,
        defaultBillablePercentage: billablePct,
        capacitySplit: { delivery: splitDelivery, salesMarketing: splitSales, internal: splitInternal, buffer: splitBuffer },
      },
    });
  }

  const splitTotal = splitDelivery + splitSales + splitInternal + splitBuffer;

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-[14px] text-muted mt-1">Organisation configuration and account settings</p>
      </div>

      <div className="flex min-w-0 flex-col gap-6 lg:flex-row">
        {/* Left nav */}
        <div className="w-full lg:w-56 shrink-0 space-y-1">
          <SectionBtn label="Organisation" active={section === "profile"} onClick={() => setSection("profile")}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>} />
          <SectionBtn label="Defaults" active={section === "defaults"} onClick={() => setSection("defaults")}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>} />
          <SectionBtn label="Account" active={section === "account"} onClick={() => setSection("account")}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />
        </div>

        {/* Content */}
        <div className="glass min-w-0 flex-1 overflow-hidden rounded-[var(--radius-lg)]">

          {/* ═══ ORGANISATION PROFILE ═══ */}
          {section === "profile" && (
            <div>
              <div className="px-6 py-4 border-b border-separator">
                <h2 className="text-[15px] font-semibold text-foreground">Organisation Profile</h2>
                <p className="text-[12px] text-muted mt-0.5">Your agency identity and branding</p>
              </div>
              <div className="px-6 py-2">
                <Field label="Organisation Name" description="The name of your agency">
                  <input value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Cheetah Nova" />
                </Field>
                <Field label="Slug" description="Unique identifier (read-only)">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-muted font-mono bg-muted-bg px-3 py-2.5 rounded-lg border border-input-border w-full">{org?.slug ?? "—"}</span>
                  </div>
                </Field>
                <Field label="Domain" description="Your business website">
                  <input value={domain} onChange={e => setDomain(e.target.value)} className={inputClass} placeholder="cheetahnova.com" />
                </Field>
                <Field label="Created" description="When this organisation was created">
                  <span className="text-[14px] text-muted">{org ? new Date(org.createdAt).toLocaleDateString() : "—"}</span>
                </Field>
                <Field label="Status">
                  <Badge variant={org?.isActive ? "success" : "destructive"}>{org?.isActive ? "Active" : "Inactive"}</Badge>
                </Field>
              </div>
              <div className="px-6 py-4 border-t border-separator flex justify-end">
                <button onClick={saveProfile} disabled={saveMut.isPending}
                  className="w-full rounded-lg bg-primary hover:bg-primary-hover text-white px-5 py-2.5 text-[13px] font-semibold transition-all disabled:opacity-50 sm:w-auto">
                  {saveMut.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* ═══ DEFAULTS ═══ */}
          {section === "defaults" && (
            <div>
              <div className="px-6 py-4 border-b border-separator">
                <h2 className="text-[15px] font-semibold text-foreground">Default Settings</h2>
                <p className="text-[12px] text-muted mt-0.5">Currency, timezone, and work capacity defaults</p>
              </div>
              <div className="px-6 py-2">
                <Field label="Default Currency" description="Used as the default when creating invoices and expenses">
                  <DynamicSelect
                    clearable={false}
                    options={currencyOptions}
                    placeholder="Select currency"
                    searchPlaceholder="Search currency..."
                    value={currency}
                    onChange={setCurrency}
                  />
                </Field>
                <Field label="Timezone" description="Used for date calculations and reports">
                  <DynamicSelect
                    clearable={false}
                    options={timezoneOptions}
                    placeholder="Select timezone"
                    searchPlaceholder="Search timezone..."
                    value={timezone}
                    onChange={setTimezone}
                  />
                </Field>
                <Field label="Working Hours / Week" description="Default weekly capacity for new team members">
                  <div className="flex items-center gap-2">
                    <input type="number" value={workingHours} onChange={e => setWorkingHours(Number(e.target.value))} min={1} max={80} className={inputClass} />
                    <span className="text-[13px] text-muted shrink-0">hours</span>
                  </div>
                </Field>
                <Field label="Billable Percentage" description="Expected % of working hours that are billable">
                  <div className="flex items-center gap-2">
                    <input type="number" value={billablePct} onChange={e => setBillablePct(Number(e.target.value))} min={0} max={100} className={inputClass} />
                    <span className="text-[13px] text-muted shrink-0">%</span>
                  </div>
                </Field>

                <div className="py-4 border-b border-separator">
                  <p className="text-[13px] font-medium text-foreground">Capacity Split</p>
                  <p className="text-[11px] text-muted mt-0.5">How team time is ideally distributed (should total 100%)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    {[
                      { label: "Delivery", value: splitDelivery, set: setSplitDelivery },
                      { label: "Sales & Marketing", value: splitSales, set: setSplitSales },
                      { label: "Internal", value: splitInternal, set: setSplitInternal },
                      { label: "Buffer", value: splitBuffer, set: setSplitBuffer },
                    ].map(s => (
                      <div key={s.label}>
                        <label className="text-[11px] text-muted font-medium">{s.label}</label>
                        <div className="flex items-center gap-1 mt-1">
                          <input type="number" value={s.value} onChange={e => s.set(Number(e.target.value))} min={0} max={100}
                            className={`${inputClass} text-center`} />
                          <span className="text-[12px] text-muted">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-muted">Total:</span>
                    <Badge variant={splitTotal === 100 ? "success" : "destructive"}>{splitTotal}%</Badge>
                    {splitTotal !== 100 && <span className="text-[11px] text-destructive">Must equal 100%</span>}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-separator flex justify-end">
                <button onClick={saveDefaults} disabled={saveMut.isPending || splitTotal !== 100}
                  className="w-full rounded-lg bg-primary hover:bg-primary-hover text-white px-5 py-2.5 text-[13px] font-semibold transition-all disabled:opacity-50 sm:w-auto">
                  {saveMut.isPending ? "Saving..." : "Save Defaults"}
                </button>
              </div>
            </div>
          )}

          {/* ═══ ACCOUNT ═══ */}
          {section === "account" && (
            <div>
              <div className="px-6 py-4 border-b border-separator">
                <h2 className="text-[15px] font-semibold text-foreground">Account Security</h2>
                <p className="text-[12px] text-muted mt-0.5">Change your password</p>
              </div>
              <div className="px-6 py-2">
                <Field label="Current Password">
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass} placeholder="Enter current password" />
                </Field>
                <Field label="New Password" description="Minimum 6 characters">
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} placeholder="Enter new password" />
                </Field>
                <Field label="Confirm Password">
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Confirm new password" />
                </Field>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[12px] text-destructive py-2">Passwords don&apos;t match</p>
                )}
              </div>
              <div className="px-6 py-4 border-t border-separator flex justify-end">
                <button
                  onClick={() => passwordMut.mutate()}
                  disabled={passwordMut.isPending || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="w-full rounded-lg bg-primary hover:bg-primary-hover text-white px-5 py-2.5 text-[13px] font-semibold transition-all disabled:opacity-50 sm:w-auto">
                  {passwordMut.isPending ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
