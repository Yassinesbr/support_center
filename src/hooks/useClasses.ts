import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export type ClassTime = {
  id: string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
};
export type ClassRow = {
  id: string;
  name: string;
  description?: string;
  teacher?: {
    id: string;
    user?: { firstName?: string; lastName?: string; email: string };
  };
  students: {
    id: string;
    user?: { firstName?: string; lastName?: string; email: string };
  }[];
  startAt?: string;
  endAt?: string;
  classTimes?: ClassTime[];
};

export const useClasses = () =>
  useQuery({
    queryKey: ["classes"],
    queryFn: async () => (await api.get<ClassRow[]>("/classes")).data,
  });

export const useClass = (id?: string) =>
  useQuery({
    enabled: !!id,
    queryKey: ["class", id],
    queryFn: async () => (await api.get<ClassRow>(`/classes/${id}`)).data,
  });

export const useCreateClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ClassRow>) =>
      (await api.post("/classes", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
};

export const useUpdateClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClassRow> }) =>
      (await api.put(`/classes/${id}`, data)).data,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["class", vars.id] });
    },
  });
};

export const useDeleteClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/classes/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
};

// ---- times ----
export const useClassTimes = (classId?: string) =>
  useQuery({
    enabled: !!classId,
    queryKey: ["classTimes", classId],
    queryFn: async () =>
      (await api.get<ClassTime[]>(`/classes/${classId}/times`)).data,
  });

export const useAddClassTime = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      data,
    }: {
      classId: string;
      data: Omit<ClassTime, "id">;
    }) => (await api.post(`/classes/${classId}/times`, data)).data,
    onSuccess: (_d, { classId }) => {
      qc.invalidateQueries({ queryKey: ["classTimes", classId] });
      qc.invalidateQueries({ queryKey: ["class", classId] });
    },
  });
};

export const useUpdateClassTime = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      timeId,
      data,
    }: {
      classId: string;
      timeId: string;
      data: Partial<ClassTime>;
    }) => (await api.put(`/classes/${classId}/times/${timeId}`, data)).data,
    onSuccess: (_d, { classId }) => {
      qc.invalidateQueries({ queryKey: ["classTimes", classId] });
      qc.invalidateQueries({ queryKey: ["class", classId] });
    },
  });
};

export const useDeleteClassTime = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      timeId,
    }: {
      classId: string;
      timeId: string;
    }) => (await api.delete(`/classes/${classId}/times/${timeId}`)).data,
    onSuccess: (_d, { classId }) => {
      qc.invalidateQueries({ queryKey: ["classTimes", classId] });
      qc.invalidateQueries({ queryKey: ["class", classId] });
    },
  });
};
