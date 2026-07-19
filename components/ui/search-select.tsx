"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SelectOption } from "@/types/dynamic-form";

type OptionValue = string;

export interface DynamicSelectProps<TOption = SelectOption> {
  options?: TOption[];
  data?: TOption[];
  value: OptionValue;
  onChange: (value: OptionValue, option?: TOption) => void;
  getOptionValue?: (option: TOption) => OptionValue;
  getOptionLabel?: (option: TOption) => React.ReactNode;
  getOptionDescription?: (option: TOption) => React.ReactNode;
  getOptionSearchText?: (option: TOption) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  isLoading?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  id?: string;
  name?: string;
}

function defaultGetValue<TOption>(option: TOption): string {
  if (typeof option === "object" && option !== null && "value" in option) {
    return String(option.value);
  }

  return String(option);
}

function defaultGetLabel<TOption>(option: TOption): React.ReactNode {
  if (typeof option === "object" && option !== null && "label" in option) {
    return String(option.label);
  }

  return String(option);
}

function labelToSearchText(label: React.ReactNode): string {
  if (typeof label === "string" || typeof label === "number") {
    return String(label);
  }

  return "";
}

export default function DynamicSelect<TOption = SelectOption>({
  options,
  data,
  value,
  onChange,
  getOptionValue = defaultGetValue,
  getOptionLabel = defaultGetLabel,
  getOptionDescription,
  getOptionSearchText,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
  loadingMessage = "Loading options...",
  errorMessage,
  isLoading = false,
  disabled = false,
  clearable = true,
  id,
  name,
}: DynamicSelectProps<TOption>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-listbox`;
  const sourceOptions = useMemo(() => data ?? options ?? [], [data, options]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => sourceOptions.find((option) => getOptionValue(option) === value),
    [getOptionValue, sourceOptions, value]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return sourceOptions;

    return sourceOptions.filter((option) => {
      const label = getOptionLabel(option);
      const description = getOptionDescription?.(option);
      const searchText =
        getOptionSearchText?.(option) ??
        [labelToSearchText(label), labelToSearchText(description)]
          .filter(Boolean)
          .join(" ");

      return searchText.toLowerCase().includes(normalizedQuery);
    });
  }, [
    getOptionDescription,
    getOptionLabel,
    getOptionSearchText,
    query,
    sourceOptions,
  ]);

  const selectedLabel = selected ? getOptionLabel(selected) : null;

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled]);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    },
    [close]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const activeOptionIndex =
    filtered.length === 0 ? 0 : Math.min(activeIndex, filtered.length - 1);

  function handleSelect(option: TOption) {
    onChange(getOptionValue(option), option);
    close();
  }

  function handleClear(event: React.MouseEvent) {
    event.stopPropagation();
    onChange("");
    close();
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openMenu();
      return;
    }

    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        filtered.length === 0 ? 0 : Math.min(current + 1, filtered.length - 1)
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter" && filtered[activeOptionIndex]) {
      event.preventDefault();
      handleSelect(filtered[activeOptionIndex]);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {name && <input name={name} type="hidden" value={value} readOnly />}

      <button
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-input-border bg-[var(--background)] px-4 py-3 text-left text-base text-foreground outline-none transition-all duration-200 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-input-focus disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled}
        id={selectId}
        onClick={() => (open ? close() : openMenu())}
        type="button"
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selected ? "text-foreground" : "text-muted"
          }`}
        >
          {selectedLabel ?? placeholder}
        </span>

        <span className="flex shrink-0 items-center gap-1 text-muted">
          {isLoading && (
            <svg
              aria-hidden="true"
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z"
                fill="currentColor"
              />
            </svg>
          )}

          {clearable && value && !disabled && (
            <span
              aria-label="Clear selection"
              className="rounded-md p-1 transition-colors hover:bg-muted-bg hover:text-foreground"
              onClick={handleClear}
              role="button"
            >
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M18 6 6 18"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />
                <path
                  d="m6 6 12 12"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />
              </svg>
            </span>
          )}

          <svg
            aria-hidden="true"
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="m6 9 6 6 6-6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-[var(--radius-sm)] border border-input-border bg-[var(--background)] shadow-2xl ring-1 ring-black/5">
          <div className="border-b border-separator p-2">
            <div className="relative">
              <svg
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="m21 21-4.3-4.3"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
              <input
                aria-activedescendant={
                  filtered[activeOptionIndex]
                    ? `${selectId}-option-${activeOptionIndex}`
                    : undefined
                }
                aria-controls={listboxId}
                aria-expanded={open}
                aria-labelledby={selectId}
                autoComplete="off"
                className="h-10 w-full rounded-lg border border-input-border bg-input-bg pl-9 pr-3 text-base text-foreground outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-input-focus"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                placeholder={searchPlaceholder}
                ref={inputRef}
                role="combobox"
                type="text"
                value={query}
              />
            </div>
          </div>

          <div
            className="dynamic-select-options max-h-[248px] overflow-y-auto overscroll-contain p-1"
            id={listboxId}
            role="listbox"
          >
            {isLoading ? (
              <SelectState message={loadingMessage} type="loading" />
            ) : errorMessage ? (
              <SelectState message={errorMessage} type="error" />
            ) : filtered.length === 0 ? (
              <SelectState message={emptyMessage} type="empty" />
            ) : (
              filtered.map((option, index) => {
                const optionValue = getOptionValue(option);
                const isSelected = optionValue === value;
                const isActive = index === activeOptionIndex;
                const description = getOptionDescription?.(option);

                return (
                  <button
                    aria-selected={isSelected}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 ${
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : isActive
                          ? "bg-muted-bg text-foreground"
                          : "text-foreground hover:bg-muted-bg"
                    }`}
                    id={`${selectId}-option-${index}`}
                    key={optionValue}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setActiveIndex(index)}
                    role="option"
                    type="button"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium">
                        {getOptionLabel(option)}
                      </span>
                      {description && (
                        <span className="mt-0.5 block truncate text-[12px] text-muted">
                          {description}
                        </span>
                      )}
                    </span>

                    {isSelected && (
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M20 6 9 17l-5-5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                        />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {clearable && value && !isLoading && !errorMessage && (
            <div className="border-t border-separator p-1">
              <button
                className="w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium text-muted transition-colors hover:bg-muted-bg hover:text-foreground"
                onClick={() => {
                  onChange("");
                  close();
                }}
                type="button"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SelectState({
  message,
  type,
}: {
  message: string;
  type: "empty" | "error" | "loading";
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      {type === "loading" && (
        <svg
          aria-hidden="true"
          className="h-5 w-5 animate-spin text-muted"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z"
            fill="currentColor"
          />
        </svg>
      )}
      <p
        className={`text-[13px] font-medium ${
          type === "error" ? "text-destructive" : "text-muted"
        }`}
      >
        {message}
      </p>
    </div>
  );
}
