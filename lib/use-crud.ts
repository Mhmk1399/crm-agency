"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface UseCrudOptions {
  endpoint: string;
  label: string;
  limit?: number;
}

async function fetchApi<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? "Request failed");
  return json.data;
}

export function useCrud<T extends { _id: string }>({ endpoint, label, limit = 100 }: UseCrudOptions) {
  const qc = useQueryClient();
  const queryKey = [endpoint];

  const { data = [], isLoading: loading, isFetching } = useQuery<T[]>({
    queryKey,
    queryFn: async () => {
      const result = await fetchApi<{ data: T[] }>(`/api/${endpoint}?limit=${limit}`);
      return result.data ?? [];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetchApi(`/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => { toast.success(`${label} created`); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      fetchApi(`/api/${endpoint}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => { toast.success(`${label} updated`); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/api/${endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast.success(`${label} deleted`); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = async (body: Record<string, unknown>) => {
    return createMutation.mutateAsync(body);
  };

  const update = async (id: string, body: Record<string, unknown>) => {
    return updateMutation.mutateAsync({ id, body });
  };

  const remove = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    return true;
  };

  return {
    data,
    loading,
    isFetching,
    create,
    update,
    remove,
    invalidate,
  };
}
