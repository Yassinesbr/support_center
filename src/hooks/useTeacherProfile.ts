import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export function useTeacherProfile(teacherId: string | undefined) {
  return useQuery({
    queryKey: ["teacher", teacherId],
    queryFn: async () => {
      const { data } = await api.get(`/teachers/${teacherId}`);
      return data;
    },
    enabled: !!teacherId,
  });
}
