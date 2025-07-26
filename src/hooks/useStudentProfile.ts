import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export function useStudentProfile(studentId: number) {
  return useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const { data } = await api.get(`/students/${studentId}`);
      return data;
    },
    enabled: !!studentId,
  });
}
