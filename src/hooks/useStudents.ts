import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export type StudentRow = {
  id: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  classes?: { id: string; name: string }[];
};

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
