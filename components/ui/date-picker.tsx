"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface DateRangeValue {
  from?: string;
  to?: string;
}

interface DatePickerProps {
  value?: string;
  rangeValue?: DateRangeValue;
  onChange?: (value: string) => void;
  onRangeChange?: (value: DateRangeValue) => void;
  mode?: "single" | "range";
  placeholder?: string;
  disabled?: boolean;
  includeTime?: boolean;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function DatePicker({
  value,
  rangeValue,
  onChange,
  onRangeChange,
  mode = "single",
  placeholder = "Select date",
  disabled = false,
  includeTime = false,
}: DatePickerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selectedDate = parseDate(value);
  const rangeStart = parseDate(rangeValue?.from);
  const [viewDate, setViewDate] = useState(
    () => selectedDate ?? rangeStart ?? new Date(),
  );
  const [timeValue, setTimeValue] = useState(
    () => value?.slice(11, 16) ?? "09:00",
  );
  const [hoveredDate, setHoveredDate] = useState<string | undefined>();

  useEffect(() => {
    function close(event: MouseEvent) {
      const target = event.target as Node;
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const displayValue =
    mode === "range"
      ? formatRangeLabel(rangeValue)
      : value
        ? formatDateLabel(value, includeTime)
        : "";

  function moveMonth(amount: number) {
    setViewDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
  }

  function selectDate(date: Date) {
    const formatted = toDateInputValue(date);

    if (mode === "range") {
      if (!rangeValue?.from || (rangeValue.from && rangeValue.to)) {
        onRangeChange?.({ from: formatted, to: undefined });
        setHoveredDate(undefined);
      } else if (formatted < rangeValue.from) {
        onRangeChange?.({ from: formatted, to: rangeValue.from });
        setHoveredDate(undefined);
      } else {
        onRangeChange?.({ from: rangeValue.from, to: formatted });
        setHoveredDate(undefined);
        setOpen(false);
      }
      return;
    }

    onChange?.(includeTime ? `${formatted}T${timeValue}` : formatted);
    if (!includeTime) setOpen(false);
  }

  function applyToday() {
    const today = toDateInputValue(new Date());
    if (mode === "range") onRangeChange?.({ from: today, to: today });
    else onChange?.(includeTime ? `${today}T${timeValue}` : today);
    if (!includeTime) setOpen(false);
  }

  function clearValue() {
    if (mode === "range") onRangeChange?.({});
    else onChange?.("");
    setHoveredDate(undefined);
    setOpen(false);
  }

  function applyTime(nextTime: string) {
    setTimeValue(nextTime);
    const baseDate = value?.slice(0, 10) || toDateInputValue(new Date());
    onChange?.(`${baseDate}T${nextTime}`);
  }

  return (
    <div ref={wrapperRef} className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
        className="flex min-h-12 w-full min-w-0 items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-input-border bg-input-bg px-4 py-3 text-left text-base text-foreground outline-none transition-all duration-200 hover:bg-muted-bg focus:border-primary focus:ring-2 focus:ring-input-focus disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className={displayValue ? "truncate" : "truncate text-muted"}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-3 backdrop-blur-sm sm:p-6"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              aria-label="Close calendar"
              className="absolute inset-0 cursor-default"
              onClick={() => setOpen(false)}
            />
            <div
              ref={panelRef}
              className="dynamic-table-scroll relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-[22rem] overflow-y-auto rounded-[var(--radius)] border border-card-border bg-card shadow-2xl backdrop-blur-[var(--blur)]"
              onMouseDown={(event) => event.stopPropagation()}
            >
          <div className="flex items-center justify-between border-b border-separator px-3 py-3">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-muted-bg hover:text-foreground"
            >
              <ChevronLeftIcon />
            </button>
            <div className="text-center">
              <p className="text-[14px] font-semibold text-foreground">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </p>
              {mode === "range" && (
                <p className="text-[11px] text-muted">
                  Choose start and end dates
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-muted-bg hover:text-foreground"
            >
              <ChevronRightIcon />
            </button>
          </div>

          <div className="p-3">
            <div
              className="grid grid-cols-7 gap-1"
              onMouseLeave={() => setHoveredDate(undefined)}
            >
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="flex h-8 items-center justify-center text-[11px] font-semibold text-muted"
                >
                  {day}
                </div>
              ))}
              {days.map((day) => {
                const dateValue = toDateInputValue(day.date);
                const previewRange = getPreviewRange(rangeValue, hoveredDate);
                const isRangeEndpoint =
                  mode === "range" &&
                  (dateValue === previewRange?.from ||
                    dateValue === previewRange?.to);
                const isSelected =
                  mode === "single"
                    ? value?.slice(0, 10) === dateValue
                    : isRangeEndpoint;
                const inRange =
                  mode === "range" &&
                  previewRange?.from &&
                  previewRange?.to &&
                  dateValue > previewRange.from &&
                  dateValue < previewRange.to;
                const isPreviewing =
                  mode === "range" &&
                  !!rangeValue?.from &&
                  !rangeValue?.to &&
                  !!hoveredDate;
                const today = dateValue === toDateInputValue(new Date());

                return (
                  <button
                    key={dateValue}
                    type="button"
                    onMouseEnter={() => {
                      if (
                        mode === "range" &&
                        rangeValue?.from &&
                        !rangeValue.to
                      ) {
                        setHoveredDate(dateValue);
                      }
                    }}
                    onFocus={() => {
                      if (
                        mode === "range" &&
                        rangeValue?.from &&
                        !rangeValue.to
                      ) {
                        setHoveredDate(dateValue);
                      }
                    }}
                    onClick={() => selectDate(day.date)}
                    className={`flex h-10 min-w-0 items-center justify-center rounded-lg text-[13px] font-medium transition-all duration-150 ${
                      isSelected
                        ? isPreviewing && dateValue === hoveredDate
                          ? "bg-primary text-white shadow-md ring-2 ring-primary/25"
                          : "bg-primary text-white shadow-sm"
                        : inRange
                          ? isPreviewing
                            ? "bg-primary/16 text-primary ring-1 ring-primary/10"
                            : "bg-primary/10 text-primary"
                          : day.inMonth
                            ? "text-foreground hover:bg-muted-bg"
                            : "text-muted/45 hover:bg-muted-bg"
                    } ${today && !isSelected ? "ring-1 ring-primary/30" : ""}`}
                  >
                    {day.date.getDate()}
                  </button>
                );
              })}
            </div>

            {includeTime && mode === "single" && (
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-separator pt-3">
                <span className="text-[13px] font-medium text-muted">Time</span>
                <input
                  type="time"
                  value={timeValue}
                  onChange={(event) => applyTime(event.target.value)}
                  className="rounded-[var(--radius-sm)] border border-input-border bg-input-bg px-3 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-input-focus"
                />
              </div>
            )}

            <div className="mt-3 flex gap-2 border-t border-separator pt-3">
              <button
                type="button"
                onClick={applyToday}
                className="flex-1 rounded-lg bg-input-bg px-3 py-2 text-[13px] font-semibold text-foreground hover:bg-muted-bg"
              >
                Today
              </button>
              <button
                type="button"
                onClick={clearValue}
                className="flex-1 rounded-lg bg-input-bg px-3 py-2 text-[13px] font-semibold text-muted hover:bg-muted-bg hover:text-foreground"
              >
                Clear
              </button>
              {includeTime && mode === "single" && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg bg-primary px-3 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
                >
                  Apply
                </button>
              )}
            </div>
          </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function buildCalendarDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, inMonth: date.getMonth() === month };
  });
}

function parseDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string, includeTime: boolean) {
  const date = parseDate(value);
  if (!date) return value;
  const dateLabel = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return includeTime && value.includes("T")
    ? `${dateLabel} ${value.slice(11, 16)}`
    : dateLabel;
}

function formatRangeLabel(value?: DateRangeValue) {
  if (!value?.from && !value?.to) return "";
  const from = value.from ? formatDateLabel(value.from, false) : "Start";
  const to = value.to ? formatDateLabel(value.to, false) : "End";
  return `${from} - ${to}`;
}

function getPreviewRange(value?: DateRangeValue, hoveredDate?: string) {
  if (!value?.from) return undefined;
  const to = value.to ?? hoveredDate;
  if (!to) return { from: value.from, to: undefined };
  return to < value.from
    ? { from: to, to: value.from }
    : { from: value.from, to };
}

function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-muted"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
