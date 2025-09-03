import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import DataTable, { ColumnDef } from "../../components/DataTable/DataTable";
import AddStudentModal from "./AddStudentModal";
import Button from "../../components/ui/button/Button";

type User = { firstName?: string; lastName?: string; email: string };
type StudentRow = {
  id: string;
  user: User;
  birthDate?: string;
  phone?: string;
  enrollmentDate?: string;
  paymentStatus?: string;
  monthlyTotalCents?: number;
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
        header: "Monthly",
        accessorKey: "monthlyTotalCents",
        enableSort: true,
        align: "right",
        cell: ({ row }) =>
          typeof row.monthlyTotalCents === "number"
            ? `${(row.monthlyTotalCents / 100).toFixed(2)} MAD`
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
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-brand-500 text-white hover:bg-brand-600"
          size="md"
        >
          Add Student
        </Button>
      </div>

      <DataTable<StudentRow>
        data={rows}
        columns={columns}
        loading={loading}
        serverMode
        sort={{ sortBy, sortDir }}
        onSortChange={({ sortBy, sortDir }) => {
          setSortBy(sortBy ?? null);
           setSortDir(sortDir ?? null);
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
