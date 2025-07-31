import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/teachers/${id}`, data);
      return response.data;
    },
    onSuccess: (updatedTeacher) => {
      // Invalidate and refetch teacher list
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      // Update the specific teacher cache
      queryClient.invalidateQueries({
        queryKey: ["teacher", updatedTeacher.id],
      });
    },
  });
}
