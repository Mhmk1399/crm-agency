import type { FieldValues } from "react-hook-form";

export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url"
  | "textarea"
  | "select"
  | "multiselect"
  | "date"
  | "datetime-local"
  | "checkbox"
  | "radio"
  | "currency"
  | "percentage"
  | "searchselect"
  | "hidden";

export interface SelectOption {
  label: string;
  value: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  options?: SelectOption[];
  defaultValue?: unknown;
  colSpan?: 1 | 2;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  prefix?: string;
  suffix?: string;
}

export interface DynamicFormProps {
  fields: FieldConfig[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any;
  onSubmit: (data: FieldValues) => void | Promise<void>;
  defaultValues?: FieldValues;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  columns?: 1 | 2;
  title?: string;
  description?: string;
}
