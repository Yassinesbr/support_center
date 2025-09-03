import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export type StudentRow = {
  id: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  birthDate?: string;
  address?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  enrollmentDate?: string;
  paymentStatus?: string;
  monthlyTotalCents?: number;
  classes?: { id: string; name: string }[];
};

export const useStudents = (search?: string) =>
  useQuery({
    queryKey: ["students", search],
    queryFn: async () =>
      (await api.get(`/students`, { params: { search } })).data as StudentRow[],
  });

export const useStudent = (id?: string) =>
  useQuery({
    enabled: !!id,
    queryKey: ["student", id],
    queryFn: async () => (await api.get(`/students/${id}`)).data as StudentRow,
  });

export const useSetStudentClasses = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, classIds }: { id: string; classIds: string[] }) =>
      (await api.put(`/students/${id}/classes`, { classIds })).data,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["student", vars.id] });
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
};
