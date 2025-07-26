import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data } = await api.get("/teachers");
      return data;
    },
  });
}
