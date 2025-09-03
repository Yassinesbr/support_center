import { useParams, Link, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import AddClassModal from "./AddClassModal";
import {
  useClass,
  useDeleteClass,
  useClassTimes,
  useAddClassTime,
  useUpdateClassTime,
  useDeleteClassTime,
} from "../../hooks/useClasses";
import { useState } from "react";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const mm = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(
    2,
    "0"
  )}`;
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h * 60 + (m || 0)) | 0;
};

// Helper to format cents to currency
function formatCents(cents?: number) {
  const v = cents ?? 0;
  return (v / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

export default function ClassDetailsPage() {
  const { classId } = useParams();
  const nav = useNavigate();
  const { data, isLoading } = useClass(classId);
  const { data: times } = useClassTimes(classId);
  const delClass = useDeleteClass();
  const updTime = useUpdateClassTime();
  const remTime = useDeleteClassTime();

  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (!data) return <div className="p-4">Class not found.</div>;

  const teacherName = data.teacher?.user
    ? `${data.teacher.user.firstName ?? ""} ${
        data.teacher.user.lastName ?? ""
      }`.trim()
    : "-";

  return (
    <>
      <PageMeta title={data.name} description={data.description ?? ""} />
      <PageBreadCrumb pageTitle={data.name} />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column */}
        <div className="md:col-span-2 space-y-6">
          {/* Overview */}
          <div className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200/60 dark:border-gray-800">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold mb-2">Overview</h3>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border px-3 py-1.5 text-sm"
                  onClick={() => setEditOpen(true)}
                >
                  Modify Class
                </button>
                <button
                  className="rounded-lg bg-red-600 text-white px-3 py-1.5 text-sm"
                  onClick={async () => {
                    await delClass.mutateAsync(data.id);
                    nav("/classes");
                  }}
                >
                  Delete
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300">
              {data.description || "No description"}
            </p>
            <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Teacher:</span> {teacherName}
              </div>
              <div>
                <span className="font-semibold">Email:</span>{" "}
                {data.teacher?.user?.email ?? "-"}
              </div>
              <div>
                <span className="font-semibold">Start:</span>{" "}
                {data.startAt ? new Date(data.startAt).toLocaleString() : "-"}
              </div>
              <div>
                <span className="font-semibold">End:</span>{" "}
                {data.endAt ? new Date(data.endAt).toLocaleString() : "-"}
              </div>
            </div>
          </div>

          {/* Students */}
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

        {/* Right column: Schedule manager */}
        <div className="space-y-6">
          <div className="rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200/60 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Schedule</h3>

            <div className="space-y-3">
              {times?.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <select
                    className="rounded-lg border px-2 py-1"
                    value={t.dayOfWeek}
                    onChange={(e) =>
                      updTime.mutate({
                        classId: data.id,
                        timeId: t.id,
                        data: { dayOfWeek: Number(e.target.value) },
                      })
                    }
                  >
                    {days.map((d, idx) => (
                      <option key={idx} value={idx}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <input
                    type="time"
                    className="rounded-lg border px-2 py-1"
                    value={mm(t.startMinutes)}
                    onChange={(e) =>
                      updTime.mutate({
                        classId: data.id,
                        timeId: t.id,
                        data: { startMinutes: toMinutes(e.target.value) },
                      })
                    }
                  />
                  <span>–</span>
                  <input
                    type="time"
                    className="rounded-lg border px-2 py-1"
                    value={mm(t.endMinutes)}
                    onChange={(e) =>
                      updTime.mutate({
                        classId: data.id,
                        timeId: t.id,
                        data: { endMinutes: toMinutes(e.target.value) },
                      })
                    }
                  />

                  <button
                    className="ml-auto rounded-lg border px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    onClick={() =>
                      remTime.mutate({ classId: data.id, timeId: t.id })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}

              {/* add new row */}
              <AddTimeInline classId={data.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Prefilled modal for modify */}
      <AddClassModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={data}
      />

      {/* Billing section */}
      <section className="mt-8 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200/60 dark:border-gray-800">
        <h3 className="text-lg font-semibold mb-4">Billing</h3>
        {data.pricingMode === "PER_STUDENT" ? (
          <>
            <p className="mb-2">
              <strong>Price per student:</strong>{" "}
              {formatCents(data.monthlyPriceCents)}
            </p>
            <p className="mb-2">
              <strong>Number of students:</strong> {data.students?.length ?? 0}
            </p>
            <p className="mb-2">
              <strong>Total (price × students):</strong>{" "}
              {formatCents(
                (data.monthlyPriceCents ?? 0) * (data.students?.length ?? 0)
              )}
            </p>
          </>
        ) : (
          <>
            <p className="mb-2">
              <strong>Fixed class price:</strong>{" "}
              {formatCents((data as any).fixedMonthlyPriceCents)}
            </p>
            <p className="mb-2">
              <strong>Number of students:</strong>{" "}
              <span className="text-gray-500">
                {data.students?.length ?? 0} (not relevant for total)
              </span>
            </p>
            <p className="mb-2">
              <strong>Total:</strong>{" "}
              {formatCents((data as any).fixedMonthlyPriceCents)}
            </p>
          </>
        )}
        {(data as any).teacherFixedMonthlyPayCents != null && (
          <p className="mb-2">
            <strong>Teacher fixed monthly pay:</strong>{" "}
            {formatCents((data as any).teacherFixedMonthlyPayCents)}
          </p>
        )}
      </section>
    </>
  );
}

function AddTimeInline({ classId }: { classId: string }) {
  const addTime = useAddClassTime();
  const [dayOfWeek, setDayOfWeek] = useState(1); // Mon
  const [start, setStart] = useState("20:00");
  const [end, setEnd] = useState("22:00");

  return (
    <div className="flex items-center gap-2 pt-3 border-t dark:border-gray-800">
      <select
        className="rounded-lg border px-2 py-1"
        value={dayOfWeek}
        onChange={(e) => setDayOfWeek(Number(e.target.value))}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, idx) => (
          <option key={idx} value={idx}>
            {d}
          </option>
        ))}
      </select>
      <input
        type="time"
        className="rounded-lg border px-2 py-1"
        value={start}
        onChange={(e) => setStart(e.target.value)}
      />
      <span>–</span>
      <input
        type="time"
        className="rounded-lg border px-2 py-1"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
      />
      <button
        className="ml-auto rounded-lg bg-brand-600 text-white px-3 py-1.5 text-sm"
        onClick={() =>
          addTime.mutate({
            classId,
            data: {
              dayOfWeek,
              startMinutes: toMinutes(start),
              endMinutes: toMinutes(end),
            },
          })
        }
      >
        Add time
      </button>
    </div>
  );
}
