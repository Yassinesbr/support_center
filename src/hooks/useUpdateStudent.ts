import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/students/${id}`, data);
      return response.data;
    },
    onSuccess: (updatedStudent) => {
      // Invalidate and refetch students list
      queryClient.invalidateQueries({ queryKey: ["students"] });
      // Update the specific student cache
      queryClient.invalidateQueries({
        queryKey: ["student", updatedStudent.id],
      });
    },
  });
}
