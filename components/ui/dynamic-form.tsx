"use client";

import { useForm, type FieldValues, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import SearchSelect from "./search-select";
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
    "w-full rounded-[var(--radius-sm)] bg-input-bg px-4 py-3 text-[15px] text-foreground",
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

      case "select":
        return (
          <select
            {...register(field.name)}
            disabled={field.disabled}
            className={`${baseInputClass} appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat !bg-[var(--background)]`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238e8e93' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            }}
          >
            <option value="">
              {field.placeholder ?? `Select ${field.label}`}
            </option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "searchselect": {
        const currentVal: string = watch(field.name) ?? "";
        return (
          <SearchSelect
            options={field.options ?? []}
            value={currentVal}
            onChange={(val) => setValue(field.name, val, { shouldValidate: true })}
            placeholder={field.placeholder ?? `Search ${field.label}...`}
            disabled={field.disabled}
          />
        );
      }

      case "multiselect": {
        const currentValues: string[] = watch(field.name) ?? [];
        return (
          <div className="flex flex-wrap gap-2">
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
                  className={`rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
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
            <span className="text-[15px] text-foreground">{field.label}</span>
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
                <span className="text-[15px] text-foreground">{opt.label}</span>
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
      className={`${field.colSpan === 2 ? "col-span-full" : ""} ${field.type === "checkbox" ? "" : "flex flex-col gap-1.5"}`}
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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: normalizedDefaults,
  });

  const getError = (name: string): string | undefined => {
    const parts = name.split(".");
    let err: Record<string, unknown> = errors;
    for (const part of parts) {
      if (!err[part]) return undefined;
      err = err[part] as Record<string, unknown>;
    }
    return err?.message as string | undefined;
  };

  return (
    <div className="glass rounded-[var(--radius-lg)] p-6 sm:p-8">
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          )}
          {description && (
            <p className="mt-1 text-[14px] text-muted">{description}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div
          className={`grid gap-5 ${columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
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

        <div className="mt-8 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="rounded-[var(--radius-sm)] px-5 py-2.5 text-[15px] font-medium text-foreground bg-input-bg border border-input-border hover:bg-muted-bg transition-all duration-200 disabled:opacity-40"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-[var(--radius-sm)] px-6 py-2.5 text-[15px] font-semibold text-white bg-primary hover:bg-primary-hover transition-all duration-200 shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
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
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
