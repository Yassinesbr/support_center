import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import DataTable, { ColumnDef } from "../../components/DataTable/DataTable";
import AddStudentModal from "./AddStudentModal";

type User = { firstName?: string; lastName?: string; email: string };
type StudentRow = {
  id: string;
  user: User;
  birthDate?: string;
  phone?: string;
  enrollmentDate?: string;
  paymentStatus?: string;
};

export default function StudentsListPage() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string | null>("user.firstName");
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>("asc");

  const [addOpen, setAddOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/students", {
        params: { page, pageSize, sortBy, sortDir },
      });
      setRows(data.items ?? data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, sortDir]);

  const columns = useMemo<ColumnDef<StudentRow>[]>(
    () => [
      {
        header: "Name",
        accessorKey: "user.firstName",
        enableSort: true,
        cell: ({ row }) => {
          const u = row.user ?? {};
          return (
            <span>
              {[u.firstName, u.lastName].filter(Boolean).join(" ") || "-"}
            </span>
          );
        },
        width: "min-w-[200px]",
      },
      {
        header: "Email",
        accessorKey: "user.email",
        enableSort: true,
        width: "min-w-[220px]",
      },
      {
        header: "Phone",
        accessorKey: "phone",
        enableSort: true,
      },
      {
        header: "Enrollment",
        accessorKey: "enrollmentDate",
        enableSort: true,
        cell: ({ row }) =>
          row.enrollmentDate
            ? new Date(row.enrollmentDate).toLocaleDateString()
            : "-",
      },
      {
        header: "Payment",
        accessorKey: "paymentStatus",
        enableSort: true,
        align: "center",
        cell: ({ row }) => {
          const v = (row.paymentStatus || "").toLowerCase();
          const badge =
            v === "paid"
              ? "bg-green-100 text-green-800"
              : v === "partial"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800";
          return (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge}`}
            >
              {row.paymentStatus ?? "unpaid"}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Students</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="rounded-lg bg-brand-600 text-white px-3 py-2 text-sm shadow hover:brightness-95"
        >
          + Add Student
        </button>
      </div>

      <div className="">
        <DataTable<StudentRow>
          data={rows}
          columns={columns}
          loading={loading}
          serverMode
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
          emptyTitle="No students yet"
          emptySubtitle="Click “Add Student” to create one."
          rowKey={(r) => r.id}
          rowLink={(r) => `/students/${r.id}`}
        />
      </div>

      <AddStudentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          // Refresh after successful creation
          setPage(1);
          fetchData();
        }}
      />
    </>
  );
}
