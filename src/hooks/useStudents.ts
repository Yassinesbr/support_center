import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data } = await api.get("/students");
      return data;
    },
  });
}
