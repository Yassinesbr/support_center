import { useQuery } from "@tanstack/react-query";
import axios from "../api/axios";

export function useStudents(search: string = "") {
  return useQuery({
    queryKey: ["students", search],
    queryFn: async () => {
      const params = search ? { params: { search } } : {};
      const res = await axios.get("/students", params);
      return res.data;
    },
  });
}
