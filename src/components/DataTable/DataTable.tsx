import React, { useMemo } from "react";
import { useNavigate } from "react-router"; // <-- Add this import
import {
  ChevronUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

/** ========== Types ========== */
export type SortDir = "asc" | "desc" | null;

export type ColumnDef<T> = {
  header: string | React.ReactNode;
  accessorKey?: keyof T | string; // string allows nested "teacher.user.firstName"
  cell?: (ctx: { row: T; value: any; rowIndex: number }) => React.ReactNode;
  width?: string; // e.g. "w-48", "min-w-[180px]"
  align?: "left" | "center" | "right";
  enableSort?: boolean;
};

export type DataTableToolbarRender =
  | React.ReactNode
  | ((info: { selectedCount: number }) => React.ReactNode);

type PaginationState = {
  page: number; // 1-based
  pageSize: number;
  total?: number; // only needed for serverMode
};

type SortState = {
  sortBy?: string | null; // accessorKey
  sortDir?: SortDir;
};

type Props<T> = {
  data: T[];
  columns: ColumnDef<T>[];

  /** Visual */
  loading?: boolean;
  density?: "comfortable" | "compact";
  className?: string;

  /** Behaviors */
  serverMode?: boolean; // when true, client won’t sort/paginate
  selectableRows?: boolean;
  rowKey?: (row: T, i: number) => string;
  rowLink?: (row: T) => string | void;
  onRowClick?: (row: T) => void;

  /** Sorting */
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;

  /** Pagination */
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;

  /** Toolbars */
  toolbarLeft?: DataTableToolbarRender;
  toolbarRight?: DataTableToolbarRender;

  /** Empty */
  emptyTitle?: string;
  emptySubtitle?: string;
};

/** ========== Helpers ========== */
const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const getNested = (obj: any, path?: string | number) => {
  if (path == null) return undefined;
  if (typeof path === "number") return obj?.[path];
  return path
    .split(".")
    .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

function DefaultEmpty({
  title = "No data",
  subtitle = "There’s nothing to show yet.",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-base font-semibold">{title}</div>
      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {subtitle}
      </div>
    </div>
  );
}

function SkeletonRow({
  cols,
  density = "comfortable",
}: {
  cols: number;
  density?: "comfortable" | "compact";
}) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td
          key={i}
          className={cx(
            "px-4",
            density === "compact" ? "py-2.5" : "py-3.5",
            "border-b border-gray-100 dark:border-gray-800"
          )}
        >
          <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
        </td>
      ))}
    </tr>
  );
}

/** ========== Table ========== */
export default function DataTable<T>({
  data,
  columns,

  loading = false,
  density = "comfortable",
  className,

  serverMode = false,
  selectableRows = false,
  rowKey,
  rowLink,
  onRowClick,

  sort,
  onSortChange,

  pagination,
  onPageChange,
  onPageSizeChange,

  toolbarLeft,
  toolbarRight,

  emptyTitle,
  emptySubtitle,
}: Props<T>) {
  /** derived sorting (client mode only) */
  const sortedData = useMemo(() => {
    if (serverMode || !sort?.sortBy || !sort?.sortDir) return data;

    const col = columns.find((c) => (c.accessorKey as string) === sort.sortBy);
    if (!col) return data;

    const copy = [...data];
    copy.sort((a: any, b: any) => {
      const av = getNested(a, col.accessorKey as string);
      const bv = getNested(b, col.accessorKey as string);
      if (av == null && bv == null) return 0;
      if (av == null) return sort.sortDir === "asc" ? -1 : 1;
      if (bv == null) return sort.sortDir === "asc" ? 1 : -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sort.sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as < bs) return sort.sortDir === "asc" ? -1 : 1;
      if (as > bs) return sort.sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [columns, data, serverMode, sort?.sortBy, sort?.sortDir]);

  /** derived pagination (client mode only) */
  const pagedData = useMemo(() => {
    if (serverMode || !pagination?.page || !pagination?.pageSize)
      return sortedData;
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sortedData.slice(start, end);
  }, [serverMode, sortedData, pagination?.page, pagination?.pageSize]);

  const total = serverMode ? pagination?.total ?? 0 : sortedData.length;
  const pageCount = pagination?.pageSize
    ? Math.max(1, Math.ceil(total / pagination.pageSize))
    : 1;

  const paddingCell = density === "compact" ? "py-2.5" : "py-6";

  const handleSortClick = (col: ColumnDef<T>) => {
    if (!onSortChange || !col.enableSort || !col.accessorKey) return;
    const isActive = sort?.sortBy === col.accessorKey;
    const nextDir: SortDir = !isActive
      ? "asc"
      : sort?.sortDir === "asc"
      ? "desc"
      : sort?.sortDir === "desc"
      ? null
      : "asc";
    onSortChange({
      sortBy: nextDir ? (col.accessorKey as string) : null,
      sortDir: nextDir,
    });
  };

  const renderToolbar = (
    render?: DataTableToolbarRender,
    selectedCount = 0
  ) => {
    if (!render) return null;
    return typeof render === "function" ? render({ selectedCount }) : render;
  };

  const rows = serverMode ? data : pagedData;

  const navigate = useNavigate(); // <-- Add this line

  return (
    <div
      className={cx(
        "w-full rounded-xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm",
        className
      )}
    >
      {/* Toolbar */}
      {(toolbarLeft || toolbarRight) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            {renderToolbar(toolbarLeft)}
          </div>
          <div className="flex items-center gap-2">
            {renderToolbar(toolbarRight)}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          {/* Head */}
          <thead className="bg-gray-50/60 dark:bg-gray-800/40 text-gray-700 dark:text-gray-200">
            <tr>
              {selectableRows && <th className="w-10 px-4 py-3"></th>}
              {columns.map((col, i) => {
                const isActive = sort?.sortBy === col.accessorKey;
                const showSort = col.enableSort && col.accessorKey;
                return (
                  <th
                    key={i}
                    scope="col"
                    className={cx(
                      "px-4 py-3 text-left font-semibold whitespace-nowrap",
                      col.width,
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      showSort && "cursor-pointer select-none"
                    )}
                    onClick={() => showSort && handleSortClick(col)}
                    aria-sort={
                      isActive
                        ? sort?.sortDir === "asc"
                          ? "ascending"
                          : sort?.sortDir === "desc"
                          ? "descending"
                          : "none"
                        : "none"
                    }
                  >
                    <div className="inline-flex items-center gap-1.5">
                      {col.header}
                      {showSort && (
                        <ChevronUpDownIcon
                          className={cx(
                            "h-4 w-4 transition",
                            isActive ? "opacity-100" : "opacity-40"
                          )}
                        />
                      )}
                    </div>
                  </th>
                );
              })}
              <th className="w-12 px-4 py-3 text-right"> </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="text-gray-800 dark:text-gray-100">
            {loading ? (
              <>
                <SkeletonRow
                  cols={columns.length + 1 + (selectableRows ? 1 : 0)}
                  density={density}
                />
                <SkeletonRow
                  cols={columns.length + 1 + (selectableRows ? 1 : 0)}
                  density={density}
                />
                <SkeletonRow
                  cols={columns.length + 1 + (selectableRows ? 1 : 0)}
                  density={density}
                />
              </>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1 + (selectableRows ? 1 : 0)}
                  className="px-4"
                >
                  <DefaultEmpty title={emptyTitle} subtitle={emptySubtitle} />
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => {
                const key = rowKey ? rowKey(row, rowIndex) : String(rowIndex);
                const link = rowLink?.(row as T);
                const clickable = !!link || !!onRowClick;
                const handleRow = () => {
                  if (link) {
                    navigate(link); // <-- Use client-side navigation
                    return;
                  }
                  onRowClick?.(row as T);
                };
                return (
                  <tr
                    key={key}
                    className={cx(
                      "border-b border-gray-100 dark:border-gray-800",
                      clickable &&
                        "hover:bg-gray-50/60 dark:hover:bg-gray-800/50 cursor-pointer"
                    )}
                    onClick={clickable ? handleRow : undefined}
                  >
                    {selectableRows && (
                      <td className={cx("px-4", paddingCell)}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
                        />
                      </td>
                    )}
                    {columns.map((col, colIndex) => {
                      const value = col.accessorKey
                        ? getNested(row, col.accessorKey as string)
                        : undefined;
                      return (
                        <td
                          key={colIndex}
                          className={cx(
                            "px-4 whitespace-nowrap",
                            paddingCell,
                            col.align === "right" && "text-right",
                            col.align === "center" && "text-center"
                          )}
                        >
                          {col.cell
                            ? col.cell({ row: row as T, value, rowIndex })
                            : value ?? "-"}
                        </td>
                      );
                    })}
                    {/* actions slot (right aligned blank cell by default). Pass actions via a column if needed */}
                    <td className={cx("px-4 text-right", paddingCell)} />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {total
              ? `Showing ${Math.min(
                  (pagination.page - 1) * pagination.pageSize + 1,
                  total
                )}–${Math.min(
                  pagination.page * pagination.pageSize,
                  total
                )} of ${total}`
              : `Page ${pagination.page}`}
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
              value={pagination.pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((s) => (
                <option key={s} value={s}>
                  {s} / page
                </option>
              ))}
            </select>
            <div className="inline-flex items-center gap-1">
              <button
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm disabled:opacity-50"
                onClick={() =>
                  onPageChange?.(Math.max(1, (pagination.page ?? 1) - 1))
                }
                disabled={(pagination.page ?? 1) <= 1}
              >
                <ChevronLeftIcon className="h-4 w-4" /> Prev
              </button>
              <span className="px-2 text-sm">
                {pagination.page} / {pageCount}
              </span>
              <button
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm disabled:opacity-50"
                onClick={() => onPageChange?.((pagination.page ?? 1) + 1)}
                disabled={(pagination.page ?? 1) >= pageCount}
              >
                Next <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
