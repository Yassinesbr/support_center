import { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
import api from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import { Link, useParams } from "react-router";

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

export default function ClassDetailsPage() {
  const { classId } = useParams();
  const [data, setData] = useState<ClassRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // reuse /classes endpoint in-memory, or create /classes/:id if you prefer
        const list = (await api.get<ClassRow[]>("/classes")).data;
        const found = list.find((c) => c.id === classId) ?? null;
        if (mounted) setData(found);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [classId]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!data) return <div className="p-4">Class not found.</div>;

  const teacherName = data.teacher?.user
    ? `${data.teacher.user.firstName ?? ""} ${
        data.teacher.user.lastName ?? ""
      }`.trim()
    : "-";
  const start = new Date(data.startAt);
  const end = new Date(data.endAt);

  return (
    <>
      <PageMeta title={data.name} />
      <PageBreadCrumb title={data.name} subTitle="Class details" />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200/60 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-2">Overview</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {data.description || "No description"}
            </p>
            <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Teacher:</span>{" "}
                {teacherName || "-"}
              </div>
              <div>
                <span className="font-semibold">Email:</span>{" "}
                {data.teacher?.user?.email ?? "-"}
              </div>
              <div>
                <span className="font-semibold">Start:</span>{" "}
                {start.toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">End:</span>{" "}
                {end.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200/60 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-4">
              Students ({data.students?.length ?? 0})
            </h3>
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {(data.students ?? []).map((s) => {
                const name = s.user
                  ? `${s.user.firstName ?? ""} ${s.user.lastName ?? ""}`.trim()
                  : s.id;
                return (
                  <li
                    key={s.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <span>{name}</span>
                    {/* Optional: link to student profile page if available */}
                    <Link
                      to={`/students/${s.id}`}
                      className="text-sm text-brand-600 hover:underline"
                    >
                      Profile
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Side card */}
        <div className="space-y-6">
          <div className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200/60 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-2">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/calendar"
                className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm"
              >
                Open Agenda
              </Link>
              <Link
                to="/classes"
                className="px-3 py-1.5 rounded-lg border text-sm"
              >
                Back to list
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
