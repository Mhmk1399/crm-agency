"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import toast from "@/components/ui/toast";
import { buildPermission, type Permission } from "@/lib/permissions";
import { useSession } from "@/lib/use-session";
import type { TabId } from "@/components/dashboard/sidebar";

interface NavCommand {
  id: TabId;
  label: string;
  section: string;
}

interface SearchResult {
  id: string;
  type: string;
  label: string;
  title: string;
  subtitle: string;
  tab: TabId;
}

interface CommandPaletteProps {
  activeTab: TabId;
  navigation: NavCommand[];
  onTabChange: (tab: TabId) => void;
}

const CREATE_COMMANDS: {
  id: string;
  label: string;
  hint: string;
  tab: TabId;
  permission: Permission;
}[] = [
  {
    id: "create-task",
    label: "Create task",
    hint: "Open Tasks and use New Task",
    tab: "tasks",
    permission: buildPermission("tasks", "post"),
  },
  {
    id: "record-payment",
    label: "Record payment",
    hint: "Open Finance payments",
    tab: "finance",
    permission: buildPermission("payments", "post"),
  },
  {
    id: "create-invoice",
    label: "Create invoice",
    hint: "Open Finance invoices",
    tab: "finance",
    permission: buildPermission("invoices", "post"),
  },
  {
    id: "add-profile",
    label: "Add team profile",
    hint: "Open Team profiles",
    tab: "team",
    permission: buildPermission("team-member-profiles", "post"),
  },
];

export default function CommandPalette({
  activeTab,
  navigation,
  onTabChange,
}: CommandPaletteProps) {
  const { can } = useSession();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canSearch = query.trim().length >= 2;

  const createCommands = useMemo(
    () =>
      CREATE_COMMANDS.filter(
        (command) =>
          can(command.permission) &&
          navigation.some((item) => item.id === command.tab),
      ),
    [can, navigation],
  );

  const navMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return navigation.filter((item) =>
      q ? `${item.label} ${item.section}`.toLowerCase().includes(q) : true,
    );
  }, [navigation, query]);

  const createMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return createCommands.filter((item) =>
      q ? `${item.label} ${item.hint}`.toLowerCase().includes(q) : true,
    );
  }, [createCommands, query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        setResults(json.success ? json.data.results ?? [] : []);
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query]);

  function close() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  function goTo(tab: TabId) {
    onTabChange(tab);
    close();
  }

  function runCreateCommand(tab: TabId, message: string) {
    onTabChange(tab);
    toast.info(message);
    close();
  }

  return (
    <>
      <button
        className="fixed right-4  top-20 z-30 hidden items-center gap-2 rounded-[var(--radius-sm)] border border-input-border bg-card/90 px-3 py-2 text-[13px] font-semibold text-muted shadow-sm backdrop-blur-[var(--blur)] transition-all hover:border-primary/40 hover:text-foreground md:top-4 md:flex"
        onClick={() => setOpen(true)}
        type="button"
      >
        <SearchIcon />
        <span>Search</span>
       </button>

      <button
        className="fixed bottom-20 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        type="button"
      >
        <SearchIcon />
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/35 px-3 py-16 backdrop-blur-sm sm:px-6">
          <button
            aria-label="Close command palette"
            className="absolute inset-0"
            onClick={close}
            type="button"
          />
          <div className="relative flex max-h-[min(760px,82vh)] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius)] border border-card-border bg-card shadow-2xl">
            <div className="flex items-center gap-3 border-b border-separator px-4 py-3">
              <SearchIcon />
              <input
                ref={inputRef}
                className="min-w-0 flex-1 bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") close();
                }}
                placeholder="Search records or run a command..."
                value={query}
              />
              {loading && canSearch && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
            </div>

            <div className="overflow-y-auto p-3">
              <CommandSection title="Go to">
                {navMatches.slice(0, 8).map((item) => (
                  <CommandRow
                    active={activeTab === item.id}
                    key={item.id}
                    meta={item.section}
                    onClick={() => goTo(item.id)}
                    title={item.label}
                  />
                ))}
              </CommandSection>

              {createMatches.length > 0 && (
                <CommandSection title="Actions">
                  {createMatches.map((item) => (
                    <CommandRow
                      key={item.id}
                      meta={item.hint}
                      onClick={() => runCreateCommand(item.tab, item.hint)}
                      title={item.label}
                    />
                  ))}
                </CommandSection>
              )}

              <CommandSection title="Search results">
                {!canSearch ? (
                  <p className="px-3 py-6 text-center text-[13px] text-muted">
                    Type at least 2 characters to search your accessible data.
                  </p>
                ) : results.length === 0 && !loading ? (
                  <p className="px-3 py-6 text-center text-[13px] text-muted">
                    Nothing found for “{query.trim()}”.
                  </p>
                ) : (
                  results.map((result) => (
                    <CommandRow
                      key={`${result.type}-${result.id}`}
                      meta={`${result.label} · ${result.subtitle}`}
                      onClick={() => goTo(result.tab)}
                      title={result.title}
                    />
                  ))
                )}
              </CommandSection>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CommandSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function CommandRow({
  active = false,
  meta,
  onClick,
  title,
}: {
  active?: boolean;
  meta: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      className={`flex w-full min-w-0 items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-all ${
        active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted-bg"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted-bg">
        <SearchIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">{title}</span>
        <span className="block truncate text-[12px] text-muted">{meta}</span>
      </span>
    </button>
  );
}

function SearchIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
