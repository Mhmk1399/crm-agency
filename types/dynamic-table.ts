export type SortDirection = "asc" | "desc";

export interface ColumnConfig<T> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  hideOnMobile?: boolean;
}

export interface TableAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: "default" | "destructive";
  show?: (row: T) => boolean;
}

export interface DynamicTableProps<T extends { _id?: string; id?: string }> {
  columns: ColumnConfig<T>[];
  data: T[];
  actions?: TableAction<T>[];
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  isLoading?: boolean;
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
}

export interface SortState {
  key: string;
  direction: SortDirection;
}
