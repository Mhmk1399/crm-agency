"use client";

import { useForm, type FieldValues, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DynamicSelect from "./dynamic-select";
import DatePicker from "./date-picker";
import toast from "./toast";
import type { DynamicFormProps, FieldConfig } from "@/types/dynamic-form";

function FormField({
  field,
  register,
  error,
  setValue,
  watch,
}: {
  field: FieldConfig;
  register: UseFormRegister<FieldValues>;
  error?: string;
  setValue: UseFormSetValue<FieldValues>;
  watch: UseFormWatch<FieldValues>;
}) {
  const baseInputClass = [
    "w-full min-w-0 rounded-[var(--radius-sm)] bg-input-bg px-4 py-3 text-base text-foreground",
    "border border-input-border",
    "outline-none transition-all duration-200",
    "placeholder:text-muted",
    "focus:border-primary focus:ring-2 focus:ring-input-focus",
    "disabled:opacity-40 disabled:cursor-not-allowed",
  ].join(" ");

  if (field.type === "hidden") {
    return <input type="hidden" {...register(field.name)} />;
  }

  const renderInput = () => {
    switch (field.type) {
      case "textarea":
        return (
          <textarea
            {...register(field.name)}
            placeholder={field.placeholder}
            disabled={field.disabled}
            rows={field.rows ?? 4}
            className={`${baseInputClass} resize-none`}
          />
        );

      case "select": {
        const currentVal: string = watch(field.name) ?? "";
        return (
          <DynamicSelect
            options={field.options ?? []}
            value={currentVal}
            onChange={(val) => setValue(field.name, val, { shouldValidate: true })}
            placeholder={field.placeholder ?? `Select ${field.label}`}
            searchPlaceholder={field.searchPlaceholder ?? `Search ${field.label}...`}
            emptyMessage={field.emptyMessage}
            errorMessage={field.optionsError}
            isLoading={field.optionsLoading}
            disabled={field.disabled}
            getOptionDescription={(option) => option.description}
          />
        );
      }

      case "searchselect": {
        const currentVal: string = watch(field.name) ?? "";
        return (
          <DynamicSelect
            options={field.options ?? []}
            value={currentVal}
            onChange={(val) => setValue(field.name, val, { shouldValidate: true })}
            placeholder={field.placeholder ?? `Search ${field.label}...`}
            searchPlaceholder={field.searchPlaceholder}
            emptyMessage={field.emptyMessage}
            errorMessage={field.optionsError}
            isLoading={field.optionsLoading}
            disabled={field.disabled}
            getOptionDescription={(option) => option.description}
          />
        );
      }

      case "multiselect": {
        const currentValues: string[] = watch(field.name) ?? [];
        return (
          <div className="flex min-w-0 flex-wrap gap-2">
            {field.options?.map((opt) => {
              const isSelected = currentValues.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const next = isSelected
                      ? currentValues.filter((v: string) => v !== opt.value)
                      : [...currentValues, opt.value];
                    setValue(field.name, next, { shouldValidate: true });
                  }}
                  className={`max-w-full break-words rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
                    isSelected
                      ? "bg-primary text-white shadow-sm"
                      : "bg-input-bg text-foreground border border-input-border hover:bg-muted-bg"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        );
      }

      case "checkbox":
        return (
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register(field.name)}
              disabled={field.disabled}
              className="h-5 w-5 rounded-md border-input-border text-primary focus:ring-input-focus accent-[var(--primary)]"
            />
            <span className="text-base text-foreground">{field.label}</span>
          </label>
        );

      case "radio":
        return (
          <div className="flex flex-wrap gap-3">
            {field.options?.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <input
                  type="radio"
                  value={opt.value}
                  {...register(field.name)}
                  disabled={field.disabled}
                  className="h-5 w-5 text-primary focus:ring-input-focus accent-[var(--primary)]"
                />
                <span className="text-base text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case "currency":
      case "number":
      case "percentage":
        return (
          <div className="relative">
            {field.prefix && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-muted">
                {field.prefix}
              </span>
            )}
            <input
              type="number"
              {...register(field.name, { valueAsNumber: true })}
              placeholder={field.placeholder}
              disabled={field.disabled}
              min={field.min}
              max={field.type === "percentage" ? (field.max ?? 100) : field.max}
              step={field.step ?? (field.type === "percentage" ? 0.1 : 1)}
              className={`${baseInputClass} ${field.prefix ? "pl-10" : ""} ${field.suffix ? "pr-10" : ""}`}
            />
            {(field.suffix || field.type === "percentage") && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-muted">
                {field.suffix ?? "%"}
              </span>
            )}
          </div>
        );

      case "date":
      case "datetime-local": {
        const currentVal: string = watch(field.name) ?? "";
        return (
          <DatePicker
            value={currentVal}
            onChange={(val) => setValue(field.name, val, { shouldValidate: true })}
            placeholder={field.placeholder ?? `Select ${field.label}`}
            disabled={field.disabled}
            includeTime={field.type === "datetime-local"}
          />
        );
      }

      default:
        return (
          <input
            type={field.type}
            {...register(field.name)}
            placeholder={field.placeholder}
            disabled={field.disabled}
            className={baseInputClass}
          />
        );
    }
  };

  return (
    <div
      className={`min-w-0 ${field.colSpan === 2 ? "col-span-full" : ""} ${field.type === "checkbox" ? "" : "flex flex-col gap-1.5"}`}
    >
      {field.type !== "checkbox" && (
        <label
          htmlFor={field.name}
          className="text-[13px] font-medium text-muted px-1"
        >
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}

      {renderInput()}

      {field.description && !error && (
        <p className="text-[12px] text-muted px-1">{field.description}</p>
      )}

      {error && (
        <p className="text-[12px] text-destructive px-1">{error}</p>
      )}
    </div>
  );
}

export default function DynamicForm({
  fields,
  schema,
  onSubmit,
  defaultValues,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  onCancel,
  isLoading = false,
  columns = 1,
  title,
  description,
}: DynamicFormProps) {
  const normalizedDefaults = defaultValues
    ? Object.fromEntries(
        Object.entries(defaultValues).map(([k, v]) => {
          const field = fields.find((f) => f.name === k);
          if (field && (field.type === "select" || field.type === "searchselect") && isRecordWithId(v)) {
            return [k, String(v._id)];
          }
          if (field && (field.type === "date" || field.type === "datetime-local") && typeof v === "string" && v.includes("T")) {
            return [k, v.slice(0, field.type === "date" ? 10 : 16)];
          }
          if (field && field.type === "multiselect" && !Array.isArray(v)) {
            return [k, []];
          }
          return [k, v];
        })
      )
    : {};

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: normalizedDefaults,
  });

  const submitting = isLoading || isSubmitting;

  const getError = (name: string): string | undefined => {
    const parts = name.split(".");
    let err: Record<string, unknown> = errors;
    for (const part of parts) {
      if (!err[part]) return undefined;
      err = err[part] as Record<string, unknown>;
    }
    return err?.message as string | undefined;
  };

  async function handleValidSubmit(data: FieldValues) {
    try {
      await onSubmit(data);
    } catch (error) {
      const toastAwareError = error as { toastShown?: boolean };
      if (!toastAwareError.toastShown) {
        toast.error(getSubmitErrorMessage(error));
      }
    }
  }

  return (
    <div className="dynamic-form-shell glass flex min-h-full w-full min-w-0 max-w-full flex-col overflow-hidden rounded-[var(--radius-lg)]">
      {(title || description) && (
        <div className="shrink-0 border-b border-separator bg-card/95 px-4 py-4 backdrop-blur-[var(--blur)] sm:px-8">
          {title && (
            <h2 className="break-words text-xl font-semibold text-foreground">{title}</h2>
          )}
          {description && (
            <p className="mt-1 break-words text-[14px] text-muted">{description}</p>
          )}
        </div>
      )}

      <form className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" onSubmit={handleSubmit(handleValidSubmit)} noValidate>
        <div
          className={`dynamic-table-scroll grid min-h-0 flex-1 content-start gap-5 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-8 sm:py-6 ${columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
        >
          {fields.map((field) => (
            <FormField
              key={field.name}
              field={field}
              register={register}
              error={getError(field.name)}
              setValue={setValue}
              watch={watch}
            />
          ))}
        </div>

        <div className="z-20 flex shrink-0 flex-col-reverse gap-3 border-t border-separator bg-card/95 px-4 py-3 shadow-[0_-12px_28px_rgba(0,0,0,0.08)] backdrop-blur-[var(--blur)] sm:flex-row sm:items-center sm:justify-end sm:px-8 sm:py-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="w-full rounded-[var(--radius-sm)] px-5 py-2.5 text-base font-medium text-foreground bg-input-bg border border-input-border hover:bg-muted-bg transition-all duration-200 disabled:opacity-40 sm:w-auto"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] px-6 py-2.5 text-base font-semibold text-white bg-primary hover:bg-primary-hover transition-all duration-200 shadow-sm disabled:opacity-50 sm:w-auto"
          >
            {submitting && (
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
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
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function isRecordWithId(value: unknown): value is { _id: string } {
  return typeof value === "object" && value !== null && "_id" in value;
}

function getSubmitErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return "Failed to submit form.";
}
