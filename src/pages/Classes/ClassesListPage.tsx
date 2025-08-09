// src/pages/Classes/ClassesListPage.tsx (snippet)
import { useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
import api from "../../api/axios";
import DataTable, { ColumnDef } from "../../components/DataTable/DataTable";
import { Link } from "react-router";

type User = { firstName?: string; lastName?: string; email: string };
type Teacher = { id: string; user: User };
type Student = { id: string; user: User };
type ClassRow = {
  id: string;
  name: string;
  description?: string;
  teacher: Teacher;
  students: Student[];
  startAt: string;
  endAt: string;
};

export default function ClassesListPage() {
  const [rows, setRows] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState<number | undefined>(undefined); // set if server-mode
  const [sortBy, setSortBy] = useState<string | null>("startAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>("asc");

  // server-mode fetch (recommended for large data)
  const serverMode = true;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/classes", {
          params: { page, pageSize, sortBy, sortDir },
        });
        // Expect: { items: ClassRow[], total: number }
        if (!mounted) return;
        setRows(data.items ?? data); // fallback if you return plain array
        setTotal(data.total);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [page, pageSize, sortBy, sortDir]);

  const columns = useMemo<ColumnDef<ClassRow>[]>(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        enableSort: true,
        width: "min-w-[180px]",
      },
      {
        header: "Teacher",
        accessorKey: "teacher.user.firstName",
        enableSort: true,
        cell: ({ row }) => {
          const t = row.teacher?.user;
          return (
            <span>
              {[t?.firstName, t?.lastName].filter(Boolean).join(" ") || "-"}
            </span>
          );
        },
      },
      {
        header: "Time",
        accessorKey: "startAt",
        enableSort: true,
        cell: ({ row }) => {
          const s = new Date(row.startAt);
          const e = new Date(row.endAt);
          return (
            <span title={`${s.toLocaleString()} – ${e.toLocaleString()}`}>
              {s.toLocaleDateString()}{" "}
              {s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
              —{" "}
              {e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          );
        },
      },
      {
        header: "Students",
        cell: ({ row }) => <span>{row.students?.length ?? 0}</span>,
        align: "center",
      },
      {
        header: "Open",
        cell: ({ row }) => (
          <Link
            to={`/classes/${row.id}`}
            className="text-brand-600 hover:underline"
          >
            View
          </Link>
        ),
        align: "right",
        width: "w-20",
      },
    ],
    []
  );

  return (
    <DataTable<ClassRow>
      data={rows}
      columns={columns}
      loading={loading}
      density="comfortable"
      serverMode={serverMode}
      sort={{ sortBy, sortDir }}
      onSortChange={({ sortBy, sortDir }) => {
        setSortBy(sortBy ?? null);
        setSortDir(sortDir);
        setPage(1);
      }}
      pagination={{ page, pageSize, total }}
      onPageChange={setPage}
      onPageSizeChange={(s) => {
        setPageSize(s);
        setPage(1);
      }}
      //   toolbarLeft={<div className="font-semibold">Classes</div>}
      //   toolbarRight={
      //     <div className="flex items-center gap-2">
      //       {/* drop in your search/filter controls here */}
      //     </div>
      //   }
      emptyTitle="No classes scheduled"
      emptySubtitle="Create a class to get started."
      rowKey={(r) => r.id}
      rowLink={(r) => `/classes/${r.id}`}
    />
  );
}
