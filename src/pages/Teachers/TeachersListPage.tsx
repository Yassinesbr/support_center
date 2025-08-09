// src/pages/Teachers/TeachersListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import api from "../../api/axios";
import DataTable, { ColumnDef } from "../../components/DataTable/DataTable";
import AddTeacherModal from "./AddTeacherModal";

type User = { firstName?: string; lastName?: string; email: string };
type TeacherRow = {
  id: string;
  user: User;
  phone?: string;
  hiringDate?: string;
  subject?: string; // rename to speciality if needed
};

export default function TeachersListPage() {
  // table state
  const [rows, setRows] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string | null>("user.firstName");
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>("asc");
  const [query, setQuery] = useState("");

  // modal
  const [addOpen, setAddOpen] = useState(false);

  const serverMode = true;

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/teachers", {
        params: { page, pageSize, sortBy, sortDir, search: query || undefined },
      });
      // Expect { items, total } — fallback to plain array if your API returns [] without pagination
      setRows(data.items ?? data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, sortDir, query]);

  const columns = useMemo<ColumnDef<TeacherRow>[]>(
    () => [
      {
        header: "Name",
        accessorKey: "user.firstName",
        enableSort: true,
        width: "min-w-[200px]",
        cell: ({ row }) => {
          const u = row.user ?? {};
          const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
          return <span>{name || "-"}</span>;
        },
      },
      {
        header: "Email",
        accessorKey: "user.email",
        enableSort: true,
        width: "min-w-[220px]",
      },
      { header: "Phone", accessorKey: "phone", enableSort: true },
      {
        header: "Hiring date",
        accessorKey: "hiringDate",
        enableSort: true,
        cell: ({ row }) =>
          row.hiringDate ? new Date(row.hiringDate).toLocaleDateString() : "-",
      },
      {
        header: "Subject",
        accessorKey: "subject",
        enableSort: true,
        cell: ({ row }) => row.subject || "-",
      },
    ],
    []
  );

  return (
    <>
      {/* Header + Actions */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Teachers</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            placeholder="Search name, email, phone..."
            className="w-64 rounded-lg border px-3 py-2 text-sm"
          />
          <button
            onClick={() => setAddOpen(true)}
            className="rounded-lg bg-brand-600 text-white px-3 py-2 text-sm shadow hover:brightness-95"
          >
            + Add Teacher
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable<TeacherRow>
        data={rows}
        columns={columns}
        loading={loading}
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
        emptyTitle="No teachers yet"
        emptySubtitle="Click “Add Teacher” to create one."
        rowKey={(r) => r.id}
        rowLink={(r) => `/teachers/${r.id}`}
      />

      {/* Create Modal */}
      <AddTeacherModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          setPage(1);
          fetchData();
        }}
      />
    </>
  );
}
