"use client";

import { useState } from "react";
import type { FieldValues } from "react-hook-form";
import DynamicTable from "@/components/ui/dynamic-table";
import DynamicForm from "@/components/ui/dynamic-form";
import Modal from "@/components/ui/modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Button from "@/components/ui/button";
import toast from "@/components/ui/toast";
import ReportBadges, { type ReportBadge } from "@/components/dashboard/report-badges";
import { useSession } from "@/lib/use-session";
import { buildPermission, type AccessResourceId } from "@/lib/permissions";
import type { FieldConfig } from "@/types/dynamic-form";
import type { ColumnConfig, TableAction } from "@/types/dynamic-table";

interface CrudTabProps<T extends { _id: string }> {
  title: string;
  description: string;
  columns: ColumnConfig<T>[];
  data: T[];
  loading: boolean;
  fields: FieldConfig[];
  schema: unknown;
  onCreate: (data: Record<string, unknown>) => Promise<unknown>;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  onDelete: (id: string) => Promise<boolean>;
  addLabel?: string;
  nameKey?: keyof T & string;
  extraActions?: TableAction<T>[];
  onRowClick?: (row: T) => void;
  reportBadges?: ReportBadge[];
  accessResource?: AccessResourceId;
}

export default function CrudTab<T extends { _id: string; [key: string]: unknown }>({
  title, description, columns, data, loading, fields, schema,
  onCreate, onUpdate, onDelete, addLabel = "Add", nameKey = "name" as keyof T & string,
  extraActions, onRowClick, reportBadges, accessResource,
}: CrudTabProps<T>) {
  const { can } = useSession();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const canCreate = !accessResource || can(buildPermission(accessResource, "post"));
  const canUpdate = !accessResource || can(buildPermission(accessResource, "update"));
  const canDelete = !accessResource || can(buildPermission(accessResource, "delete"));

  async function handleSubmit(formData: FieldValues) {
    if (editing) {
      if (!canUpdate) {
        toast.error(`You do not have permission to update ${title.toLowerCase()}.`);
        return;
      }
      await onUpdate(editing._id, formData);
    } else {
      if (!canCreate) {
        toast.error(`You do not have permission to create ${title.toLowerCase()}.`);
        return;
      }
      await onCreate(formData);
    }
    setModalOpen(false);
    setEditing(null);
  }

  const actions: TableAction<T>[] = [
    ...(extraActions ?? []),
    {
      label: "Edit",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
      onClick: (row) => { setEditing(row); setModalOpen(true); },
      show: () => canUpdate,
    },
    {
      label: "Delete",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>,
      variant: "destructive",
      onClick: (row) => setDeleteTarget(row),
      show: () => canDelete,
    },
  ];

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden">
      {reportBadges && reportBadges.length > 0 && (
        <ReportBadges badges={reportBadges} />
      )}
      <DynamicTable
        title={title}
        description={description}
        columns={columns}
        data={data}
        actions={actions}
        isLoading={loading}
        searchPlaceholder={`Search ${title.toLowerCase()}...`}
        emptyMessage={`No ${title.toLowerCase()} yet.`}
        onRowClick={onRowClick}
        headerAction={canCreate ? <Button className="w-full whitespace-nowrap sm:w-auto" onClick={() => { setEditing(null); setModalOpen(true); }}>{addLabel}</Button> : null}
      />
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? `Edit ${title.slice(0, -1)}` : `New ${title.slice(0, -1)}`}
        size="lg"
      >
        <DynamicForm
          fields={fields}
          schema={schema}
          onSubmit={handleSubmit}
          defaultValues={editing ?? undefined}
          submitLabel={editing ? "Update" : "Create"}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          columns={2}
        />
      </Modal>
      <ConfirmDialog
        open={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => { if (deleteTarget) { await onDelete(deleteTarget._id); setDeleteTarget(null); } }}
        title={`Delete ${title.slice(0, -1)}`}
        message={`Are you sure you want to delete "${deleteTarget?.[nameKey] ?? ""}"?`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
