"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { SelectOption } from "@/types/dynamic-form";

interface SearchSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SearchSelect({ options, value, onChange, placeholder = "Search...", disabled }: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
      setQuery("");
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setQuery("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 0); }}
        className="w-full rounded-[var(--radius-sm)] !bg-[var(--background)] px-4 py-3 text-[15px] text-left border border-input-border outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-input-focus disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between gap-2"
      >
        <span className={selected ? "text-foreground" : "text-muted"}>
          {selected?.label ?? placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span onClick={handleClear} className="p-0.5 rounded hover:bg-muted-bg text-muted hover:text-foreground transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </span>
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-[var(--background)] rounded-[var(--radius-sm)] shadow-2xl border border-input-border overflow-hidden ring-1 ring-black/5">
          {/* Search input */}
          <div className="p-2 border-b border-separator">
            <div className="relative">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search..."
                className="w-full rounded-lg bg-input-bg pl-9 pr-3 py-2 text-[13px] text-foreground border border-input-border outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-input-focus"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="text-[13px] text-muted text-center py-4">No results found</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-[14px] transition-all duration-150 flex items-center justify-between ${
                    opt.value === value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted-bg"
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>

          {/* None option */}
          {value && (
            <div className="p-1 border-t border-separator">
              <button
                type="button"
                onClick={() => handleSelect("")}
                className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-muted hover:bg-muted-bg transition-all"
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
